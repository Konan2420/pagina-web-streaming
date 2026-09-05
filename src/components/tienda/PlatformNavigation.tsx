import { categories, platformShortcuts, type PlatformShortcut } from "./data";
import { cn } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";
import { getPlatformIconIdByName, PlatformIconMark } from "@/lib/platformIcons";

type PlatformNavigationProps = {
  activeCategory: string;
  platforms: PlatformShortcut[];
  onCategorySelect: (categoryId: string) => void;
  onPlatformSelect: (platform: PlatformShortcut) => void;
  showCatalogNavigation?: boolean;
};

function PlatformShortcutIcon({ platform }: { platform: PlatformShortcut }) {
  if (platform.iconUrl) {
    return (
      <span aria-hidden="true" className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-[10px] font-black text-white shadow-sm transition-transform duration-200 sm:h-10 sm:w-10">
        <span>{platform.fallback}</span>
        <img src={platform.iconUrl} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} className="cmd-media-frame absolute inset-0 h-full w-full object-contain p-1" />
      </span>
    );
  }

  const iconId = platform.iconId ?? getPlatformIconIdByName(platform.label);
  if (iconId) return <PlatformIconMark iconId={iconId} className="h-9 w-9 transition-transform duration-200 sm:h-10 sm:w-10" />;

  return <span aria-hidden="true" className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-white/[0.08] text-xs font-black text-white shadow-sm transition-transform duration-200 sm:h-10 sm:w-10">{platform.fallback}</span>;
}

/** Navegación exclusiva del catálogo; la barra superior vive en AppTopbar. */
export function PlatformNavigation({ activeCategory, platforms, onCategorySelect, onPlatformSelect, showCatalogNavigation = true }: PlatformNavigationProps) {
  const categoryScroll = useHorizontalScroll();
  const visiblePlatformShortcuts = platforms.length > 0 ? platforms : platformShortcuts;
  const control = "border-border bg-background text-foreground hover:border-primary/60";

  if (!showCatalogNavigation) return null;

  return (
    <section className="relative" aria-label="Navegación de plataformas">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <div className="pt-5 sm:pt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Plataformas</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Explora nuestro catálogo de productos y encuentra lo que necesitas</p>
          </div>
          <div className="relative">
            <div ref={categoryScroll.scrollRef} className={cn("flex touch-pan-x gap-2 overflow-x-auto pb-2 scrollbar-none select-none", categoryScroll.isDragging ? "cursor-grabbing" : "cursor-grab")} role="tablist" aria-label="Categorías del catálogo" onPointerDown={categoryScroll.onPointerDown} onPointerMove={categoryScroll.onPointerMove} onPointerUp={categoryScroll.onPointerUp} onPointerCancel={categoryScroll.onPointerCancel} onClickCapture={categoryScroll.onClickCapture}>
              {categories.map((category) => {
                const active = activeCategory === category.id;
                return <button key={category.id} type="button" role="tab" aria-selected={active} onClick={() => onCategorySelect(category.id)} className={cn("min-h-11 shrink-0 rounded-md border px-3 text-[10px] font-bold transition-[background-color,border-color,color,opacity,transform] duration-150 active:scale-[0.98] active:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-8 sm:min-h-8 sm:text-[11px]", active ? "cmd-on-accent border-primary bg-primary" : control)}>{category.label}</button>;
              })}
            </div>
            {categoryScroll.hasStartOverflow && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />}
            {categoryScroll.hasEndOverflow && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />}
          </div>
          <div className="catalog-platform-grid mt-4">
            {visiblePlatformShortcuts.map((platform) => <button key={platform.label} type="button" onClick={() => onPlatformSelect(platform)} title={`Filtrar por ${platform.label}`} className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card p-1 transition duration-200 hover:scale-[1.04] hover:border-primary/70 hover:shadow-[0_0_14px_rgba(59,130,246,0.24)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-11 sm:w-11"><PlatformShortcutIcon platform={platform} /><span className="sr-only">Filtrar por {platform.label}</span></button>)}
          </div>
        </div>
      </div>
    </section>
  );
}
