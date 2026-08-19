import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const money = z.number().finite().min(0).max(1_000_000);
const nullableText = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || null)
    .nullable();

const listingUpdateSchema = z
  .object({
    id: z.string().uuid(),
    custom_name: nullableText(200),
    custom_description: nullableText(3_000),
    price_sale: money,
    promo_price: money.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.promo_price !== null && value.promo_price > value.price_sale) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El precio promocional no puede superar el precio de venta.",
        path: ["promo_price"],
      });
    }
  });

function defaultSellerSlug(userId: string) {
  return `tienda-${userId.replaceAll("-", "").slice(0, 10)}`;
}

function brandFromName(name: string) {
  return name.trim().split(/\s+/)[0] || "General";
}

async function ensureSellerProfile(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("seller_profiles")
    .select("user_id, display_name, slug, banner_url, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw new Error(existingError.message);
  if (existing) return existing;

  const { data: account, error: accountError } = await supabaseAdmin
    .from("profiles")
    .select("nombre_completo, email")
    .eq("id", userId)
    .maybeSingle();
  if (accountError) throw new Error(accountError.message);

  const displayName = account?.nombre_completo?.trim() || account?.email?.split("@")[0] || "Mi tienda";
  const { data: created, error: createError } = await supabaseAdmin
    .from("seller_profiles")
    .insert({ user_id: userId, display_name: displayName, slug: defaultSellerSlug(userId) })
    .select("user_id, display_name, slug, banner_url, status")
    .single();

  if (createError) throw new Error(createError.message);
  return created;
}

async function assertListingOwnership(userId: string, listingIds: string[]) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const uniqueIds = [...new Set(listingIds)];
  const { data, error } = await supabaseAdmin
    .from("seller_listings")
    .select("id")
    .eq("seller_id", userId)
    .in("id", uniqueIds);

  if (error) throw new Error(error.message);
  if ((data?.length ?? 0) !== uniqueIds.length) {
    throw new Error("No puedes modificar productos que no pertenecen a tu tienda.");
  }
}

/** Datos de gestión de tienda. Las credenciales de las cuentas nunca se incluyen. */
export const getSellerStore = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const profile = await ensureSellerProfile(context.userId);
    const { data: listings, error: listingsError } = await supabaseAdmin
      .from("seller_listings")
      .select(
        "id, product_id, custom_name, custom_description, is_visible, price_sale, promo_price, created_at, products(id, name, description, category, image_url, price, supplier_id)",
      )
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: true });
    if (listingsError) throw new Error(listingsError.message);

    const supplierIds = [
      ...new Set(
        (listings ?? [])
          .map((listing) => listing.products?.supplier_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const { data: suppliers, error: suppliersError } = supplierIds.length
      ? await supabaseAdmin
          .from("supplier_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", supplierIds)
      : { data: [], error: null };
    if (suppliersError) throw new Error(suppliersError.message);

    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from("account_inventory")
      .select("product_id")
      .eq("seller_id", context.userId)
      .in("status", ["available", "disponible"]);
    if (inventoryError) throw new Error(inventoryError.message);

    const stockByProduct = new Map<string, number>();
    for (const item of inventory ?? []) {
      stockByProduct.set(item.product_id, (stockByProduct.get(item.product_id) ?? 0) + 1);
    }
    const suppliersById = new Map((suppliers ?? []).map((supplier) => [supplier.user_id, supplier]));

    const formattedListings = (listings ?? []).map((listing) => {
      const product = listing.products;
      const supplier = product?.supplier_id ? suppliersById.get(product.supplier_id) : null;
      const productName = product?.name ?? "Producto no disponible";
      return {
        id: listing.id,
        productId: listing.product_id,
        kind: "listing" as const,
        category: product?.category || "Sin categoría",
        brand: brandFromName(productName),
        platformLogo: product?.image_url ?? null,
        providerName: supplier?.display_name ?? "CMD Streaming",
        providerAvatar: supplier?.avatar_url ?? null,
        baseName: productName,
        baseDescription: product?.description ?? "",
        customName: listing.custom_name,
        customDescription: listing.custom_description,
        name: listing.custom_name || productName,
        description: listing.custom_description ?? product?.description ?? "",
        visible: listing.is_visible,
        stock: stockByProduct.get(listing.product_id) ?? 0,
        costUnit: Number(product?.price ?? 0),
        priceSale: Number(listing.price_sale),
        promoPrice: listing.promo_price === null ? null : Number(listing.promo_price),
      };
    });

    const { data: combos, error: combosError } = await supabaseAdmin
      .from("seller_combos")
      .select("id, name, description, price_sale, promo_price, is_visible")
      .eq("seller_id", context.userId)
      .order("created_at", { ascending: true });
    if (combosError) throw new Error(combosError.message);

    const comboIds = (combos ?? []).map((combo) => combo.id);
    const { data: comboItems, error: comboItemsError } = comboIds.length
      ? await supabaseAdmin
          .from("seller_combo_items")
          .select("combo_id, seller_listing_id, quantity")
          .in("combo_id", comboIds)
      : { data: [], error: null };
    if (comboItemsError) throw new Error(comboItemsError.message);

    const listingById = new Map(formattedListings.map((listing) => [listing.id, listing]));
    const formattedCombos = (combos ?? []).map((combo) => {
      const items = (comboItems ?? []).filter((item) => item.combo_id === combo.id);
      const ingredients = items
        .map((item) => ({ item, listing: listingById.get(item.seller_listing_id) }))
        .filter((entry): entry is { item: (typeof items)[number]; listing: (typeof formattedListings)[number] } => Boolean(entry.listing));
      const stock = ingredients.length
        ? Math.min(...ingredients.map(({ item, listing }) => Math.floor(listing.stock / item.quantity)))
        : 0;
      const costUnit = ingredients.reduce(
        (total, { item, listing }) => total + listing.costUnit * item.quantity,
        0,
      );

      return {
        id: combo.id,
        kind: "combo" as const,
        category: "Mis Combos Premium",
        brand: "Combo",
        platformLogo: null,
        providerName: "Mi tienda",
        providerAvatar: null,
        name: combo.name,
        description: combo.description ?? "",
        visible: combo.is_visible,
        stock,
        costUnit,
        priceSale: Number(combo.price_sale),
        promoPrice: combo.promo_price === null ? null : Number(combo.promo_price),
      };
    });

    return { profile, listings: formattedListings, combos: formattedCombos };
  });

export const saveSellerListings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ items: z.array(listingUpdateSchema).min(1).max(100) }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    await assertListingOwnership(
      context.userId,
      data.items.map((item) => item.id),
    );
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    for (const item of data.items) {
      const { error } = await supabaseAdmin
        .from("seller_listings")
        .update({
          custom_name: item.custom_name,
          custom_description: item.custom_description,
          price_sale: item.price_sale,
          promo_price: item.promo_price,
        })
        .eq("id", item.id)
        .eq("seller_id", context.userId);
      if (error) throw new Error(error.message);
    }

    return { success: true };
  });

export const updateSellerListingVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid(), visible: z.boolean() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    await assertListingOwnership(context.userId, [data.id]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("seller_listings")
      .update({ is_visible: data.visible })
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateSellerComboVisibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid(), visible: z.boolean() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("seller_combos")
      .update({ is_visible: data.visible })
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const deleteSellerListing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    await assertListingOwnership(context.userId, [data.id]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: usageError } = await supabaseAdmin
      .from("seller_combo_items")
      .select("*", { count: "exact", head: true })
      .eq("seller_listing_id", data.id);
    if (usageError) throw new Error(usageError.message);
    if (count) throw new Error("Quita este producto de sus combos antes de eliminarlo.");

    const { error } = await supabaseAdmin
      .from("seller_listings")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const updateSellerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({
        display_name: z.string().trim().min(2).max(80),
        slug: z
          .string()
          .trim()
          .toLowerCase()
          .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Usa letras, números y guiones."),
        banner_url: z.string().trim().url().max(2_000).nullable(),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    await ensureSellerProfile(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("seller_profiles")
      .update(data)
      .eq("user_id", context.userId);
    if (error?.code === "23505") throw new Error("Ese enlace de tienda ya está en uso.");
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const createSellerCombo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({
        name: z.string().trim().min(2).max(160),
        description: nullableText(3_000),
        price_sale: money,
        promo_price: money.nullable(),
        listing_ids: z.array(z.string().uuid()).min(2).max(20),
      })
      .superRefine((combo, ctx) => {
        if (new Set(combo.listing_ids).size !== combo.listing_ids.length) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "No repitas productos en el combo." });
        }
        if (combo.promo_price !== null && combo.promo_price > combo.price_sale) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "El precio promo no puede superar el precio de venta." });
        }
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    await assertListingOwnership(context.userId, data.listing_ids);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: combo, error: comboError } = await supabaseAdmin
      .from("seller_combos")
      .insert({
        seller_id: context.userId,
        name: data.name,
        description: data.description,
        price_sale: data.price_sale,
        promo_price: data.promo_price,
      })
      .select("id")
      .single();
    if (comboError) throw new Error(comboError.message);

    const { error: itemsError } = await supabaseAdmin.from("seller_combo_items").insert(
      data.listing_ids.map((seller_listing_id) => ({ combo_id: combo.id, seller_listing_id })),
    );
    if (itemsError) {
      await supabaseAdmin.from("seller_combos").delete().eq("id", combo.id);
      throw new Error(itemsError.message);
    }
    return { success: true, id: combo.id };
  });

export const deleteSellerCombo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data, context }) => {
    const { assertSeller } = await import("@/lib/roles.server");
    await assertSeller(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("seller_combos")
      .delete()
      .eq("id", data.id)
      .eq("seller_id", context.userId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

/** Public, sanitized storefront. It deliberately does not expose inventory credentials or supplier data. */
export const getPublicSellerStore = createServerFn({ method: "GET" })
  .validator((value) =>
    z
      .object({ slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) })
      .parse(value),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: store, error: storeError } = await supabaseAdmin
      .from("seller_profiles")
      .select("display_name, slug, banner_url")
      .eq("slug", data.slug)
      .eq("status", "active")
      .maybeSingle();
    if (storeError) throw new Error(storeError.message);
    if (!store) return null;

    const { data: owner, error: ownerError } = await supabaseAdmin
      .from("seller_profiles")
      .select("user_id")
      .eq("slug", data.slug)
      .eq("status", "active")
      .single();
    if (ownerError) throw new Error(ownerError.message);

    const { data: listings, error: listingsError } = await supabaseAdmin
      .from("seller_listings")
      .select("id, product_id, custom_name, custom_description, price_sale, promo_price, products(name, description, category, image_url)")
      .eq("seller_id", owner.user_id)
      .eq("is_visible", true);
    if (listingsError) throw new Error(listingsError.message);

    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from("account_inventory")
      .select("product_id")
      .eq("seller_id", owner.user_id)
      .in("status", ["available", "disponible"]);
    if (inventoryError) throw new Error(inventoryError.message);
    const stockByProduct = new Map<string, number>();
    for (const item of inventory ?? []) {
      stockByProduct.set(item.product_id, (stockByProduct.get(item.product_id) ?? 0) + 1);
    }

    return {
      ...store,
      items: (listings ?? []).map((listing) => ({
        id: listing.id,
        name: listing.custom_name || listing.products?.name || "Producto",
        description: listing.custom_description ?? listing.products?.description ?? "",
        category: listing.products?.category || "Sin categoría",
        image_url: listing.products?.image_url ?? null,
        price_sale: Number(listing.price_sale),
        promo_price: listing.promo_price === null ? null : Number(listing.promo_price),
        stock: stockByProduct.get(listing.product_id) ?? 0,
      })),
    };
  });
