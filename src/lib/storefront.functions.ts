import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const ownerTargetSchema = z.object({ ownerId: z.string().uuid().optional() });
const sourceTypeSchema = z.enum(["master_catalog", "smm_generator"]);

const overrideSchema = ownerTargetSchema.extend({
  sourceType: sourceTypeSchema,
  sourceId: z.string().uuid(),
  customName: z.string().trim().min(2).max(180).nullable().optional(),
  customDescription: z.string().trim().max(2400).nullable().optional(),
  salePricePen: z.number().finite().nonnegative().nullable().optional(),
  promoPricePen: z.number().finite().nonnegative().nullable().optional(),
  isVisible: z.boolean().optional(),
  displayOrder: z.number().int().min(0).max(1_000_000).optional(),
});

const storefrontSettingsSchema = ownerTargetSchema.extend({
  displayName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).nullable().optional(),
  logoUrl: z.string().trim().url().max(2048).nullable().optional(),
  bannerUrl: z.string().trim().url().max(2048).nullable().optional(),
  templateKey: z.string().trim().min(3).max(63),
  avatarFrameKey: z.enum(["neon", "fire", "gold"]).nullable().optional(),
  facebookUrl: z.string().trim().url().max(2048).nullable().optional(),
  instagramUrl: z.string().trim().url().max(2048).nullable().optional(),
  tiktokUrl: z.string().trim().url().max(2048).nullable().optional(),
  xUrl: z.string().trim().url().max(2048).nullable().optional(),
  youtubeUrl: z.string().trim().url().max(2048).nullable().optional(),
  isPublic: z.boolean(),
  storeSlug: z.string().trim().min(3).max(63),
  availabilityMode: z.enum(["manual", "schedule"]).default("manual"),
  isAvailable: z.boolean().default(true),
  opensAt: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  closesAt: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  timezone: z.string().trim().min(3).max(64).default("America/Lima"),
});

const comboSchema = ownerTargetSchema.extend({
  name: z.string().trim().min(2).max(140),
  description: z.string().trim().max(1000).nullable().optional(),
  salePricePen: z.number().finite().nonnegative(),
  promoPricePen: z.number().finite().nonnegative().nullable().optional(),
  isVisible: z.boolean().optional(),
  itemOverrideIds: z.array(z.string().uuid()).min(2).max(30),
});

const deleteOverrideSchema = ownerTargetSchema.extend({ overrideId: z.string().uuid() });
const publicStorefrontSchema = z.object({ slug: z.string().trim().min(3).max(63) });
const publicStorefrontPurchaseSchema = z.object({
  slug: z.string().trim().min(3).max(63),
  overrideId: z.string().uuid(),
  autoRenew: z.boolean().optional().default(false),
});

const elevatedRoles = new Set(["admin", "proveedor", "distribuidor"]);

type AuthContext = {
  userId: string;
  supabase: SupabaseClient<Database>;
};

async function getActorAccess(context: AuthContext) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId);
  if (error) throw new Error("No se pudo verificar el rol de la tienda.");

  const roles = new Set((data ?? []).map((row) => row.role));
  const isAdmin = roles.has("admin");
  if (!isAdmin && ![...roles].some((role) => elevatedRoles.has(role))) {
    throw new Error("No tienes permiso para gestionar una tienda.");
  }
  return { isAdmin };
}

async function resolveStoreOwner(context: AuthContext, requestedOwnerId?: string) {
  const { isAdmin } = await getActorAccess(context);
  if (isAdmin && !requestedOwnerId) {
    throw new Error("Selecciona una tienda de proveedor o distribuidor para administrarla.");
  }
  if (isAdmin && requestedOwnerId) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", requestedOwnerId)
      .in("role", ["proveedor", "distribuidor"])
      .limit(1);

    if (error) throw new Error("No se pudo validar la tienda seleccionada.");
    if (!data?.length) {
      throw new Error("Solo puedes supervisar tiendas de proveedores o distribuidores.");
    }

    return { ownerId: requestedOwnerId, isAdmin };
  }
  return { ownerId: context.userId, isAdmin };
}

function makeDefaultSlug(ownerId: string) {
  return `tienda-${ownerId.replace(/-/g, "").slice(0, 12)}`;
}

function normalizeSlug(value: string) {
  return value
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 63);
}

async function getStorefrontOwnerOptions() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: commercialRoles, error: rolesError } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role")
    .in("role", ["proveedor", "distribuidor"]);
  if (rolesError) {
    throw new Error("No se pudo cargar la lista de tiendas disponibles.");
  }
  const ownerIds = [...new Set((commercialRoles ?? []).map((row) => row.user_id))];
  if (ownerIds.length === 0) return [];
  const [profilesResult, suppliersResult, distributorsResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("id, nombre_completo").in("id", ownerIds),
    supabaseAdmin.from("supplier_profiles").select("user_id, display_name").in("user_id", ownerIds),
    supabaseAdmin.from("distributor_profiles").select("user_id, display_name").in("user_id", ownerIds),
  ]);
  if (profilesResult.error || suppliersResult.error || distributorsResult.error) {
    throw new Error("No se pudo cargar la lista de tiendas disponibles.");
  }
  const names = new Map<string, string>();
  for (const profile of profilesResult.data ?? []) names.set(profile.id, profile.nombre_completo || "Tienda");
  for (const supplier of suppliersResult.data ?? []) names.set(supplier.user_id, supplier.display_name);
  for (const distributor of distributorsResult.data ?? []) names.set(distributor.user_id, distributor.display_name);
  return ownerIds
    .map((user_id) => ({ user_id, display_name: names.get(user_id) || "Tienda" }))
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "es"));
}

async function ensureStorefrontSettings(ownerId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("storefront_settings")
    .select("store_owner_id, store_slug, display_name, description, logo_url, banner_url, is_public, availability_mode, is_available, opens_at, closes_at, timezone, template_key, avatar_frame_key, facebook_url, instagram_url, tiktok_url, x_url, youtube_url, last_published_at, last_published_by")
    .eq("store_owner_id", ownerId)
    .maybeSingle();
  if (existingError) throw new Error("No se pudo cargar la configuración de la tienda.");
  if (existing) return existing;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("nombre_completo")
    .eq("id", ownerId)
    .maybeSingle();
  const displayName = profile?.nombre_completo?.trim() || "Mi Tienda";
  const { data: created, error: createError } = await supabaseAdmin
    .from("storefront_settings")
    .insert({
      store_owner_id: ownerId,
      store_slug: makeDefaultSlug(ownerId),
      display_name: displayName.slice(0, 100),
      is_public: true,
    })
    .select("store_owner_id, store_slug, display_name, description, logo_url, banner_url, is_public, availability_mode, is_available, opens_at, closes_at, timezone, template_key, avatar_frame_key, facebook_url, instagram_url, tiktok_url, x_url, youtube_url, last_published_at, last_published_by")
    .single();
  if (createError) throw new Error("No se pudo crear la configuración inicial de la tienda.");
  return created;
}

/** Datos internos para Mi Tienda; los costos nunca salen por la vista pública. */
export const getStorefrontManagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => ownerTargetSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const actorAccess = await getActorAccess(context);

    // El administrador supervisa tiendas comerciales: no se le crea ni se le muestra
    // un escaparate propio cuando todavía no ha elegido un dueño explícitamente.
    if (actorAccess.isAdmin && !data.ownerId) {
      return {
        mode: "supervision" as const,
        isAdmin: true,
        ownerId: null,
        settings: null,
        ownerOptions: await getStorefrontOwnerOptions(),
        products: [],
        combos: [],
        comboItems: [],
        totalSales: 0,
      };
    }

    const { ownerId, isAdmin } = await resolveStoreOwner(context, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const settings = await ensureStorefrontSettings(ownerId);

    const [
      productsResult,
      costsResult,
      inventoryResult,
      servicesResult,
      overridesResult,
      combosResult,
      comboItemsResult,
      salesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, name, description, category, image_url, price, publisher_name")
        .eq("is_active", true)
        .order("name"),
      supabaseAdmin.from("catalog_product_costs").select("product_id, unit_cost_pen"),
      supabaseAdmin.from("account_inventory").select("product_id, status"),
      supabaseAdmin
        .from("social_service_catalog")
        .select("id, name, description, platform, category, unit_cost_pen, provider_key")
        .eq("is_active", true)
        .order("platform")
        .order("name"),
      supabaseAdmin
        .from("store_product_overrides")
        .select(
      "id, source_type, master_product_id, social_service_id, custom_name, custom_description, sale_price_pen, promo_price_pen, is_visible, display_order",
        )
        .eq("store_owner_id", ownerId),
      supabaseAdmin
        .from("store_combos")
      .select("id, name, description, sale_price_pen, promo_price_pen, is_visible, display_order")
      .eq("store_owner_id", ownerId)
      .order("display_order")
      .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("store_combo_items")
        .select("combo_id, store_product_override_id, quantity"),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("storefront_owner_id", ownerId)
        .neq("estado", "cancelado"),
    ]);

    const failures = [
      productsResult.error,
      costsResult.error,
      inventoryResult.error,
      servicesResult.error,
      overridesResult.error,
      combosResult.error,
      comboItemsResult.error,
      salesResult.error,
    ].filter(Boolean);
    if (failures.length > 0) throw new Error("No se pudo cargar la información de Mi Tienda.");

    const overrideBySource = new Map(
      (overridesResult.data ?? []).map((item) => {
        const sourceId = item.master_product_id || item.social_service_id || "";
        return [`${item.source_type}:${sourceId}`, item];
      }),
    );
    const costByProduct = new Map(
      (costsResult.data ?? []).map((item) => [item.product_id, item.unit_cost_pen]),
    );
    const stockByProduct = new Map<string, number>();
    for (const item of inventoryResult.data ?? []) {
      if (item.status === "available" || item.status === "disponible") {
        stockByProduct.set(item.product_id, (stockByProduct.get(item.product_id) ?? 0) + 1);
      }
    }

    const masterProducts = (productsResult.data ?? []).map((product) => {
      const override = overrideBySource.get(`master_catalog:${product.id}`);
      return {
        sourceType: "master_catalog" as const,
        sourceId: product.id,
        overrideId: override?.id ?? null,
        group: "Catálogo Streaming, Licencias y Cuentas",
        providerName: product.publisher_name || "CMD Streaming",
        iconLabel: product.name.slice(0, 1).toUpperCase(),
        originalName: product.name,
        originalDescription: product.description,
        category: product.category || "Sin categoría",
        stock: stockByProduct.get(product.id) ?? 0,
        unitCostPen: costByProduct.get(product.id) ?? product.price,
        costIsProvisional: !costByProduct.has(product.id),
        customName: override?.custom_name ?? null,
        customDescription: override?.custom_description ?? null,
        salePricePen: override?.sale_price_pen ?? null,
        promoPricePen: override?.promo_price_pen ?? null,
        isVisible: override?.is_visible ?? false,
        displayOrder: override?.display_order ?? 0,
      };
    });

    const smmServices = (servicesResult.data ?? []).map((service) => {
      const override = overrideBySource.get(`smm_generator:${service.id}`);
      return {
        sourceType: "smm_generator" as const,
        sourceId: service.id,
        overrideId: override?.id ?? null,
        group: `Generador de Interacciones / Recargas (${service.provider_key})`,
        providerName: service.provider_key,
        iconLabel: service.platform.slice(0, 1).toUpperCase(),
        originalName: service.name,
        originalDescription: service.description,
        category: service.category,
        stock: null,
        unitCostPen: service.unit_cost_pen,
        costIsProvisional: false,
        customName: override?.custom_name ?? null,
        customDescription: override?.custom_description ?? null,
        salePricePen: override?.sale_price_pen ?? null,
        promoPricePen: override?.promo_price_pen ?? null,
        isVisible: override?.is_visible ?? false,
        displayOrder: override?.display_order ?? 0,
      };
    });

    const ownerOptions = isAdmin ? await getStorefrontOwnerOptions() : [];

    return {
      mode: "management" as const,
      isAdmin,
      ownerId,
      settings,
      ownerOptions,
      products: [...masterProducts, ...smmServices],
      combos: combosResult.data ?? [],
      comboItems: comboItemsResult.data ?? [],
      totalSales: salesResult.count ?? 0,
    };
  });

export const saveStorefrontOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => overrideSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ownerId } = await resolveStoreOwner(context, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const sourceColumn =
      data.sourceType === "master_catalog" ? "master_product_id" : "social_service_id";
    const { data: existing, error: existingError } = await supabaseAdmin
      .from("store_product_overrides")
      .select("id, sale_price_pen, promo_price_pen, is_visible")
      .eq("store_owner_id", ownerId)
      .eq(sourceColumn, data.sourceId)
      .maybeSingle();
    if (existingError) throw new Error("No se pudo preparar el cambio de producto.");

    const nextSalePrice =
      data.salePricePen === undefined ? (existing?.sale_price_pen ?? null) : data.salePricePen;
    const nextPromoPrice =
      data.promoPricePen === undefined ? (existing?.promo_price_pen ?? null) : data.promoPricePen;
    const nextVisible =
      data.isVisible === undefined ? (existing?.is_visible ?? false) : data.isVisible;
    if (nextVisible && nextSalePrice === null) {
      throw new Error("Define el precio de venta antes de mostrar este producto en tu tienda.");
    }
    if (nextPromoPrice !== null && nextSalePrice !== null && nextPromoPrice > nextSalePrice) {
      throw new Error("El precio promocional no puede ser mayor que el precio de venta.");
    }

    const changes: Record<string, string | number | boolean | null> = {};
    if (data.customName !== undefined) changes.custom_name = data.customName;
    if (data.customDescription !== undefined) changes.custom_description = data.customDescription;
    if (data.salePricePen !== undefined) changes.sale_price_pen = data.salePricePen;
    if (data.promoPricePen !== undefined) changes.promo_price_pen = data.promoPricePen;
    if (data.isVisible !== undefined) changes.is_visible = data.isVisible;
    if (data.displayOrder !== undefined) changes.display_order = data.displayOrder;

    if (existing) {
      const { error } = await supabaseAdmin
        .from("store_product_overrides")
        .update(changes)
        .eq("id", existing.id);
      if (error) throw new Error("No se pudo guardar la personalización.");
      return { overrideId: existing.id };
    }

    const { data: created, error } = await supabaseAdmin
      .from("store_product_overrides")
      .insert({
        store_owner_id: ownerId,
        source_type: data.sourceType,
        master_product_id: data.sourceType === "master_catalog" ? data.sourceId : null,
        social_service_id: data.sourceType === "smm_generator" ? data.sourceId : null,
        ...changes,
      })
      .select("id")
      .single();
    if (error) throw new Error("No se pudo crear la personalización.");
    return { overrideId: created.id };
  });

export const saveStorefrontSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => storefrontSettingsSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ownerId } = await resolveStoreOwner(context, data.ownerId);
    const slug = normalizeSlug(data.storeSlug);
    if (slug.length < 3) throw new Error("El enlace público de la tienda no es válido.");
    const { error } = await context.supabase.rpc("publish_storefront_settings", {
      p_owner_id: ownerId,
      p_store_slug: slug,
      p_display_name: data.displayName,
      p_description: data.description || null,
      p_logo_url: data.logoUrl || null,
      p_banner_url: data.bannerUrl || null,
      p_is_public: data.isPublic,
      p_availability_mode: data.availabilityMode,
      p_is_available: data.isAvailable,
      p_opens_at: data.opensAt || null,
      p_closes_at: data.closesAt || null,
      p_timezone: data.timezone,
      p_template_key: data.templateKey,
      p_avatar_frame_key: data.avatarFrameKey || null,
      p_facebook_url: data.facebookUrl || null,
      p_instagram_url: data.instagramUrl || null,
      p_tiktok_url: data.tiktokUrl || null,
      p_x_url: data.xUrl || null,
      p_youtube_url: data.youtubeUrl || null,
    });
    if (error) {
      if (error.code === "23505") throw new Error("Ese enlace público ya está en uso.");
      throw new Error("No se pudo guardar la configuración de la tienda.");
    }
    return { slug };
  });

/** Listado exclusivo para el panel de supervisión. La función SQL exige rol admin. */
export const getStorefrontSupervisorList = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getActorAccess(context);
    if (!access.isAdmin) throw new Error("No tienes permiso para supervisar las tiendas.");
    const { data, error } = await context.supabase.rpc("get_storefront_supervision_list");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createStorefrontCombo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => comboSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ownerId } = await resolveStoreOwner(context, data.ownerId);
    if (
      data.promoPricePen !== null &&
      data.promoPricePen !== undefined &&
      data.promoPricePen > data.salePricePen
    ) {
      throw new Error("El precio promocional no puede ser mayor que el precio del combo.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const selectedIds = [...new Set(data.itemOverrideIds)];
    const { data: items, error: itemsError } = await supabaseAdmin
      .from("store_product_overrides")
      .select("id")
      .eq("store_owner_id", ownerId)
      .in("id", selectedIds);
    if (itemsError || (items ?? []).length !== selectedIds.length) {
      throw new Error("Los productos del combo deben pertenecer a la tienda seleccionada.");
    }

    const { data: combo, error: comboError } = await supabaseAdmin
      .from("store_combos")
      .insert({
        store_owner_id: ownerId,
        name: data.name,
        description: data.description || null,
        sale_price_pen: data.salePricePen,
        promo_price_pen: data.promoPricePen || null,
        is_visible: data.isVisible ?? false,
      })
      .select("id")
      .single();
    if (comboError) throw new Error("No se pudo crear el combo.");

    const { error: linkError } = await supabaseAdmin
      .from("store_combo_items")
      .insert(
        selectedIds.map((store_product_override_id) => ({
          combo_id: combo.id,
          store_product_override_id,
        })),
      );
    if (linkError) {
      await supabaseAdmin.from("store_combos").delete().eq("id", combo.id);
      throw new Error("No se pudo asociar los productos al combo.");
    }
    return { comboId: combo.id };
  });

export const deleteStorefrontOverride = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => deleteOverrideSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ownerId } = await resolveStoreOwner(context, data.ownerId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("store_product_overrides")
      .delete()
      .eq("id", data.overrideId)
      .eq("store_owner_id", ownerId);
    if (error)
      throw new Error(
        "No se pudo retirar el producto de tu tienda. Revisa si pertenece a un combo.",
      );
    return { deleted: true };
  });

/** Enlace de cabecera: abre el escaparate público, no el panel interno de gestión. */
export const getMyStorefrontPublicLink = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getActorAccess(context);
    if (access.isAdmin) throw new Error("El administrador no tiene una tienda pública propia.");
    const settings = await ensureStorefrontSettings(context.userId);
    return { slug: settings.store_slug };
  });

/** Avisos persistentes para el administrador que recibe las utilidades de tiendas públicas. */
export const getStorefrontSaleNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const access = await getActorAccess(context);
    if (!access.isAdmin) throw new Error("No tienes permiso para ver estas notificaciones.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("owner_notifications")
      .select("id, catalog_order_id, title, body, created_at")
      .eq("user_id", context.userId)
      .eq("notification_type", "storefront_sale")
      .order("created_at", { ascending: false })
      .limit(5);
    if (error) throw new Error("No se pudieron cargar las ventas recientes.");
    return data ?? [];
  });

/** Compra de catálogo desde un escaparate. PostgreSQL valida precio, stock, saldo y utilidad. */
export const placePublicStorefrontOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => publicStorefrontPurchaseSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc(
      "place_storefront_catalog_order_from_wallet",
      {
        p_store_slug: data.slug,
        p_store_product_override_id: data.overrideId,
        p_auto_renew: data.autoRenew,
      },
    );
    if (error) throw new Error(error.message);
    const order = result?.[0];
    if (!order) throw new Error("No se pudo registrar la compra de la tienda.");
    return order;
  });

function isStorefrontAvailable(settings: {
  availability_mode: string;
  is_available: boolean;
  opens_at: string | null;
  closes_at: string | null;
  timezone: string;
}) {
  if (!settings.is_available) return false;
  if (settings.availability_mode !== "schedule" || !settings.opens_at || !settings.closes_at) {
    return true;
  }
  const now = new Intl.DateTimeFormat("en-CA", {
    timeZone: settings.timezone || "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const time = `${now.find((part) => part.type === "hour")?.value ?? "00"}:${now.find((part) => part.type === "minute")?.value ?? "00"}`;
  const from = settings.opens_at.slice(0, 5);
  const to = settings.closes_at.slice(0, 5);
  return from <= to ? time >= from && time <= to : time >= from || time <= to;
}

/** Proyección pública: no incluye costo, ganancia, credenciales ni controles internos. */
export const getPublicStorefront = createServerFn({ method: "GET" })
  .validator((data) => publicStorefrontSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("storefront_settings")
      .select("store_owner_id, store_slug, display_name, description, logo_url, banner_url, availability_mode, is_available, opens_at, closes_at, timezone, template_key, avatar_frame_key, facebook_url, instagram_url, tiktok_url, x_url, youtube_url")
      .eq("store_slug", normalizeSlug(data.slug))
      .eq("is_public", true)
      .maybeSingle();
    if (settingsError) throw new Error("No se pudo cargar esta tienda.");
    if (!settings) return null;

    const [overridesResult, combosResult] = await Promise.all([
      supabaseAdmin
        .from("store_product_overrides")
        .select(
          "id, source_type, master_product_id, social_service_id, custom_name, custom_description, sale_price_pen, promo_price_pen, display_order",
        )
        .eq("store_owner_id", settings.store_owner_id)
        .eq("is_visible", true)
        .not("sale_price_pen", "is", null),
      supabaseAdmin
        .from("store_combos")
        .select("id, name, description, sale_price_pen, promo_price_pen, display_order")
        .eq("store_owner_id", settings.store_owner_id)
        .eq("is_visible", true)
        .order("display_order"),
    ]);
    if (overridesResult.error || combosResult.error)
      throw new Error("No se pudo cargar el catálogo de esta tienda.");

    const overrides = overridesResult.data ?? [];
    const masterIds = overrides
      .filter((item) => item.source_type === "master_catalog")
      .map((item) => item.master_product_id)
      .filter((id): id is string => Boolean(id));
    const serviceIds = overrides
      .filter((item) => item.source_type === "smm_generator")
      .map((item) => item.social_service_id)
      .filter((id): id is string => Boolean(id));
    const [productsResult, servicesResult] = await Promise.all([
      masterIds.length > 0
        ? supabaseAdmin
            .from("products")
            .select("id, name, description, image_url, category, duration_days, is_renewable, publisher_name")
            .in("id", masterIds)
        : Promise.resolve({ data: [], error: null }),
      serviceIds.length > 0
        ? supabaseAdmin
            .from("social_service_catalog")
            .select("id, name, description, platform, category")
            .in("id", serviceIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (productsResult.error || servicesResult.error)
      throw new Error("No se pudo resolver el catálogo de esta tienda.");

    const productsById = new Map(
      (productsResult.data ?? []).map((product) => [product.id, product]),
    );
    const servicesById = new Map(
      (servicesResult.data ?? []).map((service) => [service.id, service]),
    );
    const inventoryByProduct = new Map<string, number>();
    if (masterIds.length > 0) {
      const { data: inventory, error: inventoryError } = await supabaseAdmin
        .from("account_inventory")
        .select("product_id, status")
        .in("product_id", masterIds);
      if (inventoryError) throw new Error("No se pudo calcular el stock de esta tienda.");
      for (const item of inventory ?? []) {
        if (item.status === "available" || item.status === "disponible") {
          inventoryByProduct.set(item.product_id, (inventoryByProduct.get(item.product_id) ?? 0) + 1);
        }
      }
    }

    const products = overrides.flatMap((override) => {
      const source =
        override.source_type === "master_catalog"
          ? productsById.get(override.master_product_id || "")
          : servicesById.get(override.social_service_id || "");
      if (!source || override.sale_price_pen === null) return [];
      return [
        {
          id: override.id,
          sourceId: source.id,
          sourceType: override.source_type,
          name: override.custom_name || source.name,
          description: override.custom_description || source.description || null,
          imageUrl: "image_url" in source ? source.image_url : null,
          platform: "platform" in source ? source.platform : null,
          category: "category" in source ? source.category || "Otros" : "Otros",
          durationDays: "duration_days" in source ? source.duration_days : null,
          isRenewable: "is_renewable" in source ? source.is_renewable : false,
          publisherName: "publisher_name" in source ? source.publisher_name : settings.display_name,
          stockCount: "image_url" in source ? inventoryByProduct.get(source.id) ?? 0 : null,
          salePricePen: override.sale_price_pen,
          promoPricePen: override.promo_price_pen,
          displayOrder: override.display_order,
        },
      ];
    });

    products.sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "es"));
    const { count: totalSales, error: salesError } = await supabaseAdmin
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("storefront_owner_id", settings.store_owner_id)
      .neq("estado", "cancelado");
    if (salesError) throw new Error("No se pudo calcular las ventas de esta tienda.");

    return {
      settings,
      available: isStorefrontAvailable(settings),
      totalSales: totalSales ?? 0,
      products,
      combos: combosResult.data ?? [],
    };
  });
