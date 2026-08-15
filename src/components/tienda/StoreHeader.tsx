import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import type { Session } from "@supabase/supabase-js";

/** Sticky store top bar: brand + user chip / sign-in. */
export function StoreHeader({
  session,
  displayName,
  initials,
  onSignIn,
  onSignOut,
}: {
  session: Session | null;
  displayName: string;
  initials: string;
  onSignIn: () => void;
  onSignOut: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-background/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src="/favicon.png"
            alt="CMD Streaming"
            className="h-10 w-10 rounded-xl object-contain"
          />
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <div className="hidden sm:flex items-center gap-2 pr-2">
                <div className="w-9 h-9 rounded-full gradient-violet grid place-items-center text-[11px] font-bold text-white">
                  {initials || "US"}
                </div>
                <div className="leading-tight">
                  <p className="text-[10px] text-white/70">Hola,</p>
                  <p className="text-xs text-white font-semibold truncate max-w-[140px]">
                    {displayName}
                  </p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-violet-2/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </button>
            </>
          ) : (
            <button
              onClick={onSignIn}
              className="text-xs text-white px-3 py-1.5 rounded-full gradient-violet"
            >
              Iniciar sesión
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
