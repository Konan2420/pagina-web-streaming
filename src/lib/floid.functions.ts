import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequestUrl } from "@tanstack/react-start/server";
import type { Json } from "@/integrations/supabase/types";

const payoutInput = z.object({
  currency: z.enum(["PEN", "USD"]),
  amount: z.number().positive().max(30000),
  entity: z.string().min(2).max(20),
  account: z.string().trim().min(6).max(30),
  name: z.string().trim().min(2).max(120),
  document_type: z.string().trim().max(10).optional(),
  document: z.string().trim().max(20).optional(),
  first_name: z.string().trim().max(60).optional(),
  father_lastname: z.string().trim().max(60).optional(),
  mother_lastname: z.string().trim().max(60).optional(),
  order_id: z.string().trim().max(60).optional(),
  sandbox: z.boolean(),
});

export const getFloidConfigStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin, isFloidConfigured } = await import("@/lib/floid.server");
    await assertAdmin(context.supabase, context.userId);
    return { configured: isFloidConfigured() };
  });

export const listPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/floid.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payouts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createPayout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => payoutInput.parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, buildCallbackUrl, createFloidPayout } = await import("@/lib/floid.server");
    const { floidLimitsFor } = await import("@/lib/floid-entities");
    await assertAdmin(context.supabase, context.userId);

    const limits = floidLimitsFor(data.entity, data.currency);
    if (data.amount < limits.min || data.amount > limits.max) {
      throw new Error(
        `El monto debe estar entre ${limits.min} y ${limits.max} ${data.currency} para ${data.entity}.`,
      );
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: insertError } = await supabaseAdmin
      .from("payouts")
      .insert({
        entity: data.entity,
        account: data.account,
        beneficiary_name: data.name,
        document_type: data.document_type ?? null,
        document: data.document ?? null,
        first_name: data.first_name ?? null,
        father_lastname: data.father_lastname ?? null,
        mother_lastname: data.mother_lastname ?? null,
        currency: data.currency,
        amount: data.amount,
        status: "PENDING",
        sandbox: data.sandbox,
        custom: data.order_id ? { order_id: data.order_id } : {},
        created_by: context.userId,
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    const origin = new URL(getRequestUrl()).origin;

    try {
      const response = await createFloidPayout({
        currency: data.currency,
        amount: data.amount,
        beneficiary: {
          entity: data.entity,
          account: data.account,
          ...(data.document_type ? { document_type: data.document_type } : {}),
          ...(data.document ? { document: data.document } : {}),
          ...(data.first_name ? { name: data.first_name } : {}),
          ...(data.father_lastname ? { father_lastname: data.father_lastname } : {}),
          ...(data.mother_lastname ? { mother_lastname: data.mother_lastname } : {}),
        },
        name: data.name,
        ...(data.order_id ? { custom: { order_id: data.order_id } } : {}),
        ...(buildCallbackUrl(origin) ? { callbackurl: buildCallbackUrl(origin) } : {}),
        sandbox: data.sandbox,
      });

      await supabaseAdmin
        .from("payouts")
        .update({
          payout_caseid: response.payout_caseid ?? null,
          status: response.status ?? "ERROR",
          message: response.data?.message ?? response.msg ?? null,
          error_message: response.data?.error_message ?? null,
          transaction_id: response.data?.transaction_id ?? null,
          raw_response: response as unknown as Json,
        })
        .eq("id", row.id);

      return {
        id: row.id,
        status: response.status,
        payout_caseid: response.payout_caseid ?? null,
        message: response.data?.error_message ?? response.data?.message ?? response.msg,
        ok: response.code === 200,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      await supabaseAdmin
        .from("payouts")
        .update({ status: "ERROR", error_message: message })
        .eq("id", row.id);
      throw new Error(message);
    }
  });

export const refreshPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin, getFloidPayoutStatus } = await import("@/lib/floid.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("payouts")
      .select("id, payout_caseid")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row?.payout_caseid) throw new Error("Este payout aún no tiene un identificador de Floid.");

    const response = await getFloidPayoutStatus(row.payout_caseid);

    await supabaseAdmin
      .from("payouts")
      .update({
        status: response.status ?? "ERROR",
        message: response.data?.message ?? response.msg ?? null,
        error_message: response.data?.error_message ?? null,
        transaction_id: response.data?.transaction_id ?? null,
        raw_response: response as unknown as Json,
      })
      .eq("id", row.id);

    return { status: response.status, message: response.data?.message ?? response.msg };
  });
