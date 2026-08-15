import { ShieldCheck, User as UserIcon } from "lucide-react";
import { AvatarEffect } from "@/components/supplier/AvatarEffect";
import { normalizeEffect } from "@/lib/avatar-effects";
import { getAvatarUrl } from "@/components/tienda/data";

type Size = "sm" | "md" | "lg";

const BOX: Record<Size, string> = {
  sm: "w-12 h-12",
  md: "w-28 h-28",
  lg: "w-40 h-40",
};

type Props = {
  src?: string | null;
  effect?: string | null;
  size?: Size;
  /** "online" | "offline" | null */
  status?: string | null;
  verified?: boolean | null;
  alt?: string;
  className?: string;
};

/**
 * Avatar único del proveedor: misma imagen y mismo efecto en panel de proveedor,
 * tienda pública, directorio y panel de administración.
 */
export function ProviderAvatar({
  src,
  effect,
  size = "md",
  status,
  verified,
  alt = "Avatar del proveedor",
  className = "",
}: Props) {
  const fx = normalizeEffect(effect);
  const resolved = getAvatarUrl(src);
  return (
    <div className={`relative inline-block ${className}`}>
      <AvatarEffect effect={fx} size={size}>
        <div
          className={`${BOX[size]} rounded-full overflow-hidden border border-white/10 bg-white/5 grid place-items-center`}
        >
          {resolved ? (
            <img src={resolved} alt={alt} loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-1/2 h-1/2 text-muted-foreground" />
          )}
        </div>
      </AvatarEffect>

      {verified && (
        <span className="absolute -bottom-1 -right-1 z-20 bg-green-500 text-white p-1 rounded-xl border-2 border-ink">
          <ShieldCheck className="w-3 h-3" />
        </span>
      )}
      {status && !verified && (
        <span
          className={`absolute bottom-0 right-0 z-20 w-3 h-3 rounded-full border-2 border-ink ${
            status === "online" ? "bg-green-500" : "bg-muted-foreground"
          }`}
        />
      )}
    </div>
  );
}
