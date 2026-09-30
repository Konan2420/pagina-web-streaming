export const PREMIUM_CARD_STYLES = {
  purple: "cmd-premium-electric cmd-premium-purple",
  blue: "cmd-premium-electric cmd-premium-blue",
  gold: "cmd-premium-electric cmd-premium-gold",
} as const;

export type PremiumStyle = keyof typeof PREMIUM_CARD_STYLES;

export function getPremiumCardClasses(
  isPremium: boolean | null | undefined,
  style: string | null | undefined,
) {
  if (!isPremium) return "";
  return PREMIUM_CARD_STYLES[style as PremiumStyle] ?? PREMIUM_CARD_STYLES.purple;
}
