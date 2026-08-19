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
  collapsed: boolean;
  sessionActive: boolean;
  canManageStore: boolean;
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  activePanel: StorePanel | "supplier_info";
  activeCategory: string;
  onClose: () => void;
  onCategorySelect: (categoryId: string) => void;
  onPanelSelect: (panel: StorePanel) => void;
  onOpenSellerStore: () => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onUnavailable: (feature: string) => void;
};

const catalogQuickLinks = ["todo", "redes", "recargas", "giftcards", "videojuegos"];

/** Barra lateral del catálogo. Sus acciones usan los filtros y paneles reales de la tienda. */
export function StoreSidebar({
  open,
  collapsed,
  sessionActive,
  canManageStore,
  displayName,
  initials,
  avatarUrl,
  activePanel,
  activeCategory,
  onClose,
  onCategorySelect,
  onPanelSelect,
  onOpenSellerStore,
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
          "fixed inset-y-0 left-0 z-50 flex w-[190px] flex-col border-r border-border bg-background p-3 text-foreground transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[76px]",
        )}
        data-collapsed={collapsed ? "true" : "false"}
      >
        <div
          className={cn(
            "mb-5 flex items-start justify-between px-2 pt-1 transition-[justify-content] duration-300 ease-in-out",
            collapsed && "lg:justify-center",
          )}
        >
          <div className={cn("flex flex-col items-center gap-1", collapsed && "lg:gap-0")}>
            <img src="/favicon.png" alt="CMD Streaming" className="h-11 w-11 rounded-xl object-contain" />
            <span
              className={cn(
                "max-h-4 max-w-[4rem] overflow-hidden whitespace-nowrap text-[8px] font-black tracking-[0.42em] text-white/70 transition-[max-height,max-width,opacity] duration-200 ease-out",
                collapsed && "lg:max-h-0 lg:max-w-0 lg:opacity-0",
              )}
            >
              CMD
            </span>
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

        <section
          className={cn(
            "mb-4 max-h-48 origin-top rounded-lg border border-border bg-background p-3 transition-[max-height,margin,opacity,transform] duration-200 ease-out",
            collapsed && "pointer-events-none lg:mb-0 lg:max-h-0 lg:-translate-y-1 lg:overflow-hidden lg:border-transparent lg:p-0 lg:opacity-0",
          )}
        >
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

        <nav className={cn("min-h-0 flex-1 overflow-y-auto pr-1 text-[11px]", collapsed && "lg:pr-0")}>
          <div className="space-y-0.5">
            <SidebarButton collapsed={collapsed} icon={<Newspaper />} label="Noticias" onClick={() => onUnavailable("Noticias")} />
            <SidebarButton collapsed={collapsed} icon={<Trophy />} label="Ranking" onClick={() => onUnavailable("Ranking")} />
            <SidebarButton
              collapsed={collapsed}
              icon={<FolderTree />}
              label="Catálogo"
              expanded={catalogOpen}
              onClick={() => setCatalogOpen((value) => !value)}
            />
          </div>

          {catalogOpen && (
            <div
              className={cn(
                "my-1 ml-3 max-h-48 overflow-hidden border-l border-border pl-2 transition-[max-height,margin,opacity] duration-200 ease-out",
                collapsed && "pointer-events-none lg:my-0 lg:max-h-0 lg:border-transparent lg:opacity-0",
              )}
            >
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
              collapsed={collapsed}
              icon={<LayoutDashboard />}
              label="Dashboard"
              active={activePanel === "tienda" && activeCategory === "todo"}
              onClick={() => selectCategory("todo")}
            />
            <SidebarButton
              collapsed={collapsed}
              icon={<BriefcaseBusiness />}
              label="Mi Negocio"
              expanded={businessOpen}
              onClick={() => setBusinessOpen((value) => !value)}
            />
          </div>

          {businessOpen && (
            <div
              className={cn(
                "my-1 ml-3 max-h-40 overflow-hidden border-l border-border pl-2 transition-[max-height,margin,opacity] duration-200 ease-out",
                collapsed && "pointer-events-none lg:my-0 lg:max-h-0 lg:border-transparent lg:opacity-0",
              )}
            >
              <button
                type="button"
                onClick={() => {
                  if (!sessionActive) onOpenAuth();
                  else if (canManageStore) onOpenSellerStore();
                  else onUnavailable("Mi Tienda requiere una cuenta Vendedor");
                }}
                className={cn(
                  "flex min-h-7 w-full items-center gap-2 rounded-lg px-2 text-left text-[10px] font-semibold transition-colors",
                  "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
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

          <SidebarButton collapsed={collapsed} icon={<Download />} label="Descargar App" onClick={() => onUnavailable("La app")} />
        </nav>

        <div className={cn("mt-3 border-t border-border pt-3", collapsed && "lg:border-transparent")}>
          <div
            className={cn(
              "mb-3 inline-flex max-h-8 items-center gap-1 overflow-hidden rounded-lg border border-green-400/20 bg-green-400/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-green-300 transition-[max-height,margin,opacity] duration-200 ease-out",
              collapsed && "pointer-events-none lg:mb-0 lg:max-h-0 lg:border-transparent lg:px-0 lg:py-0 lg:opacity-0",
            )}
          >
            <Sparkles className="h-3 w-3" aria-hidden="true" /> Catálogo activo
          </div>
          <button
            type="button"
            onClick={() => (sessionActive ? selectPanel("perfil") : onOpenAuth())}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition hover:bg-white/[0.05]",
              collapsed && "lg:justify-center lg:gap-0 lg:px-0",
            )}
          >
            <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-red-accent text-[10px] font-black text-white">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials || "IN"
              )}
            </div>
            <span
              className={cn(
                "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                collapsed ? "lg:max-w-0 lg:opacity-0" : "max-w-[8rem] opacity-100",
              )}
            >
              <span className="block truncate text-[10px] font-bold text-white">{profileName}</span>
              <span className="block text-[9px] text-white/45">{sessionActive ? "Cliente" : "Inicia sesión"}</span>
            </span>
            <ChevronDown
              className={cn(
                "ml-auto h-3.5 w-3.5 -rotate-90 text-white/45 transition-[max-width,opacity] duration-200 ease-out",
                collapsed && "lg:ml-0 lg:max-w-0 lg:opacity-0",
              )}
              aria-hidden="true"
            />
          </button>
        </div>
      </aside>
    </>
  );
}

function SidebarButton({
  collapsed,
  icon,
  label,
  active = false,
  expanded,
  onClick,
}: {
  collapsed: boolean;
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
      title={collapsed ? label : undefined}
      className={cn(
        "flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[11px] font-semibold transition-[background-color,color,gap,padding] duration-200 ease-out",
        collapsed && "lg:justify-center lg:gap-0 lg:px-0",
        active ? "bg-primary/10 text-white" : "text-white/70 hover:bg-white/[0.045] hover:text-white",
      )}
    >
      <span className="shrink-0 text-white/65 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      <span
        className={cn(
          "max-w-[9rem] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
          collapsed && "lg:max-w-0 lg:opacity-0",
        )}
      >
        {label}
      </span>
      {expanded !== undefined && (
        <ChevronDown
          className={cn(
            "ml-auto h-3.5 w-3.5 transition-[max-width,opacity,transform] duration-200 ease-out",
            expanded && "rotate-180",
            collapsed && "lg:ml-0 lg:max-w-0 lg:opacity-0",
          )}
        />
      )}
    </button>
  );
}
