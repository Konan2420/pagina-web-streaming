import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { Tables } from "@/integrations/supabase/types";
import { AVATAR_EFFECT_VALUES } from "@/lib/avatar-effects";

export const getSupplierDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count: totalInventory } = await supabaseAdmin
      .from("account_inventory")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", context.userId);

    const { count: availableStock } = await supabaseAdmin
      .from("account_inventory")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", context.userId)
      .eq("status", "available");

    const { count: soldCount } = await supabaseAdmin
      .from("account_inventory")
      .select("*", { count: "exact", head: true })
      .eq("supplier_id", context.userId)
      .eq("status", "assigned");

    const { data: profile } = await supabaseAdmin
      .from("supplier_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();

    // Ganancias: precio de los productos vendidos * % de comisión del proveedor
    const { data: soldRows } = await supabaseAdmin
      .from("account_inventory")
      .select("products(price)")
      .eq("supplier_id", context.userId)
      .eq("status", "assigned");

    const grossRevenue = (soldRows || []).reduce(
      (acc, row) => acc + Number(row.products?.price || 0),
      0,
    );
    const commissionRate = Number(profile?.commission_rate ?? 70);
    const earnings = (grossRevenue * commissionRate) / 100;

    return {
      totalInventory: totalInventory || 0,
      availableStock: availableStock || 0,
      totalSales: soldCount || 0,
      isVerified: profile?.is_verified || false,
      hasProfile: !!profile,
      displayName: profile?.display_name || "",
      avatarUrl: profile?.avatar_url || "",
      avatarEffect: (profile as { avatar_effect?: string })?.avatar_effect || "none",
      rating: profile?.total_reviews ? Number(profile.rating) : (null as number | null),
      totalReviews: Number(profile?.total_reviews ?? 0),
      commissionRate,
      grossRevenue,
      earnings,
    };
  });

/** Reseñas recibidas por el proveedor autenticado. */
export const getSupplierReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("supplier_ratings")
      .select("id, rating, comment, created_at")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return data || [];
  });

export const getSupplierSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("account_inventory")
      .select("id, email, status, created_at, assigned_at, order_id, products(name, price)")
      .eq("supplier_id", context.userId)
      .eq("status", "assigned")
      .order("assigned_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

export const deleteSupplierInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error: readErr } = await supabaseAdmin
      .from("account_inventory")
      .select("id, supplier_id, status")
      .eq("id", data.id)
      .maybeSingle();

    if (readErr) throw new Error(readErr.message);
    if (!row) throw new Error("Cuenta no encontrada.");
    if (row.supplier_id !== context.userId) throw new Error("No autorizado.");
    if (row.status !== "available") throw new Error("Solo puedes eliminar cuentas disponibles.");

    const { error } = await supabaseAdmin
      .from("account_inventory")
      .delete()
      .eq("id", data.id)
      .eq("supplier_id", context.userId)
      .eq("status", "available");

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getSupplierInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("account_inventory")
      .select("*, products(name)")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  });

/** Productos que el proveedor puede abastecer: los asignados a él (o todos si es admin). */
export const getSupplierProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    let query = supabaseAdmin.from("products").select("*").eq("is_active", true);
    if (!isAdmin) query = query.eq("supplier_id", context.userId);

    const { data, error } = await query.order("name");
    if (error) throw new Error(error.message);
    return data || [];
  });

export const addSupplierInventoryBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        product_id: z.string().uuid(),
        accounts: z
          .array(
            z.object({
              email: z.string().trim().email().max(320),
              password: z.string().min(1).max(500),
              access_link: z.string().trim().url().max(2_000).optional(),
              notes: z.string().trim().max(2_000).optional(),
            }),
          )
          .min(1)
          .max(100),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });

    const { data: product } = await supabaseAdmin
      .from("products")
      .select("id, supplier_id, is_active")
      .eq("id", data.product_id)
      .maybeSingle();

    if (!product || !product.is_active) throw new Error("Producto no disponible.");
    if (!isAdmin && product.supplier_id !== context.userId) {
      throw new Error("No estás autorizado para abastecer este producto.");
    }

    const inventoryData = data.accounts.map((acc) => ({
      ...acc,
      product_id: data.product_id,
      supplier_id: context.userId,
      status: "available",
    }));

    const { error } = await supabaseAdmin.from("account_inventory").insert(inventoryData);

    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getSupplierProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("supplier_profiles")
      .select(
        "user_id, display_name, avatar_url, avatar_effect, is_verified, rating, total_reviews, joined_at",
      )
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return {
      user_id: context.userId,
      display_name: data?.display_name ?? "",
      avatar_url: data?.avatar_url ?? "",
      avatar_effect: data?.avatar_effect ?? "none",
      is_verified: data?.is_verified ?? false,
      rating: data?.rating ?? null,
      total_reviews: data?.total_reviews ?? 0,
      joined_at: data?.joined_at ?? null,
      exists: !!data,
    };
  });

export const updateSupplierProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        display_name: z.string().min(2),
        avatar_url: z.string().optional(),
        avatar_effect: z.enum(AVATAR_EFFECT_VALUES).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { assertSupplier } = await import("@/lib/roles.server");
    await assertSupplier(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Un único registro por proveedor: actualizar si existe, insertar si no.
    const { data: existing, error: readErr } = await supabaseAdmin
      .from("supplier_profiles")
      .select("id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (readErr) throw new Error(readErr.message);

    const payload = {
      display_name: data.display_name,
      ...(data.avatar_url !== undefined ? { avatar_url: data.avatar_url } : {}),
      ...(data.avatar_effect !== undefined ? { avatar_effect: data.avatar_effect } : {}),
    };

    const { data: saved, error } = existing
      ? await supabaseAdmin
          .from("supplier_profiles")
          .update(payload)
          .eq("user_id", context.userId)
          .select("user_id, display_name, avatar_url, avatar_effect")
          .single()
      : await supabaseAdmin
          .from("supplier_profiles")
          .insert({ user_id: context.userId, ...payload })
          .select("user_id, display_name, avatar_url, avatar_effect")
          .single();

    if (error) {
      console.error("[updateSupplierProfile] fallo al guardar", {
        userId: context.userId,
        effect: data.avatar_effect,
        code: (error as { code?: string }).code,
        message: error.message,
      });
      throw new Error(error.message);
    }

    return { success: true, profile: saved };
  });
