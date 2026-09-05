import type { RefObject } from "react";
import { Search } from "lucide-react";

/** Search input + filter trigger row. */
export function SearchBar({
  value,
  onChange,
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  return (
    <section className="mt-4 sm:mt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar producto o servicio... ( / )"
            aria-label="Buscar producto o servicio"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition focus:border-primary/60 focus:outline-none"
          />
        </div>
      </div>
    </section>
  );
}
