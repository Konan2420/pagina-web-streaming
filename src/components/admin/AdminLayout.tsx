import * as React from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Banknote,
  Ban,
  CalendarClock,
  Database,
  History,
  LayoutDashboard,
  Phone,
  Share2,
  ShoppingCart,
  Store,
  Ticket,
  Tv,
  Users,
  WalletCards,
  X,
} from "lucide-react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { cn } from "@/lib/utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminRouteShellContext = React.createContext(false);

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, role: "any", accent: "text-primary" },
  { label: "Productos", href: "/admin/productos", icon: ShoppingCart, role: "any", accent: "text-amber-300" },
  { label: "Íconos y plataformas", href: "/admin/servicios", icon: Tv, role: "any", accent: "text-cyan-300" },
  { label: "Inventario", href: "/admin/inventario", icon: Database, role: "any", accent: "text-violet-300" },
  { label: "Stock Cuentas", href: "/admin/stock", icon: Database, role: "any", accent: "text-indigo-300" },
  { label: "Ventas", href: "/admin/ventas", icon: History, role: "any", accent: "text-emerald-300" },
  { label: "Pedidos y Entregas", href: "/admin/pedidos", icon: ShoppingCart, role: "any", accent: "text-orange-300" },
  { label: "Pedidos WA", href: "/admin/pedidos-manuales", icon: Phone, role: "any", accent: "text-green-300" },
  { label: "Vencimientos", href: "/admin/vencimientos", icon: CalendarClock, role: "any", accent: "text-amber-300" },
  { label: "Tickets", href: "/admin/tickets", icon: Ticket, role: "any", accent: "text-amber-300" },
  { label: "Recargas", href: "/admin/recargas", icon: WalletCards, role: "any", accent: "text-emerald-300" },
  { label: "Redes Sociales", href: "/redes-sociales", icon: Share2, role: "any", accent: "text-pink-300" },
  { label: "Mi Tienda", href: "/admin/mi-tienda", icon: Store, role: "any", accent: "text-violet-300" },
  { label: "Payouts", href: "/admin/payouts", icon: Banknote, role: "admin", accent: "text-yellow-300" },
  { label: "Usuarios", href: "/admin/usuarios", icon: Users, role: "admin", accent: "text-sky-300" },
  { label: "Moderación", href: "/admin/moderacion", icon: Ban, role: "admin", accent: "text-destructive" },
  { label: "Analítica", href: "/admin/analytics", icon: BarChart3, role: "any", accent: "text-teal-300" },
] as const;

function AdminSidebar({
  collapsed,
  mobileOpen,
  onClose,
}: {
  collapsed: boolean;
  mobileOpen: boolean;
  onClose: () => void;
}) {
  const location = useLocation();
  // Este componente solo se monta tras la protección de /admin, cuyo beforeLoad
  // confirma el rol admin en el servidor. No dependemos de un hook cliente que
  // puede estar todavía cargando y ocultar enlaces administrativos por error.
  const items = menuItems;

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar menú administrativo"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(84vw,20rem)] flex-col overflow-y-auto border-r border-white/5 bg-ink/95 shadow-2xl transition-[transform,width] duration-300 md:sticky md:top-0 md:h-screen md:w-64 md:translate-x-0 md:bg-ink/50 md:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          collapsed && "md:w-20",
        )}
      >
        <div className={cn("p-4 md:p-6", collapsed && "md:px-3")}>
          <div className="mb-5 flex items-center justify-between gap-3 md:mb-8">
            <Link to="/" onClick={onClose} className="group flex min-w-0 items-center gap-2" title="Volver a la tienda">
              <ArrowLeft className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-primary" />
              <span className={cn("truncate font-display text-xl tracking-tighter text-white", collapsed && "md:sr-only")}>CMD <span className="text-primary">ADMIN</span></span>
            </Link>
            <button type="button" onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-white/65 transition hover:bg-white/5 hover:text-white md:hidden" aria-label="Cerrar menú administrativo">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="space-y-1" aria-label="Panel administrativo">
            {items.map((item) => {
              const active = location.pathname === item.href;
              const Icon = item.icon;
              return <Link key={item.href} to={item.href} onClick={onClose} title={item.label} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 md:min-h-0", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:bg-white/5 hover:text-white", collapsed && "md:justify-center md:px-2")}><Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : item.accent)} /><span className={collapsed ? "md:sr-only" : "truncate"}>{item.label}</span></Link>;
            })}
          </nav>
        </div>
        <div className={cn("mt-auto border-t border-white/5 p-4 md:p-6", collapsed && "md:px-3")}>
          <div className={cn("flex items-center gap-3", collapsed && "md:justify-center")}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/20"><Users className="h-5 w-5 text-primary" /></div>
            <div className={collapsed ? "md:sr-only" : "overflow-hidden"}><p className="truncate text-sm font-semibold text-white">Admin Panel</p><p className="truncate text-xs text-white/40">CMD Streaming</p></div>
          </div>
        </div>
      </aside>
    </>
  );
}

function AdminPageFrame({ children, title, subtitle }: AdminLayoutProps) {
  return <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8"><h1 className="font-display text-3xl uppercase tracking-tight text-white sm:text-4xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}</header>{children}</div></main>;
}

/** Layout de ruta: se monta una sola vez para todas las rutas /admin/* y contiene el Outlet. */
export function AdminRouteShell() {
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggleNavigation = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen((value) => !value);
      return;
    }
    setCollapsed((value) => !value);
  };

  return <AdminRouteShellContext.Provider value><div className="min-h-screen bg-background text-foreground md:flex"><AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="flex min-w-0 flex-1 flex-col"><AppTopbar onToggleSidebar={toggleNavigation} /><Outlet /></div></div></AdminRouteShellContext.Provider>;
}

/** Marco de contenido retrocompatible: dentro de AdminRouteShell ya no duplica chrome. */
export function AdminLayout(props: AdminLayoutProps) {
  const insideRouteShell = React.useContext(AdminRouteShellContext);
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const toggleNavigation = () => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      setMobileOpen((value) => !value);
      return;
    }
    setCollapsed((value) => !value);
  };
  if (insideRouteShell) return <AdminPageFrame {...props} />;
  return <div className="min-h-screen bg-background text-foreground md:flex"><AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} /><div className="flex min-w-0 flex-1 flex-col"><AppTopbar onToggleSidebar={toggleNavigation} /><AdminPageFrame {...props} /></div></div>;
}
