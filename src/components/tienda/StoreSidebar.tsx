import { useState, type ReactNode } from "react";
import {
  BriefcaseBusiness,
  ChevronDown,
  Download,
  FolderTree,
  LayoutDashboard,
  Newspaper,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { categories } from "./data";
import { cn } from "@/lib/utils";

type StorePanel = "tienda" | "compras" | "perfil";

type StoreSidebarProps = {
  open: boolean;
  sessionActive: boolean;
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  activePanel: StorePanel | "supplier_info";
  activeCategory: string;
  onClose: () => void;
  onCategorySelect: (categoryId: string) => void;
  onPanelSelect: (panel: StorePanel) => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onUnavailable: (feature: string) => void;
};

const catalogQuickLinks = ["todo", "redes", "recargas", "giftcards", "videojuegos"];

/** Barra lateral del catálogo. Sus acciones usan los filtros y paneles reales de la tienda. */
export function StoreSidebar({
  open,
  sessionActive,
  displayName,
  initials,
  avatarUrl,
  activePanel,
  activeCategory,
  onClose,
  onCategorySelect,
  onPanelSelect,
  onOpenWallet,
  onOpenAuth,
  onUnavailable,
}: StoreSidebarProps) {
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(true);
  const profileName = sessionActive ? displayName : "Invitado";

  const selectPanel = (panel: StorePanel) => {
    onPanelSelect(panel);
    onClose();
  };

  const selectCategory = (categoryId: string) => {
    onCategorySelect(categoryId);
    onClose();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú lateral"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[190px] flex-col border-r border-border bg-background p-3 text-foreground transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="mb-5 flex items-start justify-between px-2 pt-1">
          <div className="flex flex-col items-center gap-1">
            <img src="/favicon.png" alt="CMD Streaming" className="h-11 w-11 rounded-xl object-contain" />
            <span className="text-[8px] font-black tracking-[0.42em] text-white/70">CMD</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-white/55 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Cerrar menú lateral"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <section className="mb-4 rounded-lg border border-border bg-background p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-white/70">
            <Wallet className="h-3.5 w-3.5 text-red-accent" aria-hidden="true" />
            Mi Billetera
          </div>
          <p className="mt-2 text-lg font-black tracking-tight text-white">S/ —</p>
          <p className="text-[9px] text-white/40">Saldo disponible al iniciar sesión</p>
          <button
            type="button"
            onClick={onOpenWallet}
            className="mt-3 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-red-accent text-[10px] font-black text-white transition hover:brightness-110"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Recargar saldo
          </button>
        </section>

        <nav className="min-h-0 flex-1 overflow-y-auto pr-1 text-[11px]">
          <div className="space-y-0.5">
            <SidebarButton icon={<Newspaper />} label="Noticias" onClick={() => onUnavailable("Noticias")} />
            <SidebarButton icon={<Trophy />} label="Ranking" onClick={() => onUnavailable("Ranking")} />
            <SidebarButton
              icon={<FolderTree />}
              label="Catálogo"
              expanded={catalogOpen}
              onClick={() => setCatalogOpen((value) => !value)}
            />
          </div>

          {catalogOpen && (
            <div className="my-1 ml-3 border-l border-border pl-2">
              {catalogQuickLinks.map((categoryId) => {
                const category = categories.find((item) => item.id === categoryId);
                if (!category) return null;
                const active = activePanel === "tienda" && activeCategory === categoryId;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      "flex min-h-7 w-full items-center rounded-lg px-2 text-left text-[10px] font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-white"
                        : "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
                    )}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-1 space-y-0.5">
            <SidebarButton
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activePanel === "tienda" && activeCategory === "todo"}
              onClick={() => selectCategory("todo")}
            />
            <SidebarButton
              icon={<BriefcaseBusiness />}
              label="Mi Negocio"
              expanded={businessOpen}
              onClick={() => setBusinessOpen((value) => !value)}
            />
          </div>

          {businessOpen && (
            <div className="my-1 ml-3 border-l border-border pl-2">
              <button
                type="button"
                onClick={() => (sessionActive ? selectPanel("tienda") : onOpenAuth())}
                className={cn(
                  "flex min-h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[10px] font-semibold transition-colors",
                  activePanel === "tienda" ? "text-white" : "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
                )}
              >
                <ShoppingBag className="h-3 w-3" aria-hidden="true" /> Mi Tienda
              </button>
              <button
                type="button"
                onClick={() => (sessionActive ? selectPanel("compras") : onOpenAuth())}
                className={cn(
                  "flex min-h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[10px] font-semibold transition-colors",
                  activePanel === "compras" ? "text-white" : "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
                )}
              >
                <Package className="h-3 w-3" aria-hidden="true" /> Pedidos
              </button>
              <button
                type="button"
                onClick={() => (sessionActive ? selectPanel("perfil") : onOpenAuth())}
                className={cn(
                  "flex min-h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[10px] font-semibold transition-colors",
                  activePanel === "perfil" ? "text-white" : "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
                )}
              >
                <Users className="h-3 w-3" aria-hidden="true" /> Mi Perfil
              </button>
            </div>
          )}

          <SidebarButton icon={<Download />} label="Descargar App" onClick={() => onUnavailable("La app")} />
        </nav>

        <div className="mt-3 border-t border-border pt-3">
          <div className="mb-3 inline-flex items-center gap-1 rounded-lg border border-green-400/20 bg-green-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-green-300">
            <Sparkles className="h-3 w-3" aria-hidden="true" /> Catálogo activo
          </div>
          <button
            type="button"
            onClick={() => (sessionActive ? selectPanel("perfil") : onOpenAuth())}
            className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-white/[0.05]"
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-red-accent text-[10px] font-black text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials || "IN"
              )}
            </div>
            <span className="min-w-0">
              <span className="block truncate text-[10px] font-bold text-white">{profileName}</span>
              <span className="block text-[9px] text-white/45">{sessionActive ? "Cliente" : "Inicia sesión"}</span>
            </span>
            <ChevronDown className="ml-auto h-3.5 w-3.5 -rotate-90 text-white/45" aria-hidden="true" />
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarButton({
  icon,
  label,
  active = false,
  expanded,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-semibold transition-colors",
        active ? "bg-primary/10 text-white" : "text-white/70 hover:bg-white/[0.045] hover:text-white",
      )}
    >
      <span className="text-white/65 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {label}
      {expanded !== undefined && (
        <ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", expanded && "rotate-180")} />
      )}
    </button>
  );
}
