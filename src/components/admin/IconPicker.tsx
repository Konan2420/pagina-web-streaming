import { Check, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { getPlatformIcon, platformIcons, PlatformIconMark } from "@/lib/platformIcons";
import { cn } from "@/lib/utils";

type IconPickerProps = {
  value?: string | null;
  onSelect: (iconId: string | null) => void;
};

/** Selector reutilizable de marcas predefinidas para productos y plataformas. */
export function IconPicker({ value = null, onSelect }: IconPickerProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const selected = getPlatformIcon(value);

  const filteredIcons = useMemo(
    () =>
      platformIcons.filter((icon) => {
        if (!normalizedQuery) return true;
        return [icon.name, icon.id, ...(icon.aliases ?? [])]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      }),
    [normalizedQuery],
  );

  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.025] p-3 sm:p-4" aria-label="Selector de ícono">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-white/80">Ícono predefinido</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">
            Se mostrará como identificador visual en la tarjeta del catálogo.
          </p>
        </div>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1 text-[9px] font-bold text-white/55 transition hover:border-red-accent/45 hover:text-white"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Quitar {selected.name}
          </button>
        )}
      </div>

      <label className="relative mt-3 block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar Netflix, IA, juegos…"
          className="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-8 pr-8 text-xs text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded text-white/35 transition hover:bg-white/10 hover:text-white"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
      </label>

      <div className="cmd-dark-scrollbar mt-3 max-h-56 overflow-y-auto pr-1">
        {filteredIcons.length > 0 ? (
          <div className="grid grid-cols-4 gap-2 xs:grid-cols-5 sm:grid-cols-6">
            {filteredIcons.map((icon) => {
              const isSelected = icon.id === value;
              return (
                <button
                  key={icon.id}
                  type="button"
                  onClick={() => onSelect(icon.id)}
                  aria-pressed={isSelected}
                  title={icon.name}
                  className={cn(
                    "group relative flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isSelected
                      ? "border-primary bg-primary/15 text-white shadow-[0_0_0_1px_rgba(220,38,38,0.2)]"
                      : "border-transparent text-white/55 hover:border-white/15 hover:bg-white/[0.055] hover:text-white",
                  )}
                >
                  <PlatformIconMark
                    iconId={icon.id}
                    className="h-8 w-8 transition-transform duration-200 group-hover:scale-105"
                    iconClassName="h-4 w-4"
                  />
                  <span className="w-full truncate text-center text-[8px] font-bold leading-tight">{icon.name}</span>
                  {isSelected && (
                    <span className="absolute right-1 top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-primary text-white">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-white/40">No encontramos un ícono con esa búsqueda.</p>
        )}
      </div>
    </section>
  );
}
