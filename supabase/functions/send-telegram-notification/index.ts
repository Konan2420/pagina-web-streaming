import { createClient } from "npm:@supabase/supabase-js@2";

type DatabaseWebhookPayload = {
  record?: { id?: string };
  id?: string;
};

type AdminEvent = {
  id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

type ClaimedDelivery = {
  delivery_id: string;
  attempt_count: number;
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

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // This endpoint is invoked by pg_net, not by a browser session. The shared
  // secret exists only in Supabase Vault and Edge Function secrets.
  // Reuse the internal secret already used by the native admin push webhook.
  // A separate value may still be supplied for isolated environments.
  const expectedSecret =
    Deno.env.get("ADMIN_TELEGRAM_WEBHOOK_SECRET") ?? Deno.env.get("ADMIN_PUSH_WEBHOOK_SECRET");
  const suppliedSecret = request.headers.get("x-admin-telegram-secret");
  if (!expectedSecret || suppliedSecret !== expectedSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  let payload: DatabaseWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid JSON payload" }, 400);
  }

  const eventId = payload.record?.id ?? payload.id;
  if (!eventId || typeof eventId !== "string") {
    return json({ error: "Missing admin event id" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!supabaseUrl || !serviceRoleKey || !botToken || !chatId) {
    return json({ error: "Telegram Edge Function secrets are unavailable" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: eventError } = await supabase
    .from("admin_event_log")
    .select("id, title, body, data")
    .eq("id", eventId)
    .maybeSingle<AdminEvent>();
  if (eventError) return json({ error: eventError.message }, 500);
  if (!event) return json({ error: "Event not found" }, 404);

  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_admin_notification_delivery",
    { _event_id: event.id, _channel: "telegram" },
  );
  if (claimError) return json({ error: claimError.message }, 500);

  const delivery = (Array.isArray(claimed) ? claimed[0] : null) as ClaimedDelivery | null;
  // Another invocation is already delivering this event, or it was already
  // delivered. Returning 202 avoids creating a duplicate Telegram message.
  if (!delivery?.delivery_id) {
    return json({ delivered: false, reason: "already_processing_or_sent" }, 202);
  }

  const message = `${event.title}\n${event.body}`;
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
      const responseBody = await response.json().catch(() => null);
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
    }

    if (attempt < 3) await sleep(250 * attempt);
  }

  if (!providerMessageId) {
    await supabase
      .from("admin_notification_deliveries")
      .update({ status: "failed", last_error: lastError })
      .eq("id", delivery.delivery_id);
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
  if (updateError) return json({ error: updateError.message }, 500);

  return json({ delivered: true, deliveryId: delivery.delivery_id });
});
