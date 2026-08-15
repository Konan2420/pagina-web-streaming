import type { ReactNode } from "react";
import { normalizeEffect } from "@/lib/avatar-effects";

type Props = {
  effect?: string | null;
  /** `sm` usa una versión simplificada para avatares pequeños (listas, pedidos). */
  size?: "sm" | "md" | "lg";
  className?: string;
  children: ReactNode;
};

/**
 * Envoltorio circular que dibuja el efecto animado alrededor del avatar.
 * Todas las animaciones son CSS (transform/opacity) y respetan prefers-reduced-motion.
 */
export function AvatarEffect({ effect, size = "md", className = "", children }: Props) {
  const fx = normalizeEffect(effect);
  return (
    <div className={`avfx avfx-${fx} avfx-${size} ${className}`}>
      <span aria-hidden className="avfx-l1" />
      <span aria-hidden className="avfx-l2" />
      <div className="avfx-content">{children}</div>
    </div>
  );
}
