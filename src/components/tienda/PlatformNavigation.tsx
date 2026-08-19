import * as React from "react";
import { Gift, Menu, Radio, Search, ShieldCheck, Store } from "lucide-react";
import { categories, platformShortcuts, type PlatformShortcut } from "./data";
import { cn } from "@/lib/utils";

type PlatformNavigationProps = {
  activeCategory: string;
  query: string;
  searchRef: React.RefObject<HTMLInputElement | null>;
  onCategorySelect: (categoryId: string) => void;
  onPlatformSelect: (platform: PlatformShortcut) => void;
  onQueryChange: (value: string) => void;
  onGoShop: () => void;
  onOpenAffiliate: () => void;
  onToggleSidebar: () => void;
};

/** Navegación responsive de categorías y accesos directos del catálogo. */
export function PlatformNavigation({
  activeCategory,
  query,
  searchRef,
  onCategorySelect,
  onPlatformSelect,
  onQueryChange,
  onGoShop,
  onOpenAffiliate,
  onToggleSidebar,
}: PlatformNavigationProps) {
  const [liveMode, setLiveMode] = React.useState(false);

  const surface = "border-border bg-background text-foreground";
  const mutedText = "text-muted-foreground";
  const control = "border-border bg-background text-foreground hover:border-primary/60";

  const selectCategory = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  return (
    <section className="relative" aria-label="Navegación de plataformas">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className={cn("transition-colors duration-300", surface)}>
          <div className="relative flex flex-wrap items-center gap-2 border-b border-current/10 py-2 sm:py-3">
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent",
                control,
              )}
              aria-label="Abrir menú de categorías"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onGoShop}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent",
                control,
              )}
            >
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Mi tienda
            </button>

            <button
              type="button"
              onClick={onOpenAffiliate}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent",
                control,
              )}
            >
              <Gift className="h-3.5 w-3.5 text-red-accent" aria-hidden="true" />
              Afilia y gana
            </button>

            <div className="order-last flex basis-full items-center justify-center sm:order-none sm:ml-auto sm:basis-auto lg:absolute lg:left-1/2 lg:-translate-x-1/2">
              <div
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold tracking-wide",
                  "border-red-accent/30 bg-red-accent/10 text-red-300",
                )}
              >
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                CMD Oficial
              </div>
            </div>

            <div className="ml-auto flex min-w-0 items-center gap-1.5">
              <label
                className={cn(
                  "relative flex h-9 w-[min(12rem,52vw)] items-center rounded-lg border pl-8 pr-12 sm:w-52",
                  control,
                )}
              >
                <Search className="absolute left-2.5 h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="Buscar"
                  className={cn(
                    "min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:opacity-60",
                    "text-foreground placeholder:text-muted-foreground",
                  )}
                />
                <kbd
                  className={cn(
                    "absolute right-1.5 rounded border px-1.5 py-0.5 font-mono text-[9px] leading-none",
                    "border-border text-muted-foreground",
                  )}
                >
                  Ctrl K
                </kbd>
              </label>

              <button
                type="button"
                onClick={() => setLiveMode((value) => !value)}
                aria-pressed={liveMode}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent",
                  liveMode
                    ? "border-red-accent bg-red-accent text-white"
                    : control,
                )}
              >
                <Radio className={cn("h-3.5 w-3.5", liveMode && "animate-pulse")} aria-hidden="true" />
                Modo Live
              </button>
            </div>
          </div>

          <div className="pt-5 sm:pt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Plataformas</h2>
              <p className={cn("mt-1 text-xs sm:text-sm", mutedText)}>
                Explora nuestro catálogo de productos y encuentra lo que necesitas
              </p>
            </div>

            <div
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-none"
              role="tablist"
              aria-label="Categorías del catálogo"
            >
              {categories.map((category) => {
                const active = activeCategory === category.id;
                return (
                  <button
                    key={category.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      "h-8 shrink-0 rounded-md border px-3 text-[10px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent sm:text-[11px]",
                      active
                        ? "border-red-accent bg-red-accent text-white"
                        : control,
                    )}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1.5 min-[420px]:grid-cols-6 sm:grid-cols-9 sm:gap-2 md:grid-cols-12 lg:grid-cols-[repeat(18,minmax(0,1fr))]">
              {platformShortcuts.map((platform) => (
                <button
                  key={platform.label}
                  type="button"
                  onClick={() => onPlatformSelect(platform)}
                  title={`Filtrar por ${platform.label}`}
                  className={cn(
                    "group relative flex aspect-square min-h-11 items-center justify-center overflow-hidden rounded-lg border p-2 transition duration-200 hover:-translate-y-0.5 hover:border-red-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent",
                    "border-border bg-background hover:border-red-accent/70",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute text-sm font-black opacity-35",
                      "text-muted-foreground",
                    )}
                  >
                    {platform.fallback}
                  </span>
                  <img
                    src={platform.logoUrl}
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="relative h-full max-h-8 w-full max-w-8 object-contain transition-transform duration-200 group-hover:scale-110"
                  />
                  <span className="sr-only">Filtrar por {platform.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}
