export type StorefrontTemplate = {
  key: string;
  name: string;
  description: string;
  accent: string;
  accentSoft: string;
  surface: string;
  text: string;
  premium: boolean;
};

export const storefrontTemplates: StorefrontTemplate[] = [
  { key: "premium-vogue", name: "Premium: Vogue", description: "Elegancia Serif", accent: "#b8922f", accentSoft: "#f0d58b", surface: "#17130d", text: "#fff8e6", premium: true },
  { key: "premium-techpro", name: "Premium: TechPro", description: "Futurista", accent: "#6d5dfc", accentSoft: "#b9b1ff", surface: "#101027", text: "#f3f1ff", premium: true },
  { key: "premium-boutique", name: "Premium: Boutique", description: "Minimalista Pastel", accent: "#b95b6c", accentSoft: "#f1b7c1", surface: "#241419", text: "#fff3f5", premium: true },
  { key: "premium-executive", name: "Premium: Executive", description: "Corporativo", accent: "#1677bd", accentSoft: "#8ac8f4", surface: "#0e1c28", text: "#edf8ff", premium: true },
  { key: "premium-gaming", name: "Premium: Gaming", description: "Twitch Style", accent: "#42b72a", accentSoft: "#9bf58b", surface: "#0e2115", text: "#efffed", premium: true },
  { key: "premium-vintage", name: "Premium: Vintage", description: "Retro", accent: "#b96a35", accentSoft: "#edb086", surface: "#26170f", text: "#fff4eb", premium: true },
  { key: "premium-arte-moderno", name: "Premium: Arte Moderno", description: "Syne", accent: "#6ec7cf", accentSoft: "#c0fbff", surface: "#0d2023", text: "#edfeff", premium: true },
  { key: "premium-streetwear", name: "Premium: Streetwear", description: "Urbano", accent: "#d61919", accentSoft: "#ff9797", surface: "#250b0b", text: "#fff3f3", premium: true },
  { key: "premium-ecologico", name: "Premium: Ecológico", description: "Orgánico", accent: "#609d4b", accentSoft: "#c5eda6", surface: "#142016", text: "#f2ffed", premium: true },
  { key: "premium-royal", name: "Premium: Royal", description: "Realeza / Prestigio", accent: "#d59b12", accentSoft: "#ffd970", surface: "#251a08", text: "#fff8e5", premium: true },
  { key: "standard-professional", name: "Estándar Profesional", description: "CMD Azul", accent: "#3b82f6", accentSoft: "#93c5fd", surface: "#111827", text: "#f8fafc", premium: false },
  { key: "netflix-red", name: "Efecto Netflix", description: "Rojo", accent: "#e50914", accentSoft: "#ff8f95", surface: "#1c080a", text: "#fff6f6", premium: false },
  { key: "gaming-blue", name: "Modo Gaming", description: "Azul", accent: "#0277bd", accentSoft: "#8cdbff", surface: "#081925", text: "#effaff", premium: false },
  { key: "minimalist", name: "Minimalista", description: "Blanco / Negro", accent: "#d0d5db", accentSoft: "#ffffff", surface: "#141414", text: "#ffffff", premium: false },
  { key: "neon-cyan", name: "Estilo Neón", description: "Cián", accent: "#00c2d4", accentSoft: "#8cfcff", surface: "#061e22", text: "#efffff", premium: false },
  { key: "gold-luxury", name: "Lujo Dorado", description: "Premium", accent: "#d59c16", accentSoft: "#ffe08a", surface: "#211907", text: "#fff8e8", premium: false },
  { key: "natura-green", name: "Natura Verde", description: "Orgánico", accent: "#2f974d", accentSoft: "#a2f2ae", surface: "#0c2212", text: "#effff2", premium: false },
  { key: "cyberpunk", name: "Cyberpunk", description: "Amarillo / Magenta", accent: "#f0a100", accentSoft: "#ff71c3", surface: "#231022", text: "#fff3fc", premium: false },
  { key: "deep-ocean", name: "Océano Profundo", description: "Azul Marino", accent: "#0a7ab8", accentSoft: "#82d3ff", surface: "#071724", text: "#effaff", premium: false },
  { key: "sakura", name: "Sakura", description: "Rosa Japonés", accent: "#d95e93", accentSoft: "#ffc0db", surface: "#28101c", text: "#fff3f8", premium: false },
  { key: "obsidian", name: "Obsidiana", description: "Gris Carbón", accent: "#7e8790", accentSoft: "#dbe1e5", surface: "#15171a", text: "#f7f8fa", premium: false },
  { key: "aurora", name: "Aurora Boreal", description: "Verde / Púrpura", accent: "#00a76f", accentSoft: "#bf70ff", surface: "#0a2420", text: "#effffb", premium: false },
  { key: "desert", name: "Desierto", description: "Arena / Terracota", accent: "#b66314", accentSoft: "#f5c488", surface: "#25170f", text: "#fff6ec", premium: false },
  { key: "midnight", name: "Medianoche", description: "Añil / Plata", accent: "#3355a7", accentSoft: "#c4d0ff", surface: "#0c1028", text: "#f1f4ff", premium: false },
  { key: "candy-pop", name: "Candy Pop", description: "Pastel Vibrante", accent: "#d94ece", accentSoft: "#ffd0fb", surface: "#251128", text: "#fff3ff", premium: false },
  { key: "matrix", name: "Matrix", description: "Verde Terminal", accent: "#00a334", accentSoft: "#90ffab", surface: "#061d0b", text: "#eaffed", premium: false },
  { key: "crimson-club", name: "Crimson Club", description: "Rojo Oscuro Elegante", accent: "#a40819", accentSoft: "#ff9aa4", surface: "#21070b", text: "#fff2f3", premium: false },
  { key: "glacier", name: "Glaciar", description: "Blanco / Azul Frío", accent: "#1685aa", accentSoft: "#c4f4ff", surface: "#0a1d25", text: "#f1fcff", premium: false },
  { key: "volcanic", name: "Volcánico", description: "Naranja Lava", accent: "#d64b00", accentSoft: "#ffb177", surface: "#251006", text: "#fff4ec", premium: false },
  { key: "velvet", name: "Terciopelo", description: "Púrpura Profundo", accent: "#6e38b8", accentSoft: "#d0afff", surface: "#180b2a", text: "#f9f1ff", premium: false },
];

export const storefrontTemplateByKey = new Map(
  storefrontTemplates.map((template) => [template.key, template]),
);

export function getStorefrontTemplate(key?: string | null) {
  return storefrontTemplateByKey.get(key ?? "") ?? storefrontTemplateByKey.get("standard-professional")!;
}

export const avatarFrames = [
  { key: null, name: "Sin marco" },
  { key: "neon", name: "Neón" },
  { key: "fire", name: "Fuego" },
  { key: "gold", name: "Dorado" },
] as const;
