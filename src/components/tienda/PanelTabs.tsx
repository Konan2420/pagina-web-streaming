import type { ReactNode } from "react";
import { Package, ShoppingBag, UserCircle2 } from "lucide-react";
import type { PanelTab } from "./data";

function PanelTabBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
        active ? "gradient-violet cmd-on-accent" : "text-white/78 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Tienda / Mis Compras / Mi Perfil segmented tabs. */
export function PanelTabs({
  panel,
  onChange,
}: {
  panel: PanelTab;
  onChange: (p: PanelTab) => void;
}) {
  return (
    <section className="mt-6">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 gap-1 w-full sm:w-auto overflow-x-auto scrollbar-none">
          <PanelTabBtn
            active={panel === "tienda"}
            onClick={() => onChange("tienda")}
            icon={<ShoppingBag className="w-4 h-4" />}
            label="Tienda"
          />
          <PanelTabBtn
            active={panel === "compras"}
            onClick={() => onChange("compras")}
            icon={<Package className="w-4 h-4" />}
            label="Mis Compras"
          />
          <PanelTabBtn
            active={panel === "perfil"}
            onClick={() => onChange("perfil")}
            icon={<UserCircle2 className="w-4 h-4" />}
            label="Mi Perfil"
          />
        </div>
      </div>
    </section>
  );
}
