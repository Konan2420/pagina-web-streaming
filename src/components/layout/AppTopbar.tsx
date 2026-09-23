import { Link, useLocation } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Gift, PanelLeft, Radio, Search, Store } from "lucide-react";
import { getMyStorefrontPublicLink } from "@/lib/storefront.functions";
import { WA_NUMBER } from "@/components/tienda/data";
import { cn } from "@/lib/utils";
import { ColorModeIcon, useAppChrome } from "./AppChromeContext";
import type { BusinessSection } from "./business-navigation";

type BusinessNavigation = {
  sections: readonly BusinessSection[];
};

type AppTopbarProps = {
  onToggleSidebar?: () => void;
  /** Secciones internas, disponibles exclusivamente desde los paneles de negocio. */
  businessNavigation?: BusinessNavigation;
  className?: string;
};

/** Barra global de la aplicación. Los estados de tema y modo Live viven en AppChromeProvider. */
export function AppTopbar({ onToggleSidebar, businessNavigation, className }: AppTopbarProps) {
  const { pathname } = useLocation();
  const { colorMode, liveMode, toggleColorMode, toggleLiveMode, openCommandPalette } =
    useAppChrome();
  const getMyPublicStore = useServerFn(getMyStorefrontPublicLink);
  const control = "border-border bg-background text-foreground hover:border-primary/60";

  const openMyPublicStore = async () => {
    try {
      const { slug } = await getMyPublicStore();
      window.open(`/tienda-publica/${slug}`, "_blank", "noopener,noreferrer");
    } catch {
      window.open("/", "_blank", "noopener,noreferrer");
    }
  };

  const openAffiliate = () => {
    const message = encodeURIComponent(
      "Hola, quiero conocer el programa de afiliados de CMD Streaming y cómo puedo empezar a ganar comisiones.",
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${message}`, "_blank", "noopener,noreferrer");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur",
        className,
      )}
    >
      <div className="mx-auto flex min-h-14 max-w-[1600px] items-center gap-2 px-4 py-2 sm:px-6 lg:min-h-11 lg:py-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "grid h-11 w-11 shrink-0 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 sm:w-9 lg:h-8 lg:w-8",
                control,
              )}
              aria-label="Mostrar u ocultar barra lateral"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}

          {/* Con secciones, «Mi Tienda» es una entrada del nav: el botón sería un duplicado, y
              en /proveedor/mi-tienda apuntaba a la página en la que ya estabas. */}
          {!businessNavigation && (
            <button
              type="button"
              onClick={() => void openMyPublicStore()}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 lg:h-8 lg:px-2.5 lg:text-[10px]",
                control,
              )}
            >
              <Store className="h-3.5 w-3.5" />
              <span>Mi tienda</span>
            </button>
          )}

          <button
            type="button"
            onClick={openAffiliate}
            className={cn(
              "inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 lg:h-8 lg:px-2.5 lg:text-[10px]",
              control,
            )}
          >
            <Gift className="h-3.5 w-3.5 text-primary" />
            <span>Afilia y gana</span>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={openCommandPalette}
            className={cn(
              "inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 lg:h-8 lg:px-2.5 lg:text-[10px]",
              control,
            )}
            aria-label="Abrir buscador global"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar</span>
            <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={toggleColorMode}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 sm:w-9 lg:h-8 lg:w-8",
              control,
            )}
            aria-label={colorMode === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
          >
            <ColorModeIcon />
          </button>
          <button
            type="button"
            onClick={toggleLiveMode}
            aria-pressed={liveMode}
            className={cn(
              "inline-flex h-11 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-9 lg:h-8 lg:px-2.5 lg:text-[9px]",
              liveMode ? "cmd-on-accent border-primary bg-primary" : control,
            )}
          >
            <Radio className={cn("h-3.5 w-3.5", liveMode && "animate-pulse")} />
            <span className="hidden sm:inline">Modo Live</span>
          </button>
        </div>
      </div>

      {/* Segunda fila del mismo <header>: al ser sticky, las tablas largas de Inventario y Ventas
          se desplazan sin que el nav desaparezca. */}
      {businessNavigation && (
        <nav aria-label="Secciones del panel" className="border-t border-border/70">
          <div className="mx-auto flex max-w-[1600px] items-center gap-1 overflow-x-auto px-4 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
            {businessNavigation.sections.map((section) => {
              const active = pathname === section.to;
              return (
                <Link
                  key={section.to}
                  to={section.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center rounded-lg px-3 text-[11px] font-bold transition-colors lg:h-8 lg:px-2.5 lg:text-[10px]",
                    active
                      ? "cmd-active-subtle"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {section.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
