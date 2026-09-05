import {
  BadgeCheck,
  DollarSign,
  Eye,
  Moon as MoonIcon,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";
import { IconBtn } from "./IconBtn";

/** Customer profile chip below the banner + action row. */
export function ProfileHeader({
  authed,
  displayName,
  initials,
  cartCount,
  onOpenCart,
}: {
  authed: boolean;
  displayName: string;
  initials: string;
  cartCount: number;
  onOpenCart: () => void;
}) {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 sm:-mt-12 relative z-10">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-end gap-3 sm:gap-4 min-w-0">
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4 border-background bg-white/5 text-white font-bold text-lg sm:text-2xl shrink-0">
            {authed ? (
              initials || <UserIcon className="w-7 h-7 sm:w-9 sm:h-9 m-auto" />
            ) : (
              <img
                src="/cmd-logo.png"
                alt="Avatar de CMD Streaming"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <div className="pb-1 sm:pb-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <p className="font-display text-lg sm:text-2xl text-white truncate">
                {authed ? displayName : "@camd"}
              </p>
              <BadgeCheck className="w-4 h-4 sm:w-5 sm:h-5 text-red-accent fill-red-accent/30 shrink-0" />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-300 text-[10px] font-semibold">
                1.2K Ventas
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-[10px] font-semibold">
                <MoonIcon className="w-3 h-3" /> Fuera de horario
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pb-1 sm:pb-2 flex-wrap">
          <IconBtn label="Vista previa">
            <Eye aria-hidden="true" className="w-4 h-4" />
          </IconBtn>
          <IconBtn label="Modo oscuro">
            <MoonIcon aria-hidden="true" className="w-4 h-4" />
          </IconBtn>
          <IconBtn label="Moneda">
            <DollarSign aria-hidden="true" className="w-4 h-4" />
          </IconBtn>
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`Abrir carrito${cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}` : ""}`}
            className="cmd-on-accent relative inline-flex min-h-11 items-center gap-2 rounded-full gradient-violet px-3.5 py-2 text-xs font-semibold hover:scale-[1.03] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <ShoppingCart aria-hidden="true" className="w-4 h-4" />
            Carrito
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-red-accent grid place-items-center text-[10px] font-bold"
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
