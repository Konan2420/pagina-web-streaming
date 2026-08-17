//#region node_modules/.nitro/vite/services/ssr/assets/roles.server-B8i9ZxAG.js
async function assertSupplier(supabase, userId) {
	if (!userId) throw new Error("No autenticado.");
	const { data: isAdmin } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (isAdmin) return;
	const { data: isSupplier, error } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "proveedor"
	});
	if (error) throw new Error("No se pudo verificar los permisos.");
	if (!isSupplier) throw new Error("Acceso restringido a proveedores.");
}
//#endregion
export { assertSupplier };
