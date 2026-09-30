/**
 * Catálogo central de efectos visuales de las tarjetas.
 *
 * El valor de la base de datos nunca se concatena directamente en una clase:
 * solo los efectos registrados aquí pueden modificar la interfaz.
 */
export const CARD_EFFECT_CLASSES = {
  none: "",
  electric: "cmd-effect-electric",
} as const;

export type CardEffect = keyof typeof CARD_EFFECT_CLASSES;

export function getCardEffectClass(effect: string | null | undefined) {
  return CARD_EFFECT_CLASSES[effect as CardEffect] ?? CARD_EFFECT_CLASSES.none;
}
