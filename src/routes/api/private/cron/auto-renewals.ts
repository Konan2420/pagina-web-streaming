import { createFileRoute } from "@tanstack/react-router";

/**
 * Vercel Cron invokes this endpoint once a day. It is intentionally server-only:
 * the browser never receives CRON_SECRET or the Supabase service-role key.
 */
export const Route = createFileRoute("/api/private/cron/auto-renewals")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const cronSecret = process.env["CRON_SECRET"];
        const authorization = request.headers.get("authorization");

        if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.rpc("process_due_auto_renewals", {
          p_limit: 50,
        });

        if (error) {
          console.error("Automatic renewal cron failed:", error.message);
          return Response.json(
            { ok: false, error: "Automatic renewal processing failed" },
            { status: 500 },
          );
        }

        return Response.json({ ok: true, processed: data ?? [] });
      },
    },
  },
});
