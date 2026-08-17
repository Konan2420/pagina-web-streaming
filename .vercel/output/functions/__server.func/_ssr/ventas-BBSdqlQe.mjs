import { t as supabase } from "./client-BoZLFmz6.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ventas-BBSdqlQe.js
var ventasQueryOptions = queryOptions({
	queryKey: ["admin-ventas-list"],
	queryFn: async () => {
		const { data, error } = await supabase.from("ventas").select("*").order("created_at", { ascending: false });
		if (error) throw error;
		const ventas = data || [];
		const userIds = [...new Set(ventas.map((v) => v.user_id).filter(Boolean))];
		let profilesMap = {};
		if (userIds.length > 0) {
			const { data: profiles } = await supabase.from("profiles").select("id, nombre_completo, whatsapp").in("id", userIds);
			profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
		}
		return ventas.map((sale) => ({
			...sale,
			profiles: sale.user_id ? profilesMap[sale.user_id] ?? null : null
		}));
	}
});
//#endregion
export { ventasQueryOptions as t };
