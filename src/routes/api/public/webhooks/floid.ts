import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const webhookSchema = z.object({
  event: z.string(),
  payout_caseid: z.string().min(1).max(100),
  status: z.string().max(30),
  entity: z.string().max(30).optional(),
  data: z
    .object({
      amount: z.number().optional(),
      currency: z.string().optional(),
      beneficiary_name: z.string().optional(),
      beneficiary_account: z.string().optional(),
      transaction_id: z.string().optional(),
      message: z.string().optional(),
      updated_at: z.string().optional(),
    })
    .optional(),
});

export const Route = createFileRoute("/api/public/webhooks/floid")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["FLOID_WEBHOOK_SECRET"];
        const token = new URL(request.url).searchParams.get("token");
        if (!secret || token !== secret) {
          return new Response("Invalid token", { status: 401 });
        }

        let payload: z.infer<typeof webhookSchema>;
        try {
          payload = webhookSchema.parse(await request.json());
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        if (payload.event !== "payout.update") {
          return new Response("ok");
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin
          .from("payouts")
          .update({
            status: payload.status,
            message: payload.data?.message ?? null,
            transaction_id: payload.data?.transaction_id ?? null,
            raw_response: payload as never,
          })
          .eq("payout_caseid", payload.payout_caseid);

        if (error) {
          console.error("Floid webhook update failed:", error.message);
          return new Response("Update failed", { status: 500 });
        }

        return new Response("ok");
      },
    },
  },
});
