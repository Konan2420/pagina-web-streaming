import { categories } from "./data";

/** Horizontal category picker for the shop. */
export function CategoryTabs({
  activeCat,
  onChange,
}: {
  activeCat: string;
  onChange: (id: string) => void;
}) {
  return (
    <section className="mt-6 sm:mt-8">
      <div
        className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto scrollbar-none pb-2"
        style={{ scrollbarWidth: "none" }}
      >
        {categories.map((c) => {
          const active = c.id === activeCat;
          return (
            <button
              key={c.id}
              onClick={() => onChange(c.id)}
              style={
                active
                  ? {
                      backgroundColor: c.accent,
                      borderColor: c.accent,
                      boxShadow: `0 10px 24px ${c.accent}40`,
                    }
                  : undefined
              }
              className={`shrink-0 flex flex-col items-center gap-1 min-w-[86px] px-3 py-2.5 rounded-xl border transition-all ${
                active
                  ? "text-white"
                  : "bg-white/[0.03] border-white/10 text-white/70 hover:text-white"
              }`}
            >
              <c.icon className="w-5 h-5" style={active ? undefined : { color: c.accent }} />
              <span className="text-[11px] font-semibold tracking-tight text-center leading-tight">
                {c.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
