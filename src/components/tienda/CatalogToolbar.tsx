import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { Check, Loader2, Package, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { PlatformIconMark } from "@/lib/platformIcons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type CatalogSortKey = "sales-desc" | "price-asc" | "price-desc" | "recent";

export type CatalogFilters = {
  minPrice: string;
  maxPrice: string;
  durationDays: number[];
  availableOnly: boolean;
  renewalTypes: Array<"renewable" | "nonrenewable">;
};

export type CatalogSearchSuggestion = {
  id: string;
  name: string;
  price: number;
  categoryLabel: string;
  iconId: string | null;
};

export type CatalogDurationOption = {
  days: number;
  label: string;
};

type CatalogToolbarProps = {
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  suggestions: CatalogSearchSuggestion[];
  isDebouncing: boolean;
  onQueryChange: (query: string) => void;
  onSuggestionSelect: (id: string) => void;
  sort: CatalogSortKey;
  onSortChange: (sort: CatalogSortKey) => void;
  filters: CatalogFilters;
  onFiltersChange: Dispatch<SetStateAction<CatalogFilters>>;
  onClearFilters: () => void;
  priceBounds: { min: number; max: number };
  durationOptions: CatalogDurationOption[];
  resultCount: number;
};

function FilterCheckbox({
  checked,
  label,
  description,
  onChange,
}: {
  checked: boolean;
  label: string;
  description?: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card/55 p-3 transition-colors hover:border-primary/45">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-background text-primary focus:ring-primary/40"
      />
      <span className="min-w-0">
        <span className="block text-xs font-bold text-foreground">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

function getActiveFilterCount(filters: CatalogFilters) {
  return [
    filters.minPrice !== "",
    filters.maxPrice !== "",
    filters.durationDays.length > 0,
    filters.availableOnly,
    filters.renewalTypes.length > 0,
  ].filter(Boolean).length;
}

export function CatalogToolbar({
  query,
  inputRef,
  suggestions,
  isDebouncing,
  onQueryChange,
  onSuggestionSelect,
  sort,
  onSortChange,
  filters,
  onFiltersChange,
  onClearFilters,
  priceBounds,
  durationOptions,
  resultCount,
}: CatalogToolbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeFilterCount = getActiveFilterCount(filters);
  const hasSearchText = query.trim().length > 0;

  useEffect(
    () => () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current);
    },
    [],
  );

  const deferCloseSearch = () => {
    blurTimerRef.current = setTimeout(() => setSearchOpen(false), 120);
  };

  const toggleDuration = (days: number) => {
    onFiltersChange((current) => ({
      ...current,
      durationDays: current.durationDays.includes(days)
        ? current.durationDays.filter((value) => value !== days)
        : [...current.durationDays, days],
    }));
  };

  const toggleRenewalType = (type: "renewable" | "nonrenewable") => {
    onFiltersChange((current) => ({
      ...current,
      renewalTypes: current.renewalTypes.includes(type)
        ? current.renewalTypes.filter((value) => value !== type)
        : [...current.renewalTypes, type],
    }));
  };

  return (
    <>
      <section className="mt-4 border-y border-border bg-background">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-2 px-4 py-3 sm:gap-3">
          <div className="relative min-w-0 basis-full sm:flex-1">
            <div className="relative flex h-9 items-center rounded-lg border border-border bg-background pl-9 pr-8 transition-colors focus-within:border-primary/60">
              <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(event) => {
                  onQueryChange(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={deferCloseSearch}
                placeholder="Buscar productos..."
                autoComplete="off"
                className="w-full bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                aria-autocomplete="list"
                aria-expanded={searchOpen && hasSearchText}
                aria-controls="catalog-search-suggestions"
              />
              {hasSearchText && (
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onQueryChange("");
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2 grid h-5 w-5 place-items-center rounded text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {searchOpen && hasSearchText && (
              <div
                id="catalog-search-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl shadow-black/20"
              >
                {isDebouncing ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    Buscando productos…
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    No se encontraron productos para tu búsqueda.
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto p-1.5 cmd-dark-scrollbar">
                    {suggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        role="option"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          onSuggestionSelect(product.id);
                          setSearchOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                      >
                        {product.iconId ? (
                          <PlatformIconMark
                            iconId={product.iconId}
                            className="h-8 w-8 shrink-0 border border-white/15"
                            iconClassName="h-3.5 w-3.5"
                          />
                        ) : (
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border bg-muted text-muted-foreground">
                            <Package className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-foreground">
                            {product.name}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-muted-foreground">
                            {product.categoryLabel}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs font-black text-primary">
                          S/ {product.price.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <label className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
            <span className="sr-only">Ordenar productos</span>
            <select
              value={sort}
              onChange={(event) => onSortChange(event.target.value as CatalogSortKey)}
              className="h-9 w-full appearance-none rounded-lg border border-border bg-card px-3 pr-8 text-[10px] font-bold text-foreground outline-none transition-colors focus:border-primary/60"
            >
              <option value="sales-desc">Más vendidos</option>
              <option value="price-asc">Precio: menor a mayor</option>
              <option value="price-desc">Precio: mayor a menor</option>
              <option value="recent">Más recientes</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
              ⌄
            </span>
          </label>

          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[10px] font-bold text-foreground transition-colors hover:border-primary/60"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-black text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </section>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-2xl gap-0 overflow-hidden border-border bg-card p-0 shadow-2xl shadow-black/25">
          <DialogHeader className="border-b border-border p-5 pr-12 text-left sm:p-6">
            <DialogTitle className="text-lg font-black text-foreground">Filtros avanzados</DialogTitle>
            <DialogDescription className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Combina precio, duración, disponibilidad y tipo de cuenta para afinar el catálogo.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(58dvh,36rem)] space-y-5 overflow-y-auto p-5 cmd-dark-scrollbar sm:p-6">
            <section>
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.13em] text-foreground">
                  Rango de precio
                </h3>
                <span className="text-[10px] text-muted-foreground">
                  S/ {priceBounds.min.toFixed(2)} – S/ {priceBounds.max.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Desde
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={filters.minPrice}
                    onChange={(event) =>
                      onFiltersChange((current) => ({ ...current, minPrice: event.target.value }))
                    }
                    placeholder={`S/ ${priceBounds.min.toFixed(2)}`}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Hasta
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={filters.maxPrice}
                    onChange={(event) =>
                      onFiltersChange((current) => ({ ...current, maxPrice: event.target.value }))
                    }
                    placeholder={`S/ ${priceBounds.max.toFixed(2)}`}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
                  />
                </label>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-xs font-black uppercase tracking-[0.13em] text-foreground">
                Duración
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {durationOptions.map((option) => (
                  <FilterCheckbox
                    key={option.days}
                    checked={filters.durationDays.includes(option.days)}
                    label={option.label}
                    onChange={() => toggleDuration(option.days)}
                  />
                ))}
              </div>
            </section>

            <section className="grid gap-2 sm:grid-cols-3">
              <FilterCheckbox
                checked={filters.availableOnly}
                label="Solo disponibles"
                description="Oculta productos agotados."
                onChange={() =>
                  onFiltersChange((current) => ({
                    ...current,
                    availableOnly: !current.availableOnly,
                  }))
                }
              />
              <FilterCheckbox
                checked={filters.renewalTypes.includes("renewable")}
                label="Renovable"
                description="Con opción de renovación."
                onChange={() => toggleRenewalType("renewable")}
              />
              <FilterCheckbox
                checked={filters.renewalTypes.includes("nonrenewable")}
                label="No renovable"
                description="Vence en la fecha indicada."
                onChange={() => toggleRenewalType("nonrenewable")}
              />
            </section>
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border p-5 sm:p-6">
            <button
              type="button"
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-foreground transition-colors hover:border-primary/60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(false)}
              className="inline-flex items-center gap-2 rounded-lg bg-red-accent px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-white transition-colors hover:brightness-110"
            >
              <Check className="h-3.5 w-3.5" />
              Ver {resultCount} producto{resultCount === 1 ? "" : "s"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
