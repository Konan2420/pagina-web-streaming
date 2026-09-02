import { createClient } from "npm:@supabase/supabase-js@2";

type DatabaseWebhookPayload = {
  record?: { id?: string };
  id?: string;
};

type PushToken = {
  id: string;
  expo_push_token: string;
};

const expoPushEndpoint = "https://exp.host/--/api/v2/push/send";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function chunks<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // This function is deliberately configured with verify_jwt=false because a
  // database webhook is not a user session. It is protected by a separate
  // secret header that exists only in Supabase Dashboard/Vault configuration.
  const expectedSecret = Deno.env.get("ADMIN_PUSH_WEBHOOK_SECRET");
  const suppliedSecret = request.headers.get("x-admin-push-secret");
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
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase Edge Function secrets are unavailable" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: event, error: eventError } = await supabase
    .from("admin_event_log")
    .select("id, title, body, data")
    .eq("id", eventId)
    .maybeSingle();
  if (eventError) return json({ error: eventError.message }, 500);
  if (!event) return json({ error: "Event not found" }, 404);

  const { data: tokens, error: tokenError } = await supabase
    .from("admin_push_tokens")
    .select("id, expo_push_token")
    .eq("is_active", true);
  if (tokenError) return json({ error: tokenError.message }, 500);

  const activeTokens = (tokens ?? []) as PushToken[];
  if (!activeTokens.length) {
    await supabase
      .from("admin_event_log")
      .update({ push_attempted_at: new Date().toISOString(), push_result: { sent: 0, reason: "no_active_tokens" } })
      .eq("id", event.id);
    return json({ sent: 0, reason: "no_active_tokens" });
  }

  const tickets: unknown[] = [];
  const invalidTokenIds: string[] = [];
  for (const batch of chunks(activeTokens, 100)) {
    const response = await fetch(expoPushEndpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(
        batch.map((token) => ({
          to: token.expo_push_token,
          sound: "default",
          title: event.title,
          body: event.body,
          channelId: "admin-events",
          data: event.data,
        })),
      ),
    });

    const responseBody = await response.json().catch(() => ({ error: "Invalid Expo response" }));
    if (!response.ok) return json({ error: "Expo Push API failed", detail: responseBody }, 502);

    const batchTickets = Array.isArray(responseBody?.data) ? responseBody.data : [];
    tickets.push(...batchTickets);
    batchTickets.forEach((ticket: { status?: string; details?: { error?: string } }, index: number) => {
      if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
        invalidTokenIds.push(batch[index].id);
      }
    });
  }

  if (invalidTokenIds.length) {
    await supabase
      .from("admin_push_tokens")
      .update({ is_active: false })
      .in("id", invalidTokenIds);
  }

  await supabase
    .from("admin_event_log")
    .update({
      push_attempted_at: new Date().toISOString(),
      push_result: { sent: activeTokens.length, invalidated: invalidTokenIds.length, tickets },
    })
    .eq("id", event.id);

  return json({ sent: activeTokens.length, invalidated: invalidTokenIds.length });
});
