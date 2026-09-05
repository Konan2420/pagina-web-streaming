import { useState, type ReactNode } from "react";
import {
  BadgeCheck,
  BookOpen,
  Bot,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderTree,
  GraduationCap,
  Inbox,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Phone,
  Plus,
  Settings,
  Share2,
  ShoppingBag,
  Store,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { categories, type PanelTab } from "./data";
import { cn } from "@/lib/utils";

type StoreSidebarProps = {
  open: boolean;
  collapsed: boolean;
  sessionActive: boolean;
  walletBalance: number;
  isAdmin: boolean;
  isProvider: boolean;
  isDistributor: boolean;
  catalogOnly?: boolean;
  accountRoleLabel: string;
  displayName: string;
  initials: string;
  avatarUrl?: string | null;
  activePanel: PanelTab;
  activeCategory: string;
  onClose: () => void;
  onCategorySelect: (categoryId: string) => void;
  onPanelSelect: (panel: PanelTab) => void;
  onOpenAdmin: () => void;
  onOpenStorefront: () => void;
  onOpenWallet: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onUnavailable: (feature: string) => void;
};

const catalogQuickLinks = ["todo", "redes", "recargas", "giftcards", "videojuegos"];
const socialNetworksCategory = {
  id: "redes",
  label: "Redes Sociales",
  accent: "#38bdf8",
};

/** Barra lateral del catálogo con navegación comercial y accesos de cuenta. */
export function StoreSidebar({
  open,
  collapsed,
  sessionActive,
  walletBalance,
  isAdmin,
  isProvider,
  isDistributor,
  catalogOnly = false,
  accountRoleLabel,
  displayName,
  initials,
  avatarUrl,
  activePanel,
  activeCategory,
  onClose,
  onCategorySelect,
  onPanelSelect,
  onOpenAdmin,
  onOpenStorefront,
  onOpenWallet,
  onOpenAuth,
  onSignOut,
  onUnavailable,
}: StoreSidebarProps) {
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [businessOpen, setBusinessOpen] = useState(true);
  const [academyOpen, setAcademyOpen] = useState(false);
  const profileName = sessionActive ? displayName : "Invitado";
  const canManageStorefront = sessionActive && (isAdmin || isProvider || isDistributor);
  const selectPanel = (panel: PanelTab) => {
    onPanelSelect(panel);
    onClose();
  };

  const selectProtectedPanel = (panel: PanelTab) => {
    if (!sessionActive) {
      onOpenAuth();
      return;
    }
    selectPanel(panel);
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
          "fixed inset-y-0 left-0 z-50 flex w-[var(--store-sidebar-mobile-width)] flex-col border-r border-border bg-card p-3 text-foreground transition-[transform,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:w-[var(--store-sidebar-width)] lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          collapsed && "lg:w-[var(--store-sidebar-collapsed-width)]",
        )}
        data-collapsed={collapsed ? "true" : "false"}
      >
        <div className="relative mb-5 flex justify-center px-2 pt-1">
          <Link
            to="/"
            onClick={onClose}
            title="Volver al inicio"
            aria-label="Volver al inicio de CMD Streaming"
            className="rounded-2xl transition-transform duration-200 hover:scale-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <img
              src="/cmd-logo.png"
              alt="CMD Streaming"
              className="h-14 w-14 rounded-2xl object-contain drop-shadow-[0_6px_12px_rgba(59,130,246,0.2)] sm:h-16 sm:w-16"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="absolute right-2 top-1 grid h-11 w-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            aria-label="Cerrar menú lateral"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <section
          className={cn(
            "mb-4 max-h-48 origin-top rounded-lg border border-border bg-background p-3 transition-[max-height,margin,opacity,transform] duration-200 ease-out",
            collapsed &&
              "pointer-events-none lg:mb-0 lg:max-h-0 lg:-translate-y-1 lg:overflow-hidden lg:border-transparent lg:p-0 lg:opacity-0",
          )}
        >
          <div className="flex items-center gap-2 text-[10px] font-semibold text-white/70">
            <Wallet className="h-3.5 w-3.5 text-red-accent" aria-hidden="true" />
            Mi Billetera
          </div>
          <p className="mt-2 text-lg font-black tracking-tight text-white">
            {sessionActive ? `S/ ${walletBalance.toFixed(2)}` : "S/ —"}
          </p>
          <p className="text-[9px] text-white/40">
            {sessionActive ? "Saldo disponible" : "Saldo disponible al iniciar sesión"}
          </p>
          <button
            type="button"
            onClick={onOpenWallet}
            className="cmd-on-accent mt-3 flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-red-accent text-[10px] font-black transition hover:brightness-110 sm:h-8"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Recargar saldo
          </button>
        </section>

        <nav
          aria-label="Navegación principal"
          className={cn(
            "cmd-sidebar-scroll min-h-0 flex-1 overflow-y-auto pr-1.5 text-sm",
            collapsed && "lg:pr-0",
          )}
        >
          <div className="space-y-0.5">
            <SidebarButton
              collapsed={collapsed}
              icon={<FolderTree />}
              label="Catálogo"
              expanded={catalogOpen}
              onClick={() => setCatalogOpen((value) => !value)}
            />
            <SidebarSubmenu open={catalogOpen} collapsed={collapsed}>
              {catalogQuickLinks.map((categoryId) => {
                const category =
                  categories.find((item) => item.id === categoryId) ??
                  (categoryId === "redes" ? socialNetworksCategory : null);
                if (!category) return null;
                const active = activePanel === "tienda" && activeCategory === categoryId;

                if (category.id === "todo") {
                  return (
                    <a
                      key={category.id}
                      href={catalogOnly ? "/catalogo" : "/tienda"}
                      onClick={onClose}
                      className={cn(
                        "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-[13px] font-semibold transition-colors sm:min-h-9",
                        active
                          ? "cmd-active-subtle"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {category.label}
                    </a>
                  );
                }

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => selectCategory(category.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center rounded-lg px-3 text-left text-[13px] font-semibold transition-colors sm:min-h-9",
                      active
                        ? "cmd-active-subtle"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {category.id === "redes" && (
                      <Share2 className="mr-2 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    )}
                    {category.label}
                  </button>
                );
              })}
            </SidebarSubmenu>

            <SidebarButton
              collapsed={collapsed}
              icon={<LayoutDashboard />}
              label="Dashboard"
              onClick={() => selectCategory("todo")}
            />
          </div>

          {!catalogOnly && (
            <>
              <div className="my-2 border-t border-border/80" />

              <div className="space-y-0.5">
                <SidebarButton
                  collapsed={collapsed}
                  icon={<Briefcase />}
                  label="Mi Negocio"
                  expanded={businessOpen}
                  onClick={() => setBusinessOpen((value) => !value)}
                />
                <SidebarSubmenu open={businessOpen} collapsed={collapsed}>
                  {canManageStorefront && (
                    <SidebarSubItem
                      icon={<Store />}
                      label="Mi Tienda"
                      active={activePanel === "mi-tienda"}
                      onClick={onOpenStorefront}
                    />
                  )}
                  {canManageStorefront ? (
                    <SidebarSubItem
                      icon={<ShoppingBag />}
                      label="Mis Pedidos"
                      active={activePanel === "pedidos"}
                      onClick={() => selectPanel("pedidos")}
                    />
                  ) : (
                    <SidebarSubItem
                      icon={<ShoppingBag />}
                      label="Mis Compras"
                      active={activePanel === "compras"}
                      onClick={() => selectProtectedPanel("compras")}
                    />
                  )}
                  {canManageStorefront && (
                    <SidebarSubItem
                      icon={<Users />}
                      label="Clientes"
                      active={activePanel === "clientes"}
                      onClick={() => selectPanel("clientes")}
                    />
                  )}
                  <SidebarSubItem icon={<Bot />} label="Bot de Códigos" disabled badge="Próx" />
                  <SidebarSubItem
                    icon={<Inbox />}
                    label="Buzón"
                    active={activePanel === "buzon"}
                    onClick={() => selectProtectedPanel("buzon")}
                  />
                </SidebarSubmenu>

                <SidebarButton
                  collapsed={collapsed}
                  icon={<Phone />}
                  label="Soporte"
                  active={activePanel === "soporte"}
                  onClick={() => selectPanel("soporte")}
                />

                <SidebarButton
                  collapsed={collapsed}
                  icon={<GraduationCap />}
                  label="Academia"
                  expanded={academyOpen}
                  onClick={() => setAcademyOpen((value) => !value)}
                />
                <SidebarSubmenu open={academyOpen} collapsed={collapsed}>
                  <SidebarSubItem
                    icon={<Megaphone />}
                    label="Publicidad"
                    active={activePanel === "publicidad"}
                    onClick={() => selectPanel("publicidad")}
                  />
                  <SidebarSubItem
                    icon={<BookOpen />}
                    label="Cursos"
                    active={activePanel === "cursos"}
                    onClick={() => selectPanel("cursos")}
                  />
                  <SidebarSubItem
                    icon={<Video />}
                    label="Meets"
                    active={activePanel === "meets"}
                    onClick={() => selectPanel("meets")}
                  />
                </SidebarSubmenu>

                <a
                  href="/politicas"
                  onClick={onClose}
                  title={collapsed ? "Políticas" : undefined}
                  className={cn(
                    "flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold text-muted-foreground transition-[background-color,color,gap,padding] duration-200 ease-out hover:bg-muted hover:text-foreground",
                    collapsed && "lg:justify-center lg:gap-0 lg:px-0",
                  )}
                >
                  <span className="shrink-0 text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">
                    <FileText />
                  </span>
                  <span
                    className={cn(
                      "max-w-[15rem] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                      collapsed && "lg:max-w-0 lg:opacity-0",
                    )}
                  >
                    Políticas
                  </span>
                </a>
                <SidebarButton
                  collapsed={collapsed}
                  icon={<Settings />}
                  label="Configuración"
                  active={activePanel === "perfil"}
                  onClick={() => selectProtectedPanel("perfil")}
                />
              </div>
            </>
          )}
        </nav>

        <div
          className={cn("mt-3 border-t border-border pt-3", collapsed && "lg:border-transparent")}
        >
          {!catalogOnly && (
            <button
              type="button"
              onClick={() => onUnavailable("Vendedor PRO")}
              title={collapsed ? "Vendedor PRO" : undefined}
              className={cn(
                "cmd-active-subtle mb-2 flex min-h-11 w-full items-center gap-2.5 rounded-lg border px-3 text-left text-xs font-black transition hover:border-primary/60 hover:bg-primary/15",
                collapsed && "lg:justify-center lg:gap-0 lg:px-0",
              )}
            >
              <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-primary" aria-hidden="true" />
              <span
                className={cn(
                  "max-w-[15rem] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                  collapsed && "lg:max-w-0 lg:opacity-0",
                )}
              >
                Vendedor PRO
              </span>
            </button>
          )}

          {sessionActive && (
            <button
              type="button"
              onClick={onSignOut}
              title={collapsed ? "Cerrar sesión" : undefined}
              className={cn(
                "mb-2 flex min-h-11 w-full items-center gap-2.5 rounded-lg border border-destructive/30 px-3 text-left text-xs font-bold text-destructive transition hover:border-destructive hover:bg-destructive/10 sm:min-h-10",
                collapsed && "lg:justify-center lg:gap-0 lg:px-0",
              )}
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span
                className={cn(
                  "max-w-[15rem] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                  collapsed && "lg:max-w-0 lg:opacity-0",
                )}
              >
                Cerrar sesión
              </span>
            </button>
          )}

          {!catalogOnly && (
            <button
              type="button"
              onClick={() => {
                if (!sessionActive) onOpenAuth();
                else if (isAdmin) onOpenAdmin();
                else selectPanel("perfil");
              }}
              className={cn(
                "flex min-h-11 w-full items-center gap-2 rounded-lg border border-transparent p-1.5 text-left transition hover:border-border hover:bg-muted/60",
                collapsed && "lg:justify-center lg:gap-0 lg:px-0",
              )}
            >
              <div className="cmd-on-accent grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-red-accent text-[10px] font-black">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials || "IN"
                )}
              </div>
              <span
                className={cn(
                  "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                  collapsed ? "lg:max-w-0 lg:opacity-0" : "max-w-[13rem] opacity-100",
                )}
              >
                <span className="block truncate text-[10px] font-bold text-foreground">
                  {profileName}
                </span>
                <span className="block text-[9px] text-muted-foreground">
                  {sessionActive ? accountRoleLabel : "Inicia sesión"}
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "ml-auto h-3.5 w-3.5 text-muted-foreground transition-[max-width,opacity] duration-200 ease-out",
                  collapsed && "lg:ml-0 lg:max-w-0 lg:opacity-0",
                )}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function SidebarSubmenu({
  children,
  open,
  collapsed,
}: {
  children: ReactNode;
  open: boolean;
  collapsed: boolean;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-200 ease-out",
        open ? "my-1 grid-rows-[1fr] opacity-100" : "my-0 grid-rows-[0fr] opacity-0",
        collapsed && "pointer-events-none lg:hidden",
      )}
      aria-hidden={!open}
    >
      <div className="overflow-hidden">
        <div className="ml-4 border-l border-border pl-3">{children}</div>
      </div>
    </div>
  );
}

function SidebarSubItem({
  icon,
  label,
  active = false,
  disabled = false,
  badge,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  const className = cn(
    "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] font-semibold transition-colors sm:min-h-9",
    disabled
      ? "cursor-not-allowed text-white/30"
      : active
        ? "cmd-active-subtle"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

  const content = (
    <>
      <span className="shrink-0 text-current [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span>{label}</span>
      {badge && (
        <span className="ml-auto rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide text-muted-foreground">
          {badge}
        </span>
      )}
    </>
  );

  if (disabled) {
    return (
      <div aria-disabled="true" title="Próximamente" className={className}>
        {content}
      </div>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
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
      aria-expanded={expanded}
      className={cn(
        "flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 text-left text-sm font-semibold transition-[background-color,color,gap,padding] duration-200 ease-out sm:min-h-10",
        collapsed && "lg:justify-center lg:gap-0 lg:px-0",
        active
          ? "cmd-active-subtle"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <span className="shrink-0 text-current [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span
        className={cn(
          "max-w-[15rem] overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
          collapsed && "lg:max-w-0 lg:opacity-0",
        )}
      >
        {label}
      </span>
      {expanded !== undefined && (
        <ChevronDown
          className={cn(
            "ml-auto h-4 w-4 transition-[max-width,opacity,transform] duration-200 ease-out",
            expanded && "rotate-180",
            collapsed && "lg:ml-0 lg:max-w-0 lg:opacity-0",
          )}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
