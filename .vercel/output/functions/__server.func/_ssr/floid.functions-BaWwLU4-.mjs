import { i as getRequestUrl, n as createServerFn } from "./server-lRCoVKEP.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-ChR131yV.mjs";
import { a as objectType, i as numberType, n as booleanType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-DBRgFQFD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/floid.functions-BaWwLU4-.js
var payoutInput = objectType({
	currency: enumType(["PEN", "USD"]),
	amount: numberType().positive().max(3e4),
	entity: stringType().min(2).max(20),
	account: stringType().trim().min(6).max(30),
	name: stringType().trim().min(2).max(120),
	document_type: stringType().trim().max(10).optional(),
	document: stringType().trim().max(20).optional(),
	first_name: stringType().trim().max(60).optional(),
	father_lastname: stringType().trim().max(60).optional(),
	mother_lastname: stringType().trim().max(60).optional(),
	order_id: stringType().trim().max(60).optional(),
	sandbox: booleanType()
});
var getFloidConfigStatus_createServerFn_handler = createServerRpc({
	id: "8f4aa8d017d3f16a4a99966689a8f5f339232494cbfcb030fc4b40e6479a5d92",
	name: "getFloidConfigStatus",
	filename: "src/lib/floid.functions.ts"
}, (opts) => getFloidConfigStatus.__executeServer(opts));
var getFloidConfigStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getFloidConfigStatus_createServerFn_handler, async ({ context }) => {
	const { assertAdmin, isFloidConfigured } = await import("./floid.server-kHpS8yi0.mjs");
	await assertAdmin(context.supabase, context.userId);
	return { configured: isFloidConfigured() };
});
var listPayouts_createServerFn_handler = createServerRpc({
	id: "bc05f26a986c8fc9d3e050e7f65ae472ee2d308c71a91a9813b8e378be404166",
	name: "listPayouts",
	filename: "src/lib/floid.functions.ts"
}, (opts) => listPayouts.__executeServer(opts));
var listPayouts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(listPayouts_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./floid.server-kHpS8yi0.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-mxRd7bB2.mjs");
	const { data, error } = await supabaseAdmin.from("payouts").select("*").order("created_at", { ascending: false }).limit(100);
	if (error) throw new Error(error.message);
	return data ?? [];
});
var createPayout_createServerFn_handler = createServerRpc({
	id: "fea5ac328a3286f847283ef761cd472d0ecfa05ca17e35f875239e09664efcae",
	name: "createPayout",
	filename: "src/lib/floid.functions.ts"
}, (opts) => createPayout.__executeServer(opts));
var createPayout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => payoutInput.parse(d)).handler(createPayout_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin, buildCallbackUrl, createFloidPayout } = await import("./floid.server-kHpS8yi0.mjs");
	const { floidLimitsFor } = await import("./floid-entities-CYSl5pKy.mjs");
	await assertAdmin(context.supabase, context.userId);
	const limits = floidLimitsFor(data.entity, data.currency);
	if (data.amount < limits.min || data.amount > limits.max) throw new Error(`El monto debe estar entre ${limits.min} y ${limits.max} ${data.currency} para ${data.entity}.`);
	const { supabaseAdmin } = await import("./client.server-mxRd7bB2.mjs");
	const { data: row, error: insertError } = await supabaseAdmin.from("payouts").insert({
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
		created_by: context.userId
	}).select().single();
	if (insertError) throw new Error(insertError.message);
	const origin = new URL(getRequestUrl()).origin;
	try {
		const response = await createFloidPayout({
			currency: data.currency,
			amount: data.amount,
			beneficiary: {
				entity: data.entity,
				account: data.account,
				...data.document_type ? { document_type: data.document_type } : {},
				...data.document ? { document: data.document } : {},
				...data.first_name ? { name: data.first_name } : {},
				...data.father_lastname ? { father_lastname: data.father_lastname } : {},
				...data.mother_lastname ? { mother_lastname: data.mother_lastname } : {}
			},
			name: data.name,
			...data.order_id ? { custom: { order_id: data.order_id } } : {},
			...buildCallbackUrl(origin) ? { callbackurl: buildCallbackUrl(origin) } : {},
			sandbox: data.sandbox
		});
		await supabaseAdmin.from("payouts").update({
			payout_caseid: response.payout_caseid ?? null,
			status: response.status ?? "ERROR",
			message: response.data?.message ?? response.msg ?? null,
			error_message: response.data?.error_message ?? null,
			transaction_id: response.data?.transaction_id ?? null,
			raw_response: response
		}).eq("id", row.id);
		return {
			id: row.id,
			status: response.status,
			payout_caseid: response.payout_caseid ?? null,
			message: response.data?.error_message ?? response.data?.message ?? response.msg,
			ok: response.code === 200
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : "Error desconocido";
		await supabaseAdmin.from("payouts").update({
			status: "ERROR",
			error_message: message
		}).eq("id", row.id);
		throw new Error(message);
	}
});
var refreshPayoutStatus_createServerFn_handler = createServerRpc({
	id: "c76e1119215b91987b73dd2ac9d3f3daa21c47a539e47485e5ade3d141a1824d",
	name: "refreshPayoutStatus",
	filename: "src/lib/floid.functions.ts"
}, (opts) => refreshPayoutStatus.__executeServer(opts));
var refreshPayoutStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(refreshPayoutStatus_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin, getFloidPayoutStatus } = await import("./floid.server-kHpS8yi0.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-mxRd7bB2.mjs");
	const { data: row, error } = await supabaseAdmin.from("payouts").select("id, payout_caseid").eq("id", data.id).maybeSingle();
	if (error) throw new Error(error.message);
	if (!row?.payout_caseid) throw new Error("Este payout aún no tiene un identificador de Floid.");
	const response = await getFloidPayoutStatus(row.payout_caseid);
	await supabaseAdmin.from("payouts").update({
		status: response.status ?? "ERROR",
		message: response.data?.message ?? response.msg ?? null,
		error_message: response.data?.error_message ?? null,
		transaction_id: response.data?.transaction_id ?? null,
		raw_response: response
	}).eq("id", row.id);
	return {
		status: response.status,
		message: response.data?.message ?? response.msg
	};
});
//#endregion
export { createPayout_createServerFn_handler, getFloidConfigStatus_createServerFn_handler, listPayouts_createServerFn_handler, refreshPayoutStatus_createServerFn_handler };
