export const AVATAR_EFFECTS = [
  { id: "none", label: "Sin efecto", desc: "Avatar limpio, sin animación." },
  { id: "white-flame", label: "Llama blanca", desc: "Aura blanca suave girando." },
  { id: "red-fire", label: "Fuego rojo", desc: "Llamas rojas premium." },
  { id: "neon-energy", label: "Energía neón", desc: "Anillo neón rojo, azul y violeta." },
  { id: "electric", label: "Relámpago", desc: "Arcos eléctricos en el borde." },
  { id: "cyber-ring", label: "Anillo cyberpunk", desc: "HUD digital giratorio." },
  { id: "energy-pulse", label: "Pulso de energía", desc: "Pulso circular expansivo." },
  { id: "galaxy", label: "Órbita galáctica", desc: "Partículas en órbita." },
  { id: "gold-premium", label: "Oro premium", desc: "Anillo metálico dorado." },
  { id: "particles", label: "Tormenta de partículas", desc: "Partículas luminosas." },
  { id: "holographic", label: "Holográfico", desc: "Reflejos cian y violeta." },
  { id: "rgb-neon", label: "RGB neón", desc: "Degradado animado multicolor." },
  { id: "white-energy", label: "Energía blanca", desc: "Estela de luz continua." },
  { id: "meteor", label: "Órbita meteoro", desc: "Meteoro con estela corta." },
  { id: "scanner", label: "Escáner digital", desc: "Barrido de luz vertical." },
] as const;

export type AvatarEffectId = (typeof AVATAR_EFFECTS)[number]["id"];

export const AVATAR_EFFECT_IDS = AVATAR_EFFECTS.map((e) => e.id) as readonly string[];

/** Tupla no vacía para validación con zod en el servidor. */
export const AVATAR_EFFECT_VALUES = AVATAR_EFFECTS.map((e) => e.id) as unknown as [
  AvatarEffectId,
  ...AvatarEffectId[],
];

/** Etiqueta legible de un efecto ("Relámpago", "Oro premium", ...). */
export function effectLabel(value?: string | null): string {
  const id = normalizeEffect(value);
  return AVATAR_EFFECTS.find((e) => e.id === id)?.label ?? "Sin efecto";
}

export function normalizeEffect(value?: string | null): AvatarEffectId {
  return (AVATAR_EFFECT_IDS.includes(value ?? "") ? value : "none") as AvatarEffectId;
}
