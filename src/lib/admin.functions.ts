import { createServerFn } from "@tanstack/react-start";
import type { User } from "@supabase/supabase-js";
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
      .from("account_inventory")
      .select("*", { count: "exact", head: true });

    const { count: availableStock } = await supabaseAdmin
      .from("account_inventory")
      .select("*", { count: "exact", head: true })
      .in("status", ["available", "disponible"]);

    const { count: totalSales } = await supabaseAdmin
      .from("orders")
      .select("*", { count: "exact", head: true });

    const { data: recentSales, error: recentSalesError } = await supabaseAdmin
      .from("orders")
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
    const { data } = await supabaseAdmin
      .from("servicios_streaming")
      .select("*")
      .order("display_order")
      .order("nombre");
    return data || [];
  });

export const getStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("account_inventory")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    return data || [];
  });

export const addStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        email: z.string(),
        password: z.string(),
        access_link: z.string().url().optional(),
        notes: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("account_inventory")
      .insert([{ ...data, status: "available" }]);
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
        icon_url: z.string().url().nullable().optional(),
        display_order: z.number().int().min(0).default(0),
        is_visible: z.boolean().default(true),
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
        icon_url: z.string().url().nullable().optional(),
        display_order: z.number().int().min(0).default(0),
        is_visible: z.boolean().default(true),
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
    const { error } = await supabaseAdmin
      .from("account_inventory")
      .delete()
      .eq("id", data.id)
      .in("status", ["available", "disponible"]);
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
      .select("id, nombre_completo, email, whatsapp, created_at");

    if (pError) throw new Error(pError.message);

    const { data: roles, error: rError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");

    if (rError) throw new Error(rError.message);

    // `profiles` se crea mediante un trigger de Auth. La fuente de verdad para
    // las cuentas registradas es auth.users: así el panel no omite una cuenta
    // aunque su perfil se esté creando o haya fallado históricamente.
    const authUsers: User[] = [];
    let page = 1;
    const perPage = 1_000;

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);
      authUsers.push(...data.users);
      if (data.users.length < perPage) break;
      page += 1;
    }

    const rolePriority = ["admin", "proveedor", "distribuidor", "user"] as const;
    const profilesById = new Map((profiles as Tables<"profiles">[]).map((profile) => [profile.id, profile]));
    const rolesByUserId = new Map<string, string[]>();
    for (const role of roles) {
      const assigned = rolesByUserId.get(role.user_id) ?? [];
      assigned.push(role.role);
      rolesByUserId.set(role.user_id, assigned);
    }

    const toAdminUser = (user: {
      id: string;
      email?: string | null;
      created_at: string;
      user_metadata?: Record<string, unknown>;
    }) => {
      const profile = profilesById.get(user.id);
      const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.nombre_completo;
      const assigned = rolesByUserId.get(user.id) ?? [];
      return {
        id: user.id,
        nombre_completo:
          profile?.nombre_completo || (typeof metadataName === "string" ? metadataName : null),
        email: user.email || profile?.email || null,
        whatsapp: profile?.whatsapp || null,
        created_at: profile?.created_at || user.created_at,
        role: rolePriority.find((role) => assigned.includes(role)) || "user",
      };
    };

    const registeredUsers = authUsers.map(toAdminUser);
    const registeredIds = new Set(registeredUsers.map((user) => user.id));
    const orphanProfiles = (profiles as Tables<"profiles">[])
      .filter((profile) => !registeredIds.has(profile.id))
      .map((profile) =>
        toAdminUser({
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
        }),
      );

    return [...registeredUsers, ...orphanProfiles].sort((left, right) =>
      right.created_at.localeCompare(left.created_at),
    );
  });

export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        user_id: z.string(),
        role: z.enum(["admin", "proveedor", "distribuidor", "user"]),
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

    // Mantiene el rol base "user" y una única elevación explícita.
    // Los roles heredados editor/moderador/vendedor no conservan privilegios.
    const { error: deleteError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", data.user_id)
      .neq("role", "user");
    if (deleteError) throw new Error(deleteError.message);

    if (data.role !== "user") {
      const { error: insertError } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.user_id, role: data.role }, { onConflict: "user_id,role" });
      if (insertError) throw new Error(insertError.message);
    }

    if (data.role === "proveedor") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("nombre_completo, email")
        .eq("id", data.user_id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);

      const displayName =
        profile?.nombre_completo?.trim() || profile?.email?.split("@")[0] || "Proveedor";
      const { error: supplierError } = await supabaseAdmin.from("supplier_profiles").upsert(
        {
          user_id: data.user_id,
          display_name: displayName,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
      if (supplierError) throw new Error(supplierError.message);
    }

    if (data.role === "distribuidor") {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("nombre_completo, email")
        .eq("id", data.user_id)
        .maybeSingle();
      if (profileError) throw new Error(profileError.message);

      const displayName =
        profile?.nombre_completo?.trim() || profile?.email?.split("@")[0] || "Distribuidor";
      const { error: distributorError } = await supabaseAdmin.from("distributor_profiles").upsert(
        {
          user_id: data.user_id,
          display_name: displayName,
        },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
      if (distributorError) throw new Error(distributorError.message);
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
        icon_id: z.string().trim().min(1).nullable().optional(),
        image_url: z.string().optional(),
        category: z.string().optional(),
        service_id: z.string().uuid().nullable().optional(),
        is_active: z.boolean().default(true),
        is_catalog_available: z.boolean().default(true),
        is_renewable: z.boolean().default(true),
        duration_days: z.number().int().positive().default(30),
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

/** Approves a pending order and returns only the credentials assigned to that order. */
export const approvePaymentAndDeliver = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);

    const { data: order, error: orderError } = await context.supabase
      .from("orders")
      .select("id, producto_id, producto_nombre")
      .eq("id", data.orderId)
      .maybeSingle();

    if (orderError) throw new Error(orderError.message);
    if (!order) throw new Error("No se encontró el pedido.");

    const parsedProductId = z.string().uuid().safeParse(order.producto_id);
    if (!parsedProductId.success) {
      throw new Error("Este pedido no está asociado a un producto de inventario válido.");
    }

    const { data: assigned, error: assignError } = await context.supabase.rpc(
      "assign_inventory_to_order",
      {
        _order_id: order.id,
        _product_id: parsedProductId.data,
      },
    );

    if (assignError) {
      if (assignError.message.toLowerCase().includes("stock")) {
        throw new Error("No hay cuentas disponibles para este producto.");
      }
      throw new Error(assignError.message);
    }
    if (!assigned) throw new Error("No fue posible asignar una cuenta al pedido.");

    const { data: delivery, error: deliveryError } = await context.supabase
      .from("delivered_accounts")
      .select("email, password, access_link, notes")
      .eq("order_id", order.id)
      .maybeSingle();

    if (deliveryError) throw new Error(deliveryError.message);
    if (!delivery)
      throw new Error("La entrega se completó, pero no se pudieron recuperar sus credenciales.");

    return {
      orderId: order.id,
      productName: order.producto_nombre,
      delivery,
    };
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

type UpcomingExpiration = {
  id: string;
  source: "order" | "manual_order";
  customerName: string | null;
  whatsapp: string | null;
  productName: string;
  expirationDate: string;
};

function limaDateOffset(days: number) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  const date = new Date(`${values.year}-${values.month}-${values.day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Upcoming automatic and manual expirations, available only to administrators. */
export const getUpcomingExpirations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const from = limaDateOffset(0);
    const to = limaDateOffset(7);

    const [{ data: orders, error: ordersError }, { data: manualOrders, error: manualOrdersError }] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("id, user_id, producto_nombre, fecha_vencimiento")
          .gte("fecha_vencimiento", from)
          .lte("fecha_vencimiento", to)
          .in("estado", ["entregado", "delivered", "pagado"]),
        supabaseAdmin
          .from("manual_orders")
          .select(
            "id, user_id, producto_nombre, fecha_vencimiento, nombre_cliente, whatsapp_cliente",
          )
          .gte("fecha_vencimiento", from)
          .lte("fecha_vencimiento", to)
          .eq("estado", "verificado"),
      ]);
    if (ordersError) throw new Error(ordersError.message);
    if (manualOrdersError) throw new Error(manualOrdersError.message);

    const userIds = [
      ...new Set(
        [...(orders ?? []), ...(manualOrders ?? [])]
          .map((order) => order.user_id)
          .filter((userId): userId is string => Boolean(userId)),
      ),
    ];
    const { data: profiles, error: profilesError } = userIds.length
      ? await supabaseAdmin
          .from("profiles")
          .select("id, nombre_completo, whatsapp")
          .in("id", userIds)
      : { data: [], error: null };
    if (profilesError) throw new Error(profilesError.message);

    const profilesById = Object.fromEntries(
      (profiles ?? []).map((profile) => [profile.id, profile]),
    );
    const automatic: UpcomingExpiration[] = (orders ?? []).flatMap((order) => {
      if (!order.fecha_vencimiento) return [];
      const profile = profilesById[order.user_id];
      return [
        {
          id: order.id,
          source: "order",
          customerName: profile?.nombre_completo ?? null,
          whatsapp: profile?.whatsapp ?? null,
          productName: order.producto_nombre,
          expirationDate: order.fecha_vencimiento,
        },
      ];
    });
    const manual: UpcomingExpiration[] = (manualOrders ?? []).flatMap((order) => {
      if (!order.fecha_vencimiento) return [];
      const profile = order.user_id ? profilesById[order.user_id] : undefined;
      return [
        {
          id: order.id,
          source: "manual_order",
          customerName: profile?.nombre_completo || order.nombre_cliente || null,
          whatsapp: profile?.whatsapp || order.whatsapp_cliente || null,
          productName: order.producto_nombre,
          expirationDate: order.fecha_vencimiento,
        },
      ];
    });

    return [...automatic, ...manual].sort((left, right) =>
      left.expirationDate.localeCompare(right.expirationDate),
    );
  });
