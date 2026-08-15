import type { ProductDetail } from "@/components/ProductModal";
import { supabase } from "@/integrations/supabase/client";
import {
  AppWindow,
  Flame,
  Gamepad2,
  Gift,
  GraduationCap,
  Key,
  Layers,
  Mail,
  Music,
  Play,
  Sparkles,
  Tv,
  Users,
  Zap,
} from "lucide-react";

export type Category = {
  id: string;
  label: string;
  icon: typeof Layers;
  /** Accent color used consistently by category navigation. */
  accent: string;
};

export const WA_NUMBER = "51970097715";

export const categories: Category[] = [
  { id: "todo", label: "Todo", icon: Layers, accent: "#f8fafc" },
  { id: "combos", label: "Combos Premium", icon: Sparkles, accent: "#fbbf24" },
  { id: "streaming", label: "Streaming", icon: Play, accent: "#f43f5e" },
  { id: "ia", label: "IA & Herramientas", icon: Zap, accent: "#a78bfa" },
  { id: "apps", label: "Aplicaciones", icon: AppWindow, accent: "#38bdf8" },
  { id: "licencias", label: "Licencias", icon: Key, accent: "#eab308" },
  { id: "cursos", label: "Cursos", icon: GraduationCap, accent: "#2dd4bf" },
  { id: "recargas", label: "Recargas", icon: Zap, accent: "#fb923c" },
  { id: "videojuegos", label: "Videojuegos", icon: Gamepad2, accent: "#8b5cf6" },
  { id: "giftcards", label: "Tarjetas de Regalo", icon: Gift, accent: "#ec4899" },
  { id: "invitaciones", label: "Invitaciones", icon: Mail, accent: "#60a5fa" },
  { id: "redes", label: "Redes Sociales", icon: Users, accent: "#22c55e" },
  { id: "music", label: "MUSIC", icon: Music, accent: "#f472b6" },
  { id: "adult", label: "ADULT", icon: Flame, accent: "#ef4444" },
  { id: "iptv", label: "IPTV", icon: Tv, accent: "#06b6d4" },
];

const baseDesc = `🔒 Producto de acceso digital. No compartir credenciales.

• Entrega inmediata tras confirmar pago.
• Garantía durante toda la vigencia del plan.
• Soporte por WhatsApp en horario de atención.
• Al comprar aceptas las condiciones de uso del servicio.`;

const common = {
  descripcion_larga: baseDesc,
  horario_atencion_inicio: "09:00",
  horario_atencion_fin: "22:00",
  whatsapp_contacto: WA_NUMBER,
  vendedor: "camd",
} as const;

export const products: ProductDetail[] = [
  {
    id: "netflix-1",
    name: "Netflix Premium 4K",
    shortLabel: "NETFLIX PREMIUM — PERFIL X 30 DÍAS",
    price: 15.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&q=80",
    ...common,
  },
  {
    id: "prime-1",
    name: "Prime Video",
    shortLabel: "PRIME VIDEO — PERFIL 30 DÍAS",
    price: 10.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1620332372374-f108c53d2e03?w=500&q=80",
    ...common,
  },
  {
    id: "disney-1",
    name: "Disney+",
    shortLabel: "DISNEY+ — CUENTA COMPLETA 12 MESES",
    price: 45.0,
    category: "streaming",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&q=80",
    ...common,
  },
  {
    id: "hbo-1",
    name: "HBO Max",
    shortLabel: "HBO MAX — PERFIL 30 DÍAS",
    price: 12.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=500&q=80",
    ...common,
  },
  {
    id: "apple-tv-1",
    name: "Apple TV",
    shortLabel: "APPLE TV — 30 DÍAS",
    price: 15.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&q=80",
    ...common,
  },
  {
    id: "paramount-1",
    name: "Paramount+",
    shortLabel: "PARAMOUNT+ — 30 DÍAS",
    price: 9.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80",
    ...common,
  },
  {
    id: "crunchyroll-1",
    name: "Crunchyroll",
    shortLabel: "CRUNCHYROLL — 30 DÍAS",
    price: 7.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1578632292335-df3abbb0d586?w=500&q=80",
    ...common,
  },
  {
    id: "youtube-1",
    name: "YouTube Premium",
    shortLabel: "YOUTUBE PREMIUM — 30 DÍAS",
    price: 10.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    ...common,
  },
  {
    id: "spotify-1",
    name: "Spotify",
    shortLabel: "SPOTIFY PREMIUM — 30 DÍAS",
    price: 8.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    ...common,
  },
  {
    id: "apple-music-1",
    name: "Apple Music",
    shortLabel: "APPLE MUSIC — 3 MESES",
    price: 15.0,
    category: "music",
    duracion: "3 Meses",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    ...common,
  },
  {
    id: "youtube-music-1",
    name: "YouTube Music",
    shortLabel: "YOUTUBE MUSIC PREMIUM — 1 MES",
    price: 12.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=500&q=80",
    ...common,
  },
  {
    id: "deezer-1",
    name: "Deezer",
    shortLabel: "DEEZER PREMIUM — 1 MES",
    price: 10.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=500&q=80",
    ...common,
  },
  {
    id: "tidal-1",
    name: "TIDAL",
    shortLabel: "TIDAL HI-FI — 1 MES",
    price: 15.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80",
    ...common,
  },
  {
    id: "amazon-music-1",
    name: "Amazon Music",
    shortLabel: "AMAZON MUSIC UNLIMITED — 1 MES",
    price: 12.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80",
    ...common,
  },
  {
    id: "soundcloud-1",
    name: "SoundCloud",
    shortLabel: "SOUNDCLOUD NEXT PRO — 1 MES",
    price: 18.0,
    category: "music",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&q=80",
    ...common,
  },
  {
    id: "vix-1",
    name: "ViX Premium",
    shortLabel: "VIX PREMIUM — 30 DÍAS",
    price: 12.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&q=80",
    ...common,
  },
  {
    id: "mubi-1",
    name: "MUBI",
    shortLabel: "MUBI — 30 DÍAS",
    price: 10.0,
    category: "streaming",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500&q=80",
    ...common,
  },
  {
    id: "combo-1",
    name: "Combo Streaming Total",
    shortLabel: "COMBO 3 PLATAFORMAS — 30 DÍAS",
    price: 35.0,
    category: "combos",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=500&q=80",
    ...common,
  },
  {
    id: "combo-2",
    name: "Pack Familiar 5 Apps",
    shortLabel: "PACK FAMILIAR 5 APPS — 30 DÍAS",
    price: 55.0,
    category: "combos",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?w=500&q=80",
    ...common,
  },
  {
    id: "chatgpt-1",
    name: "ChatGPT Plus",
    shortLabel: "CHATGPT PLUS — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    ...common,
  },
  {
    id: "claude-1",
    name: "Claude Pro",
    shortLabel: "CLAUDE PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1677442135914-f96e474577b8?w=500&q=80",
    ...common,
  },
  {
    id: "gemini-1",
    name: "Google Gemini Advanced",
    shortLabel: "GEMINI ADVANCED — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    ...common,
  },
  {
    id: "perplexity-1",
    name: "Perplexity Pro",
    shortLabel: "PERPLEXITY PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&q=80",
    ...common,
  },
  {
    id: "grok-1",
    name: "Grok AI",
    shortLabel: "GROK AI (X PREMIUM) — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=500&q=80",
    ...common,
  },
  {
    id: "copilot-1",
    name: "Microsoft Copilot Pro",
    shortLabel: "COPILOT PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=500&q=80",
    ...common,
  },
  {
    id: "midjourney-1",
    name: "Midjourney Pro",
    shortLabel: "MIDJOURNEY — PLAN BÁSICO",
    price: 45.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    ...common,
  },
  {
    id: "leonardo-1",
    name: "Leonardo AI",
    shortLabel: "LEONARDO AI PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    ...common,
  },
  {
    id: "ideogram-1",
    name: "Ideogram Pro",
    shortLabel: "IDEOGRAM PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=500&q=80",
    ...common,
  },
  {
    id: "runway-1",
    name: "Runway Gen-3",
    shortLabel: "RUNWAY GEN-3 — 1 MES",
    price: 45.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1633167606207-d840b5070fc2?w=500&q=80",
    ...common,
  },
  {
    id: "kling-1",
    name: "Kling AI",
    shortLabel: "KLING AI — 1 MES",
    price: 45.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?w=500&q=80",
    ...common,
  },
  {
    id: "dreamina-1",
    name: "Dreamina AI",
    shortLabel: "DREAMINA PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=500&q=80",
    ...common,
  },
  {
    id: "elevenlabs-1",
    name: "ElevenLabs",
    shortLabel: "ELEVENLABS — 1 MES",
    price: 25.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=500&q=80",
    ...common,
  },
  {
    id: "suno-1",
    name: "Suno AI",
    shortLabel: "SUNO AI PRO — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80",
    ...common,
  },
  {
    id: "gamma-1",
    name: "Gamma App",
    shortLabel: "GAMMA APP PRO — 1 MES",
    price: 25.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&q=80",
    ...common,
  },
  {
    id: "notion-1",
    name: "Notion AI",
    shortLabel: "NOTION AI — 1 MES",
    price: 20.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1662026911591-335639b11db6?w=500&q=80",
    ...common,
  },
  {
    id: "cursor-1",
    name: "Cursor Pro",
    shortLabel: "CURSOR PRO — 1 MES",
    price: 45.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500&q=80",
    ...common,
  },
  {
    id: "github-copilot-1",
    name: "GitHub Copilot",
    shortLabel: "GITHUB COPILOT — 1 MES",
    price: 35.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=500&q=80",
    ...common,
  },
  {
    id: "lovable-1",
    name: "Lovable",
    shortLabel: "LOVABLE PRO — 1 MES",
    price: 65.0,
    category: "ia",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=500&q=80",
    ...common,
  },
  {
    id: "m365-1",
    name: "Microsoft 365",
    shortLabel: "MICROSOFT 365 PERSONAL — 1 AÑO",
    price: 45.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?w=500&q=80",
    ...common,
  },
  {
    id: "win11-1",
    name: "Windows 11 Pro",
    shortLabel: "WINDOWS 11 PRO — CLAVE OEM",
    price: 35.0,
    category: "licencias",
    duracion: "Permanente",
    image: "https://images.unsplash.com/photo-1624555130581-1d9cca783bc0?w=500&q=80",
    ...common,
  },
  {
    id: "eset-1",
    name: "ESET NOD32",
    shortLabel: "ESET NOD32 ANTIVIRUS — 1 PC",
    price: 25.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&q=80",
    ...common,
  },
  {
    id: "bitdefender-1",
    name: "Bitdefender",
    shortLabel: "BITDEFENDER TOTAL SECURITY",
    price: 35.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    ...common,
  },
  {
    id: "malwarebytes-1",
    name: "Malwarebytes",
    shortLabel: "MALWAREBYTES PREMIUM — 1 PC",
    price: 25.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=500&q=80",
    ...common,
  },
  {
    id: "acronis-1",
    name: "Acronis",
    shortLabel: "ACRONIS CYBER PROTECT",
    price: 45.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    ...common,
  },
  {
    id: "adobe-cc-1",
    name: "Adobe Creative Cloud",
    shortLabel: "ADOBE CREATIVE CLOUD — TODAS LAS APPS",
    price: 85.0,
    category: "licencias",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=500&q=80",
    ...common,
  },
  {
    id: "canva-1",
    name: "Canva Pro",
    shortLabel: "CANVA PRO — EQUIPO PREMIUM",
    price: 15.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1626785774625-ddc7c82a1e5e?w=500&q=80",
    ...common,
  },
  {
    id: "1password-1",
    name: "1Password",
    shortLabel: "1PASSWORD FAMILIAR",
    price: 25.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&q=80",
    ...common,
  },
  {
    id: "dropbox-1",
    name: "Dropbox",
    shortLabel: "DROPBOX PLUS — 2TB",
    price: 35.0,
    category: "licencias",
    duracion: "12 Meses",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&q=80",
    ...common,
  },
  {
    id: "pornhub-1",
    name: "Pornhub Premium",
    shortLabel: "PORNHUB PREMIUM — 30 DÍAS",
    price: 15.0,
    category: "adult",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80",
    ...common,
  },
  {
    id: "brazzers-1",
    name: "Brazzers",
    shortLabel: "BRAZZERS PREMIUM — 30 DÍAS",
    price: 20.0,
    category: "adult",
    duracion: "1 Mes",
    image: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=500&q=80",
    ...common,
  },
];

/** Precios del catálogo estático — fuente autoritativa en servidor para productos mock. */
export const catalogPriceById: Record<string, number> = Object.fromEntries(
  products.map((p) => [p.id, p.price]),
);

export type Product = ProductDetail;
export type PanelTab = "tienda" | "compras" | "perfil";

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
  pagado: "bg-blue-500/15 border-blue-500/40 text-blue-300",
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
  redes: "quiero contratar",
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
