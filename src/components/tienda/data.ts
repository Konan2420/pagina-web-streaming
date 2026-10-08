import type { ProductDetail } from "@/components/ProductModal";
import { platformIcons } from "@/lib/platformIcons";
import { supabase } from "@/integrations/supabase/client";
export {
  COUNTRY_OPTIONS,
  countryFlag,
  countryLabel,
  toDeliveryType,
  toScopeType,
} from "./productMetadata";
export type { DeliveryType, ScopeType } from "./productMetadata";
export type Category = {
  id: string;
  label: string;
  /** Accent color used consistently by category navigation. */
  accent: string;
};

export const WA_NUMBER = "51970097715";

export const categories: Category[] = [
  { id: "todo", label: "Todos", accent: "#f8fafc" },
  { id: "combos", label: "Packs Premium", accent: "#fbbf24" },
  { id: "streaming", label: "Streaming", accent: "#3b82f6" },
  { id: "ia", label: "Inteligencia Artificial", accent: "#a78bfa" },
  { id: "apps", label: "Aplicaciones", accent: "#38bdf8" },
  { id: "licencias", label: "Licencias", accent: "#eab308" },
  { id: "cursos", label: "Cursos", accent: "#2dd4bf" },
  { id: "recargas", label: "Recargas", accent: "#fb923c" },
  { id: "videojuegos", label: "Gaming", accent: "#8b5cf6" },
  { id: "vpn", label: "VPN", accent: "#38bdf8" },
  { id: "educacion", label: "Educación", accent: "#2dd4bf" },
  { id: "productividad", label: "Productividad", accent: "#60a5fa" },
  { id: "diseno", label: "Diseño", accent: "#a78bfa" },
  { id: "cloud", label: "Cloud", accent: "#38bdf8" },
  { id: "email", label: "Email", accent: "#2dd4bf" },
  { id: "giftcards", label: "Gift Cards", accent: "#ec4899" },
  { id: "ofertas", label: "Ofertas", accent: "#fbbf24" },
  { id: "invitaciones", label: "Invitaciones", accent: "#60a5fa" },
  { id: "music", label: "Música", accent: "#f472b6" },
  { id: "adult", label: "Adultos", accent: "#2563eb" },
  { id: "iptv", label: "IPTV", accent: "#06b6d4" },
];

export type PlatformShortcut = {
  label: string;
  categoryId: Category["id"];
  searchTerm: string;
  fallback: string;
  /** Identificador de un ícono incluido en el catálogo visual centralizado. */
  iconId?: string | null;
  isAiHub?: boolean;
  /** Identificador opcional de una plataforma configurada desde CMD ADMIN. */
  serviceId?: string;
  /** URL pública del ícono configurado desde CMD ADMIN. */
  iconUrl?: string | null;
};

/**
 * Accesos rápidos visibles en la navegación de plataformas. Cada uno apunta a
 * un producto real del catálogo mediante los filtros existentes de categoría y búsqueda.
 */
export const platformShortcuts: PlatformShortcut[] = platformIcons.map((icon) => ({
  label: icon.name,
  categoryId: icon.categoryId as Category["id"],
  searchTerm: icon.searchTerm,
  fallback: icon.fallback,
  iconId: icon.id,
  isAiHub: icon.isAiHub,
}));

export type Product = ProductDetail;

export type AccountType = "completa" | "perfil";
export type AccessScope = "global" | "regional";

/**
 * `products.account_type` y `access_scope` son `text` nulables con un CHECK que solo
 * admite dos valores cada uno, pero el tipo generado por Supabase los expone como
 * `string | null`. Devuelven `null` ante cualquier otra cosa, incluido el nulo: sin
 * declaración no se afirma nada, porque "completa" o "global" es una afirmación
 * comercial sobre el producto y no algo que la interfaz pueda inventarse. Con `null`
 * la tarjeta no pinta el chip.
 */
export function toAccountType(value: string | null | undefined): AccountType | null {
  return value === "completa" || value === "perfil" ? value : null;
}

export function toAccessScope(value: string | null | undefined): AccessScope | null {
  return value === "global" || value === "regional" ? value : null;
}

/**
 * Estados de venta de un producto. Son excluyentes porque cada uno recibe un
 * mensaje distinto y solo `available` permite comprar.
 *
 * - `available`: se vende y hay unidades.
 * - `out-of-stock`: se vende, pero no quedan unidades.
 * - `out-of-service`: el vendedor lo retiró de la venta (`is_catalog_available`).
 *   No dice nada sobre las unidades: puede haber inventario y aun así no venderse.
 * - `unknown`: la consulta de stock todavía no respondió; no es "no hay unidades".
 */
export type ProductStockStatus = "available" | "out-of-stock" | "out-of-service" | "unknown";

export type ProductStock = {
  status: ProductStockStatus;
  /**
   * Unidades disponibles cuando el stock se pudo leer; `null` si no aplica o no hay dato.
   * Puede ser mayor que cero con `out-of-service`: ese inventario existe, solo que no
   * está a la venta, así que nunca debe presentarse como "agotado".
   */
  count: number | null;
};

export type PanelTab =
  | "tienda"
  | "noticias"
  | "ranking"
  | "mi-tienda"
  | "compras"
  | "pedidos"
  | "perfil"
  | "clientes"
  | "buzon"
  | "soporte"
  | "publicidad"
  | "cursos"
  | "meets";

export type Order = {
  id: string;
  producto_id: string;
  producto_nombre: string;
  precio: number;
  estado: "pendiente" | "pagado" | "entregado" | "cancelado";
  created_at: string;
};

export const estadoStyles: Record<Order["estado"], string> = {
  pendiente: "bg-yellow-500/15 border-yellow-500/40 text-yellow-300",
  pagado: "bg-info/15 border-info/40 text-info-foreground",
  entregado: "bg-green-500/15 border-green-500/40 text-green-300",
  cancelado: "bg-red-500/15 border-red-500/40 text-red-300",
};

const categoryGreeting: Record<string, string> = {
  streaming: "quiero contratar",
  music: "quiero activar",
  combos: "quiero contratar",
  ia: "me interesa adquirir",
  apps: "quiero obtener",
  licencias: "quiero comprar la licencia de",
  cursos: "me interesa el curso",
  recargas: "quiero recargar",
  videojuegos: "quiero comprar",
  giftcards: "quiero comprar la tarjeta de regalo",
  invitaciones: "quiero adquirir invitaciones para",
  adult: "quiero contratar",
  iptv: "quiero contratar",
};

export function buildWhatsAppMessage(
  product: Product,
  opts?: { quantity?: number; extraLine?: string },
): string {
  const q = opts?.quantity ?? 1;
  const total = product.price * q;
  const greeting = categoryGreeting[product.category] ?? "me interesa";
  const qtyText = q > 1 ? ` x${q}` : "";

  let platformHint = "";
  const lowerName = product.name.toLowerCase();
  if (lowerName.includes("netflix")) {
    platformHint = " — Perfil propio en calidad 4K UHD";
  } else if (lowerName.includes("disney")) {
    platformHint = " — Cuenta completa sin interrupciones";
  } else if (lowerName.includes("hbo")) {
    platformHint = " — Perfil estándar con contenido Max";
  } else if (lowerName.includes("prime")) {
    platformHint = " — Perfil propio con envío Prime incluido";
  } else if (lowerName.includes("spotify")) {
    platformHint = " — Escucha sin anuncios y modo offline";
  } else if (product.category === "combos") {
    platformHint = " — Combo de plataformas seleccionadas";
  }

  let message = `🚀 *NUEVO PEDIDO - CMD STREAMING* 🚀\n\nHola, ${greeting} *${product.name}*${qtyText}${platformHint}.\n\n✅ *Detalle del Producto:* \n• Duración: ${product.duracion}\n• Precio: S/ ${total.toFixed(2)}\n\n💳 *Total a pagar: S/ ${total.toFixed(2)}*\n\n¿Me confirmas disponibilidad para realizar el pago ahora mismo?`;

  if (opts?.extraLine) {
    message += `\n${opts.extraLine}`;
  }

  return message;
}

export function buildProductInquiryWhatsAppMessage(product: Product): string {
  return `Hola, quiero consultar por este producto de CMD Streaming:\n\n📦 Producto: ${product.name}\n🏷️ Categoría: ${product.category}\n💰 Precio: S/ ${product.price.toFixed(2)}\n\n¿Está disponible? Me gustaría recibir más información.`;
}

export function buildCartWhatsAppMessage(
  items: { id: string; name: string; price: number; quantity: number }[],
  total: number,
): string {
  if (items.length === 0) return "Hola, me interesa realizar una compra.";

  const lines = items
    .map(
      (it) =>
        `• *${it.name}*${it.quantity > 1 ? ` (x${it.quantity})` : ""} — S/ ${(it.price * it.quantity).toFixed(2)}`,
    )
    .join("\n");

  return `🛒 *RESUMEN DE COMPRA - CMD STREAMING* 🛒\n\nHola, quiero finalizar mi pedido con los siguientes productos:\n\n${lines}\n\n💰 *TOTAL A PAGAR: S/ ${total.toFixed(2)}*\n\n¿Me indicas los métodos de pago disponibles para completar mi pedido?`;
}

export type Profile = {
  nombre_completo: string;
  whatsapp: string;
  avatar_url?: string | null;
};

/**
 * Resuelve la URL final de un avatar.
 * Acepta URLs absolutas (http/https/data/blob), rutas públicas del sitio
 * (`/provider-avatars/...`) y rutas dentro del bucket `avatars` de storage.
 */
export const getAvatarUrl = (path?: string | null) => {
  if (!path) return "";
  const value = path.trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("/")) return value; // asset público servido por el sitio
  const { data } = supabase.storage.from("avatars").getPublicUrl(value);
  return data.publicUrl;
};
