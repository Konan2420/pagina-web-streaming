import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const productIdSchema = z.object({ productId: z.string().uuid() });
const elevatedRoles = new Set(["admin", "proveedor", "distribuidor"]);

const createClientSchema = z.object({
  nombreCompleto: z.string().trim().min(2).max(120),
  email: z
    .union([z.string().trim().email().max(320), z.literal("")])
    .optional()
    .transform((value) => value?.toLowerCase() || null),
  whatsapp: z.string().trim().max(40).optional().default(""),
});

const catalogOrderSchema = z.object({
  productId: z.string().uuid(),
  clientId: z.string().uuid(),
  salePricePen: z.number().finite().nonnegative().optional(),
  autoRenew: z.boolean().optional().default(false),
});

const pricingSettingsSchema = z.object({
  defaultMarkupPercent: z.number().finite().min(0).max(1000),
  penPerUsd: z.number().finite().positive().max(100),
});

type AuthContext = {
  userId: string;
  supabase: SupabaseClient<Database>;
};

async function getActorRoles(context: AuthContext) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("No se pudo verificar tu rol.");

  const roles = new Set((data ?? []).map((row) => row.role));
  return {
    isAdmin: roles.has("admin"),
    canResell: [...roles].some((role) => elevatedRoles.has(role)),
  };
}

/** Registra una apertura agregada de la PDP; no acepta ni conserva identidad del visitante. */
export const recordCatalogProductView = createServerFn({ method: "POST" })
  .validator((data) => productIdSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: totalViews, error } = await supabaseAdmin.rpc("record_catalog_product_view", {
      p_product_id: data.productId,
    });
    if (error) throw new Error("No se pudo registrar la vista del producto.");
    return totalViews;
  });

/**
 * Contexto de compra seguro para la PDP. El costo se devuelve solo a roles
 * comerciales; el cliente final solo recibe su precio público final.
 */
export const getCatalogPurchaseContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => productIdSchema.parse(data))
  .handler(async ({ data, context }) => {
    const access = await getActorRoles(context as AuthContext);
    const { data: product, error: productError } = await context.supabase
      .from("products")
      .select(
        "id, name, price, duration_days, is_renewable, is_active, is_catalog_available, supplier_id, publisher_name",
      )
      .eq("id", data.productId)
      .maybeSingle();
    if (productError || !product) throw new Error("No se encontró el producto.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: settings }, { data: costRow }] = await Promise.all([
      supabaseAdmin
        .from("catalog_pricing_settings")
        .select("default_markup_percent, pen_per_usd")
        .eq("id", "default")
        .maybeSingle(),
      access.canResell
        ? supabaseAdmin
            .from("catalog_product_costs")
            .select("unit_cost_pen")
            .eq("product_id", product.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const markupPercent = Number(settings?.default_markup_percent ?? 20);
    const penPerUsd = Number(settings?.pen_per_usd ?? 3.7);
    const unitCostPen = Number(costRow?.unit_cost_pen ?? product.price);
    const suggestedSalePricePen = Math.round(unitCostPen * (1 + markupPercent / 100) * 100) / 100;
    const walletDebitPen = access.canResell ? unitCostPen : Number(product.price);

    let supplierName = product.publisher_name?.trim() || "CMD Streaming";
    let supplierWhatsapp: string | null = null;
    let storeSlug: string | null = null;

    if (product.supplier_id) {
      const [{ data: profile }, { data: supplier }, { data: storefront }] = await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("nombre_completo, whatsapp")
          .eq("id", product.supplier_id)
          .maybeSingle(),
        supabaseAdmin
          .from("supplier_profiles")
          .select("display_name")
          .eq("user_id", product.supplier_id)
          .maybeSingle(),
        supabaseAdmin
          .from("storefront_settings")
          .select("store_slug")
          .eq("store_owner_id", product.supplier_id)
          .eq("is_public", true)
          .maybeSingle(),
      ]);
      supplierName = supplier?.display_name?.trim() || profile?.nombre_completo?.trim() || supplierName;
      supplierWhatsapp = profile?.whatsapp?.trim() || null;
      storeSlug = storefront?.store_slug ?? null;
    }

    return {
      canResell: access.canResell,
      isAdmin: access.isAdmin,
      isAvailable: Boolean(product.is_active && product.is_catalog_available),
      supplierName,
      supplierWhatsapp,
      storeSlug,
      defaultMarkupPercent: markupPercent,
      suggestedSalePricePen: access.canResell ? suggestedSalePricePen : null,
      walletDebitPen,
      walletDebitUsd: Math.round((walletDebitPen / penPerUsd) * 100) / 100,
      publicSalePricePen: Number(product.price),
      unitCostPen: access.canResell ? unitCostPen : null,
      durationDays: product.duration_days,
      isRenewable: product.is_renewable,
    };
  });

/** Clientes seguros: el selector usa el CRM propio del vendedor, no perfiles globales. */
export const getCatalogOrderClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getActorRoles(context as AuthContext);
    const { data, error } = await context.supabase.rpc("get_catalog_order_clients");
    if (error) throw new Error("No se pudieron cargar los clientes registrados.");
    return { canAssignOtherClients: access.canResell, clients: data ?? [] };
  });

/** Registra un cliente CRM sin crear ni invitar una cuenta de acceso. */
export const inviteCatalogOrderClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => createClientSchema.parse(data))
  .handler(async ({ data, context }) => {
    const access = await getActorRoles(context as AuthContext);
    if (!access.canResell) throw new Error("No tienes permiso para crear clientes.");

    const { data: client, error } = await context.supabase
      .from("business_clients")
      .insert({
        owner_id: context.userId,
        nombre: data.nombreCompleto,
        telefono: data.whatsapp || null,
        email: data.email,
      })
      .select("id, nombre, telefono")
      .single();
    if (error || !client) throw new Error("No se pudo registrar el cliente.");
    return {
      client: { id: client.id, nombre_completo: client.nombre, whatsapp: client.telefono },
      invitationSent: false,
      created: true,
    };
  });

/** Compra inmediata desde la PDP: el RPC aplica todas las validaciones y débitos en una sola transacción. */
export const createCatalogOrderFromWallet = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => catalogOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("place_catalog_order_from_wallet", {
      p_product_id: data.productId,
      p_client_id: data.clientId,
      p_sale_price_pen: data.salePricePen ?? 0,
      p_auto_renew: data.autoRenew,
    });
    if (error) throw new Error(error.message);
    const order = result?.[0];
    if (!order) throw new Error("No se pudo crear el pedido.");
    return order;
  });

export const getCatalogPricingSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getActorRoles(context as AuthContext);
    if (!access.isAdmin) throw new Error("No tienes permiso para ver esta configuración.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("catalog_pricing_settings")
      .select("default_markup_percent, pen_per_usd")
      .eq("id", "default")
      .single();
    if (error) throw new Error("No se pudo cargar la configuración de precios.");
    return data;
  });

export const saveCatalogPricingSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => pricingSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const access = await getActorRoles(context as AuthContext);
    if (!access.isAdmin) throw new Error("No tienes permiso para cambiar esta configuración.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("catalog_pricing_settings").upsert(
      {
        id: "default",
        default_markup_percent: data.defaultMarkupPercent,
        pen_per_usd: data.penPerUsd,
      },
      { onConflict: "id" },
    );
    if (error) throw new Error("No se pudo guardar la configuración de precios.");
    return { saved: true };
  });
