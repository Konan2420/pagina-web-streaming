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
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" />
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Buscar producto o servicio... ( / )"
            aria-label="Buscar producto o servicio"
            className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/62 focus:outline-none focus:border-violet-2/60 transition"
          />
        </div>
      </div>
    </section>
  );
}
