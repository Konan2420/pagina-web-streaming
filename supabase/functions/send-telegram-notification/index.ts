import { createClient } from "npm:@supabase/supabase-js@2";

type DatabaseWebhookPayload = {
  record?: { id?: string };
  id?: string;
};

type AdminEvent = {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

type ClaimedDelivery = {
  delivery_id: string;
  attempt_count: number;
};

type TelegramResponse = {
  ok?: boolean;
  error_code?: number;
  description?: string;
  result?: { message_id?: number };
};

const telegramEndpoint = (botToken: string) =>
  `https://api.telegram.org/bot${botToken}/sendMessage`;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function logTelegramEvent(event: string, details: Record<string, unknown> = {}) {
  // Never include bot tokens, chat IDs, authorization headers or full message
  // bodies in logs. These records are intended only to identify the failing
  // stage of the delivery pipeline.
  console.log(JSON.stringify({ scope: "telegram-notification", event, ...details }));
}

function displayValue(value: unknown, fallback = "No especificado") {
  if (value === null || value === undefined || String(value).trim() === "") return fallback;
  return String(value);
}

function displayMethod(value: unknown) {
  const labels: Record<string, string> = {
    lemon_cash: "Lemon Cash",
    yape_plin: "Yape / Plin",
  };
  const method = displayValue(value);
  return labels[method] ?? method;
}

function displayAmount(amount: unknown, currency: unknown) {
  if (typeof amount === "number" || (typeof amount === "string" && amount.trim() !== "")) {
    const parsed = Number(amount);
    if (Number.isFinite(parsed)) return `${displayValue(currency, "PEN")} ${parsed.toFixed(2)}`;
  }
  return displayValue(amount);
}

async function enrichEventDetails(
  supabase: ReturnType<typeof createClient>,
  event: AdminEvent,
): Promise<AdminEvent> {
  const data = { ...(event.data ?? {}) };
  const sourceId = String(data.rechargeId ?? data.orderId ?? event.entity_id ?? event.id);

  try {
    if (event.entity_type === "recargas") {
      const { data: recharge, error } = await supabase
        .from("recargas")
        .select("monto, moneda, metodo, estado, nombre_declarado")
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      if (recharge) {
        Object.assign(data, {
          amount: recharge.monto,
          currency: recharge.moneda,
          method: recharge.metodo,
          status: recharge.estado,
          clientName: recharge.nombre_declarado,
        });
      }
    } else if (event.entity_type === "orders") {
      const { data: order, error } = await supabase
        .from("orders")
        .select(
          "producto_id, producto_nombre, precio, sale_price_pen, estado, payment_verified, user_id",
        )
        .eq("id", sourceId)
        .maybeSingle();
      if (error) throw error;
      if (order) {
        Object.assign(data, {
          productName: order.producto_nombre,
          price: order.sale_price_pen ?? order.precio,
          status: order.estado,
          paymentVerified: order.payment_verified,
        });

        const [productResult, profileResult] = await Promise.all([
          supabase
            .from("products")
            .select("name, duration_days")
            .eq("id", String(order.producto_id))
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("nombre_completo, email")
            .eq("id", String(order.user_id))
            .maybeSingle(),
        ]);
        if (productResult.error) throw productResult.error;
        if (profileResult.error) throw profileResult.error;
        if (productResult.data) {
          Object.assign(data, {
            productName: productResult.data.name ?? data.productName,
            durationDays: productResult.data.duration_days,
          });
        }
        if (profileResult.data) {
          data.clientName = profileResult.data.nombre_completo || profileResult.data.email;
        }
      }
    }
  } catch (error) {
    logTelegramEvent("event_details_lookup_failed", {
      eventId: event.id,
      entityType: event.entity_type,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return { ...event, data };
}

function formatTelegramMessage(event: AdminEvent) {
  const data = event.data ?? {};
  const client = displayValue(data.clientName ?? data.customerName ?? data.name, event.body);

  if (event.entity_type === "recargas" || event.event_type.includes("recharge")) {
    return [
      event.event_type === "recharge_verified" ? "✅ RECARGA VERIFICADA" : "🔔 NUEVA RECARGA",
      `Cliente: ${client}`,
      `Monto: ${displayAmount(data.amount, data.currency)}`,
      `Método de pago: ${displayMethod(data.method)}`,
      `Estado: ${displayValue(data.status)}`,
    ].join("\n");
  }

  if (event.entity_type === "orders" || event.event_type.includes("sale")) {
    return [
      "🛒 NUEVO PEDIDO",
      `Cliente: ${client}`,
      `Producto: ${displayValue(data.productName ?? data.serviceName ?? data.product ?? event.body)}`,
      `Plan: ${displayValue(data.plan ?? (data.durationDays ? `${data.durationDays} días` : undefined))}`,
      `Precio: ${displayAmount(data.salePricePen ?? data.price, "PEN")}`,
      `Estado: ${displayValue(data.status ?? (data.paymentVerified ? "pagado" : undefined))}`,
    ].join("\n");
  }

  return `${event.title}\n${event.body}`;
}

Deno.serve(async (request) => {
  logTelegramEvent("request_received", { method: request.method });
  if (request.method !== "POST") {
    logTelegramEvent("request_rejected", { reason: "method_not_allowed" });
    return json({ error: "Method not allowed" }, 405);
  }

  // This endpoint is invoked by pg_net, not by a browser session. The shared
  // secret exists only in Supabase Vault and Edge Function secrets.
  // Reuse the internal secret already used by the native admin push webhook.
  // A separate value may still be supplied for isolated environments.
  const expectedSecret =
    Deno.env.get("ADMIN_TELEGRAM_WEBHOOK_SECRET") ?? Deno.env.get("ADMIN_PUSH_WEBHOOK_SECRET");
  const suppliedSecret = request.headers.get("x-admin-telegram-secret");
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    logTelegramEvent("request_rejected", {
      reason: "invalid_webhook_secret",
      hasExpectedSecret: Boolean(expectedSecret),
      hasSuppliedSecret: Boolean(suppliedSecret),
    });
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    logTelegramEvent("request_rejected", { reason: "invalid_json" });
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const eventId = payload.record?.id ?? payload.id;
  if (!eventId || typeof eventId !== "string") {
    logTelegramEvent("request_rejected", { reason: "missing_event_id" });
    return json({ error: "Missing admin event id" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  logTelegramEvent("configuration_checked", {
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasServiceRoleKey: Boolean(serviceRoleKey),
    hasBotToken: Boolean(botToken),
    hasChatId: Boolean(chatId),
  });
  if (!supabaseUrl || !serviceRoleKey || !botToken || !chatId) {
    logTelegramEvent("delivery_failed", { eventId, reason: "missing_edge_function_secret" });
    return json({ error: "Telegram Edge Function secrets are unavailable" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: eventError } = await supabase
    .from("admin_event_log")
    .select("id, event_type, entity_type, entity_id, title, body, data")
    .eq("id", eventId)
    .maybeSingle<AdminEvent>();
  if (eventError) {
    logTelegramEvent("delivery_failed", { eventId, reason: "event_lookup_failed" });
    return json({ error: eventError.message }, 500);
  }
  if (!event) {
    logTelegramEvent("delivery_failed", { eventId, reason: "event_not_found" });
    return json({ error: "Event not found" }, 404);
  }
  logTelegramEvent("event_received", {
    eventId: event.id,
    eventType: event.event_type,
    entityType: event.entity_type,
  });

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_admin_notification_delivery",
    { _event_id: event.id, _channel: "telegram" },
  );
  if (claimError) {
    logTelegramEvent("delivery_failed", { eventId: event.id, reason: "delivery_claim_failed" });
    return json({ error: claimError.message }, 500);
  }

  const delivery = (Array.isArray(claimed) ? claimed[0] : null) as ClaimedDelivery | null;
  // Another invocation is already delivering this event, or it was already
  // delivered. Returning 202 avoids creating a duplicate Telegram message.
  if (!delivery?.delivery_id) {
    logTelegramEvent("delivery_skipped", {
      eventId: event.id,
      reason: "already_processing_or_sent",
    });
    return json({ delivered: false, reason: "already_processing_or_sent" }, 202);
  }

  logTelegramEvent("delivery_claimed", {
    eventId: event.id,
    deliveryId: delivery.delivery_id,
    attempt: delivery.attempt_count,
  });
  const enrichedEvent = await enrichEventDetails(supabase, event);
  const message = formatTelegramMessage(enrichedEvent);
  let lastError = "Telegram API did not accept the message";
  let providerMessageId: string | null = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(telegramEndpoint(botToken), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          disable_web_page_preview: true,
        }),
      });
      const responseBody = (await response.json().catch(() => null)) as TelegramResponse | null;
      logTelegramEvent("telegram_response", {
        eventId: event.id,
        httpStatus: response.status,
        telegramOk: responseBody?.ok === true,
        telegramErrorCode: responseBody?.error_code ?? null,
      });
      if (response.ok && responseBody?.ok) {
        providerMessageId = String(responseBody.result?.message_id ?? "");
        break;
      }
      lastError =
        typeof responseBody?.description === "string"
          ? responseBody.description
          : `Telegram API HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      logTelegramEvent("telegram_request_error", { eventId: event.id, attempt, error: lastError });
    }

    if (attempt < 3) await sleep(250 * attempt);
  }

  if (!providerMessageId) {
    await supabase
      .from("admin_notification_deliveries")
      .update({ status: "failed", last_error: lastError })
      .eq("id", delivery.delivery_id);
    logTelegramEvent("delivery_failed", {
      eventId: event.id,
      deliveryId: delivery.delivery_id,
      reason: "telegram_rejected_message",
      error: lastError,
    });
    return json({ delivered: false, error: lastError }, 502);
  }

  const { error: updateError } = await supabase
    .from("admin_notification_deliveries")
    .update({
      status: "sent",
      provider_message_id: providerMessageId,
      sent_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", delivery.delivery_id);
  if (updateError) {
    logTelegramEvent("delivery_failed", { eventId: event.id, reason: "delivery_update_failed" });
    return json({ error: updateError.message }, 500);
  }

  logTelegramEvent("delivery_sent", { eventId: event.id, deliveryId: delivery.delivery_id });
  return json({ delivered: true, deliveryId: delivery.delivery_id });
});
