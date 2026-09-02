import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

const providerProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "El nombre es obligatorio").max(160),
  description: z.string().trim().max(500).optional(),
  descripcion_larga: z.string().trim().max(5_000).optional(),
  price: z.number().finite().min(0, "El precio debe ser mayor o igual a 0"),
  category: z.string().trim().max(80).optional(),
  image_url: z.string().trim().url().nullable().optional(),
  icon_id: z.string().trim().max(120).nullable().optional(),
  service_id: z.string().uuid().nullable().optional(),
  duration_days: z.number().int().positive().max(3_650).default(30),
  is_renewable: z.boolean().default(true),
});

/** Summary for the provider / distributor dashboard. */
export const getProviderDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [
      { count: totalProducts, error: totalProductsError },
      { count: publishedProducts, error: publishedProductsError },
      { count: totalInventory, error: totalInventoryError },
      { count: availableInventory, error: availableInventoryError },
      { count: totalSales, error: totalSalesError },
    ] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId),
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId)
        .eq("is_active", true),
      supabaseAdmin
        .from("account_inventory")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId),
      supabaseAdmin
        .from("account_inventory")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId)
        .eq("status", "available"),
      supabaseAdmin
        .from("account_inventory")
        .select("id", { count: "exact", head: true })
        .eq("supplier_id", context.userId)
        .eq("status", "assigned"),
    ]);

    const error = [
      totalProductsError,
      publishedProductsError,
      totalInventoryError,
      availableInventoryError,
      totalSalesError,
    ].find(Boolean);
    if (error) throw new Error(error.message);

    return {
      totalProducts: totalProducts ?? 0,
      publishedProducts: publishedProducts ?? 0,
      draftProducts: Math.max((totalProducts ?? 0) - (publishedProducts ?? 0), 0),
      totalInventory: totalInventory ?? 0,
      availableInventory: availableInventory ?? 0,
      totalSales: totalSales ?? 0,
    };
  });

/** Latest stock-out alerts for the signed-in provider. No customer data or credentials are returned. */
export const getProviderStockAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("owner_notifications")
      .select("id, product_id, notification_type, title, body, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Products owned by the signed-in provider. Drafts are included for editing. */
export const getProviderProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Tables<"products">[];
  });

/** Creates a provider draft or updates a product already owned by that provider. */
export const saveProviderProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => providerProductSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...productData } = data;

    if (id) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from("products")
        .select("id, supplier_id")
        .eq("id", id)
        .maybeSingle();
      if (existingError) throw new Error(existingError.message);
      if (!existing || existing.supplier_id !== context.userId) {
        throw new Error("No puedes editar un producto que no te pertenece.");
      }

      const { data: updated, error } = await supabaseAdmin
        .from("products")
        .update({ ...productData, is_active: false } as TablesUpdate<"products">)
        .eq("id", id)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return { product: updated as Tables<"products">, requiresApproval: true };
    }

    const { data: created, error } = await supabaseAdmin
      .from("products")
      .insert({
        ...productData,
        supplier_id: context.userId,
        is_active: false,
      } as TablesInsert<"products">)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { product: created as Tables<"products">, requiresApproval: true };
  });

/** El proveedor puede pausar o reactivar su producto publicado sin tocar inventario ni credenciales. */
export const setProviderProductAvailability = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({
        id: z.string().uuid(),
        is_catalog_available: z.boolean(),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: updated, error } = await supabaseAdmin
      .from("products")
      .update({ is_catalog_available: data.is_catalog_available })
      .eq("id", data.id)
      .eq("supplier_id", context.userId)
      .select("id, is_catalog_available")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!updated) throw new Error("No puedes cambiar la disponibilidad de un producto que no te pertenece.");
    return updated;
  });

/** Deletes only provider-owned products without inventory or completed sales. */
export const deleteProviderProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, supplier_id")
      .eq("id", data.id)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product || product.supplier_id !== context.userId) {
      throw new Error("No puedes eliminar un producto que no te pertenece.");
    }

    const { count, error: inventoryError } = await supabaseAdmin
      .from("account_inventory")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.id);
    if (inventoryError) throw new Error(inventoryError.message);
    if ((count ?? 0) > 0) {
      throw new Error("No se puede eliminar un producto que ya tiene inventario o ventas.");
    }

    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getProviderInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("account_inventory")
      .select("id, product_id, email, status, created_at, assigned_at, products(name)")
      .eq("supplier_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addProviderInventoryBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({
        product_id: z.string().uuid(),
        accounts: z
          .array(
            z.object({
              email: z.string().trim().email().max(320),
              password: z.string().min(1).max(500),
            }),
          )
          .min(1)
          .max(100),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("id, supplier_id")
      .eq("id", data.product_id)
      .maybeSingle();
    if (productError) throw new Error(productError.message);
    if (!product || product.supplier_id !== context.userId) {
      throw new Error("Solo puedes cargar inventario para tus propios productos.");
    }

    const { error } = await supabaseAdmin.from("account_inventory").insert(
      data.accounts.map((account) => ({
        ...account,
        product_id: data.product_id,
        supplier_id: context.userId,
        status: "available",
      })),
    );
    if (error) throw new Error(error.message);
    return { inserted: data.accounts.length };
  });

export const deleteProviderInventoryItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("account_inventory")
      .delete()
      .eq("id", data.id)
      .eq("supplier_id", context.userId)
      .eq("status", "available");
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const getProviderSales = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertProvider } = await import("@/lib/roles.server");
    await assertProvider(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data, error } = await supabaseAdmin
      .from("account_inventory")
      .select("id, product_id, status, assigned_at, created_at, products(name, price)")
      .eq("supplier_id", context.userId)
      .eq("status", "assigned")
      .order("assigned_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });
