//#region node_modules/.nitro/vite/services/ssr/assets/floid.server-kHpS8yi0.js
/**
* Cliente server-only para la API de Payouts de Floid (Perú).
* Docs: https://readme.floid.io — /pe/payout/create_v2 y /pe/payout/status_v2
*/
var FLOID_BASE_URL = "https://api.floid.app";
function getToken() {
	const token = process.env["FLOID_API_TOKEN"];
	if (!token) throw new Error("FLOID_API_TOKEN no está configurado. Agrega el token que te entregue Floid para poder enviar payouts.");
	return token;
}
/** URL pública a la que Floid enviará las notificaciones de estado. */
function buildCallbackUrl(origin) {
	const secret = process.env["FLOID_WEBHOOK_SECRET"];
	if (!secret || !origin) return void 0;
	return `${origin}/api/public/webhooks/floid?token=${encodeURIComponent(secret)}`;
}
async function floidPost(path, body) {
	const res = await fetch(`${FLOID_BASE_URL}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${getToken()}`
		},
		body: JSON.stringify(body)
	});
	const text = await res.text();
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new Error(`Respuesta inválida de Floid [${res.status}]: ${text.slice(0, 300)}`);
	}
	return parsed;
}
function createFloidPayout(payload) {
	return floidPost("/pe/payout/create_v2", payload);
}
function getFloidPayoutStatus(payoutCaseId) {
	return floidPost("/pe/payout/status_v2", { payout_caseid: payoutCaseId });
}
function isFloidConfigured() {
	return Boolean(process.env["FLOID_API_TOKEN"]);
}
/** Lanza si el usuario autenticado no tiene rol admin. */
async function assertAdmin(supabase, userId) {
	const { data } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (!data) throw new Error("Solo un administrador puede gestionar payouts.");
}
//#endregion
export { assertAdmin, buildCallbackUrl, createFloidPayout, getFloidPayoutStatus, isFloidConfigured };
