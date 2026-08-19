import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type Tables, type TablesInsert, type TablesUpdate } from "@/integrations/supabase/types";

export const getAdminDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: totalUsers } = await supabaseAdmin
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: totalStock } = await supabaseAdmin
      .from("cuentas_stock")
      .select("*", { count: "exact", head: true });

    const { count: availableStock } = await supabaseAdmin
      .from("cuentas_stock")
      .select("*", { count: "exact", head: true })
      .eq("estado", "disponible");

    const { count: totalSales } = await supabaseAdmin
      .from("ventas")
      .select("*", { count: "exact", head: true });

    const { data: recentSales, error: recentSalesError } = await supabaseAdmin
      .from("ventas")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentSalesError) throw new Error(recentSalesError.message);

    const userIds = [
      ...new Set(
        (recentSales || [])
          .map((sale) => sale.user_id)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    ];
    const { data: salesProfiles, error: salesProfilesError } = userIds.length
      ? await supabaseAdmin.from("profiles").select("id, nombre_completo").in("id", userIds)
      : { data: [], error: null };

    if (salesProfilesError) throw new Error(salesProfilesError.message);

    const salesProfilesMap: Record<
      string,
      Pick<Tables<"profiles">, "id" | "nombre_completo">
    > = Object.fromEntries((salesProfiles || []).map((profile) => [profile.id, profile]));
    const recentSalesWithProfiles = (recentSales || []).map((sale) => ({
      ...sale,
      profiles: sale.user_id ? (salesProfilesMap[sale.user_id] ?? null) : null,
    }));

    return {
      totalUsers: totalUsers || 0,
      totalStock: totalStock || 0,
      availableStock: availableStock || 0,
      totalSales: totalSales || 0,
      recentSales: recentSalesWithProfiles,
    };
  });

export const getServicios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("servicios_streaming").select("*").order("nombre");
    return data || [];
  });

export const getStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("cuentas_stock")
      .select("*, servicios_streaming(nombre)")
      .order("created_at", { ascending: false });
    return data || [];
  });

export const addStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        servicio_id: z.string(),
        email: z.string(),
        password: z.string(),
        perfil: z.string().optional(),
        vencimiento: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cuentas_stock").insert([data]);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const addServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        nombre: z.string(),
        slug: z.string(),
        categoria: z.string(),
        icono: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("servicios_streaming").insert([data]);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().uuid(),
        nombre: z.string().min(1),
        slug: z.string().min(1),
        categoria: z.string().min(1),
        icono: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...changes } = data;
    const { error } = await supabaseAdmin.from("servicios_streaming").update(changes).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteServicio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("servicios_streaming").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cuentas_stock").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getUsersWithRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pError } = await supabaseAdmin
      .from("profiles")
      .select("id, nombre_completo, whatsapp, created_at");

    if (pError) throw new Error(pError.message);

    const { data: roles, error: rError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rError) throw new Error(rError.message);

    const rolePriority = ["admin", "proveedor", "vendedor", "editor", "moderator", "user"] as const;
    return (profiles as Tables<"profiles">[]).map((p) => {
      const assigned = roles.filter((r) => r.user_id === p.id).map((r) => r.role);
      return {
        ...p,
        email: "",
        role: rolePriority.find((role) => assigned.includes(role)) || "user",
      };
    });
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        user_id: z.string(),
        role: z.enum(["admin", "user", "proveedor", "vendedor"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.user_id === context.userId) {
      throw new Error("No puedes cambiar tu propio rol.");
    }

    const { error: baselineError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: data.user_id, role: "user" }, { onConflict: "user_id,role" });
    if (baselineError) throw new Error(baselineError.message);

    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .in("role", ["admin", "proveedor", "vendedor"]);
    if (deleteError) throw new Error(deleteError.message);

    if (data.role !== "user") {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (insertError) throw new Error(insertError.message);
    }

    // Auto-create a supplier profile when an administrator promotes an account.
    if (data.role === "proveedor") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("nombre_completo")
        .eq("id", data.user_id)
        .single();

      const { error: supplierError } = await supabaseAdmin.from("supplier_profiles").upsert(
        {
          user_id: data.user_id,
          display_name: profile?.nombre_completo || "Nuevo Proveedor",
          is_verified: true,
          total_sales: 0,
          rating: 5.0,
        },
        { onConflict: "user_id" },
      );

      if (supplierError)
        throw new Error(`No se pudo crear el perfil del proveedor: ${supplierError.message}`);
    }
    if (data.role === "vendedor") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("nombre_completo, email")
        .eq("id", data.user_id)
        .single();
      const displayName = profile?.nombre_completo?.trim() || profile?.email?.split("@")[0] || "Mi tienda";
      const slug = `tienda-${data.user_id.replaceAll("-", "").slice(0, 10)}`;
      const { error: sellerError } = await supabaseAdmin.from("seller_profiles").upsert(
        { user_id: data.user_id, display_name: displayName, slug },
        { onConflict: "user_id" },
      );
      if (sellerError) throw new Error(`No se pudo crear la tienda del vendedor: ${sellerError.message}`);
    }
    return { success: true };
  });

// New Product Management Functions
export const getAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as Tables<"products">[];
  });

export const upsertProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string().optional(),
        name: z.string().min(1, "El nombre es obligatorio"),
        description: z.string().optional(),
        price: z.number().min(0, "El precio debe ser mayor o igual a 0"),
        image_url: z.string().optional(),
        category: z.string().optional(),
        is_active: z.boolean().default(true),
        descripcion_larga: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...rest } = data;
    if (id) {
      const { error } = await supabaseAdmin
        .from("products")
        .update(rest as TablesUpdate<"products">)
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("products")
        .insert([rest as TablesInsert<"products">]);
      if (error) throw new Error(error.message);
    }
    return { success: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

// Manual Orders Management
export const getManualOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orders, error: oError } = await supabaseAdmin
      .from("manual_orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (oError) throw new Error(oError.message);
    if (!orders || orders.length === 0) return [];

    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    let profilesMap: Record<
      string,
      Pick<Tables<"profiles">, "id" | "nombre_completo" | "whatsapp">
    > = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, nombre_completo, whatsapp")
        .in("id", userIds as string[]);

      profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    }

    return orders.map((o) => ({
      ...o,
      profiles: o.user_id ? profilesMap[o.user_id] : null,
    }));
  });

export const addManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        user_id: z.string().optional().nullable(),
        producto_nombre: z.string().min(1),
        monto: z.number().min(0),
        fecha_adquisicion: z.string(),
        fecha_vencimiento: z.string().optional().nullable(),
        whatsapp_cliente: z.string().optional().nullable(),
        nombre_cliente: z.string().optional().nullable(),
        estado: z.enum(["pendiente", "verificado", "cancelado"]).default("verificado"),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("manual_orders").insert([data]);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateManualOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        id: z.string(),
        estado: z.enum(["pendiente", "verificado", "cancelado"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("manual_orders")
      .update({ estado: data.estado })
      .eq("id", data.id);

    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Actualiza el porcentaje de comisión de un proveedor (solo admin). */
export const setSupplierCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        user_id: z.string().uuid(),
        commission_rate: z.number().min(0).max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("supplier_profiles")
      .update({ commission_rate: data.commission_rate })
      .eq("user_id", data.user_id);

    if (error) throw new Error(error.message);
    return { success: true };
  });
