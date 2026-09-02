import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const socialOrderSchema = z.object({
  serviceId: z.string().uuid(),
  clientId: z.string().uuid(),
  targetUrl: z.string().trim().min(3).max(2048),
  quantity: z.number().int().positive(),
  salePricePen: z.number().finite().nonnegative(),
});

const socialOrdersDashboardSchema = z.object({
  search: z.string().trim().max(120).optional().default(""),
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).max(2100).optional(),
  scope: z.enum(["mine", "all"]).optional().default("mine"),
});

const elevatedRoles = new Set(["admin", "proveedor", "distribuidor"]);

/** Estado no sensible de la integración; jamás incluye la API key. */
export const getSocialServiceProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("social_service_provider_status")
      .select("provider_label, is_configured, catalog_synced_at")
      .eq("id", "default")
      .maybeSingle();
    if (error) throw new Error("No se pudo leer el estado del proveedor SMM.");
    return data ?? { provider_label: null, is_configured: false, catalog_synced_at: null };
  });

/**
 * Devuelve solo el catálogo ya sincronizado en Supabase. No consulta ningún
 * proveedor externo, por lo que el panel permanece honesto mientras no exista
 * una API configurada.
 */
export const getSocialServiceCatalog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("social_service_catalog")
      .select(
        "id, provider_key, provider_service_id, platform, category, name, description, unit_cost_pen, min_quantity, max_quantity, is_featured, provider_updated_at",
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("platform")
      .order("name");

    if (error) throw new Error("No se pudo cargar el catálogo de servicios.");
    return data ?? [];
  });

/** El generador comparte el mismo CRM aislado por dueño que el catálogo. */
export const getSocialOrderClients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roleRows, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw new Error("No se pudo verificar el acceso del usuario.");

    const canAssignOtherClients = (roleRows ?? []).some((row) => elevatedRoles.has(row.role));

    const { data, error } = await context.supabase.rpc("get_catalog_order_clients");
    if (error) throw new Error("No se pudieron cargar los clientes registrados.");

    return {
      canAssignOtherClients,
      clients: data ?? [],
    };
  });

export const getMySocialServiceOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((data) => socialOrdersDashboardSchema.parse(data ?? {}))
  .handler(async ({ data, context }) => {
    const { data: roleRows, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    if (roleError) throw new Error("No se pudo verificar el acceso del usuario.");

    const actorRoles = new Set((roleRows ?? []).map((row) => row.role));
    const isAdmin = actorRoles.has("admin");
    const canViewInternalData =
      isAdmin || actorRoles.has("proveedor") || actorRoles.has("distribuidor");
    const canViewAllOrders = isAdmin && data.scope === "all";

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ordersQuery = supabaseAdmin
      .from("social_service_orders")
      .select(
        "id, created_by, client_id, business_client_id, service_name, target_url, initial_quantity, quantity, cost_total_pen, sale_price_pen, profit_pen, status, external_order_id, created_at",
      )
      .order("created_at", { ascending: false });

    if (!canViewAllOrders) {
      ordersQuery = canViewInternalData
        ? ordersQuery.eq("created_by", context.userId)
        : ordersQuery.eq("client_id", context.userId);
    }

    if (data.year) {
      const start = new Date(Date.UTC(data.year, data.month ? data.month - 1 : 0, 1));
      const end = data.month
        ? new Date(Date.UTC(data.year, data.month, 1))
        : new Date(Date.UTC(data.year + 1, 0, 1));
      ordersQuery = ordersQuery
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
    }

    const { data: rows, error } = await ordersQuery.limit(500);
    if (error) throw new Error("No se pudieron cargar las órdenes de redes sociales.");

    const normalizedSearch = data.search.toLocaleLowerCase("es");
    const orders = (rows ?? []).filter((order) => {
      if (data.month && !data.year && new Date(order.created_at).getUTCMonth() + 1 !== data.month) {
        return false;
      }
      if (!normalizedSearch) return true;
      return [order.service_name, order.target_url, order.external_order_id, order.id]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(normalizedSearch));
    });

    if (!canViewInternalData) {
      return {
        view: "customer" as const,
        canViewAllOrders: false,
        orders: orders.map((order) => ({
          id: order.id,
          service_name: order.service_name,
          target_url: order.target_url,
          quantity: order.quantity,
          status: order.status,
          created_at: order.created_at,
        })),
      };
    }

    const clientIds = [
      ...new Set(
        orders
          .map((order) => order.business_client_id)
          .filter((clientId): clientId is string => Boolean(clientId)),
      ),
    ];
    if (clientIds.length === 0) {
      return { view: "internal" as const, canViewAllOrders: isAdmin, orders: [] };
    }

    const { data: clients, error: clientsError } = await supabaseAdmin
      .from("business_clients")
      .select("id, nombre")
      .in("id", clientIds);
    if (clientsError) throw new Error("No se pudo resolver el cliente de las órdenes.");

    const clientNames = new Map(
      (clients ?? []).map((client) => [client.id, client.nombre || "Cliente"]),
    );
    return {
      view: "internal" as const,
      canViewAllOrders: isAdmin,
      orders: orders.map((order) => ({
        id: order.id,
        clientName: clientNames.get(order.business_client_id ?? "") ?? "Cliente",
        service_name: order.service_name,
        target_url: order.target_url,
        initial_quantity: order.initial_quantity,
        quantity: order.quantity,
        cost_total_pen: order.cost_total_pen,
        status: order.status,
        external_order_id: order.external_order_id,
        created_at: order.created_at,
      })),
    };
  });

/**
 * La función SQL toma el costo desde el catálogo vigente, bloquea el saldo y
 * registra tanto la orden como el movimiento de billetera. No llama a la API
 * externa; esa fase se añadirá al configurar un proveedor real.
 */
export const createSocialServiceOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data) => socialOrderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { data: orderId, error } = await context.supabase.rpc("place_social_service_order", {
      p_service_id: data.serviceId,
      p_client_id: data.clientId,
      p_target_url: data.targetUrl,
      p_quantity: data.quantity,
      p_sale_price_pen: data.salePricePen,
    });
    if (error) throw new Error(error.message);
    return { orderId };
  });
