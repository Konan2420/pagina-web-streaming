import * as React from "react";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import {
  ArrowLeft,
  BarChart3,
  Banknote,
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
} from "lucide-react";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AdminRouteShellContext = React.createContext(false);

const menuItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, role: "any", accent: "text-red-300" },
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
  { label: "Analítica", href: "/admin/analytics", icon: BarChart3, role: "any", accent: "text-teal-300" },
] as const;

function AdminSidebar({ collapsed }: { collapsed: boolean }) {
  const location = useLocation();
  const { isAdmin } = useIsAdmin();
  const items = menuItems.filter((item) => item.role === "any" || isAdmin);

  return (
    <aside className={cn("shrink-0 border-b border-white/5 bg-ink/50 transition-[width] duration-300 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:border-b-0 md:border-r", collapsed ? "md:w-20" : "md:w-64")}>
      <div className={cn("p-4 md:p-6", collapsed && "md:px-3")}>
        <Link to="/" className="mb-8 flex items-center gap-2 group" title="Volver a la tienda">
          <ArrowLeft className="h-4 w-4 shrink-0 text-white/40 transition-colors group-hover:text-primary" />
          <span className={cn("font-display text-xl tracking-tighter text-white", collapsed && "md:sr-only")}>CMD <span className="text-primary">ADMIN</span></span>
        </Link>
        <nav className="grid grid-cols-2 gap-2 md:block md:space-y-1" aria-label="Panel administrativo">
          {items.map((item) => {
            const active = location.pathname === item.href;
            const Icon = item.icon;
            return <Link key={item.href} to={item.href} title={item.label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200", active ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:bg-white/5 hover:text-white", collapsed && "md:justify-center md:px-2")}><Icon className={cn("h-5 w-5 shrink-0", active ? "text-white" : item.accent)} /><span className={collapsed ? "md:sr-only" : "truncate"}>{item.label}</span></Link>;
          })}
        </nav>
      </div>
      <div className={cn("mt-auto border-t border-white/5 p-4 md:p-6", collapsed && "md:px-3")}>
        <div className={cn("flex items-center gap-3", collapsed && "md:justify-center")}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-primary/30 bg-primary/20"><Users className="h-5 w-5 text-primary" /></div>
          <div className={collapsed ? "md:sr-only" : "overflow-hidden"}><p className="truncate text-sm font-semibold text-white">Admin Panel</p><p className="truncate text-xs text-white/40">CMD Streaming</p></div>
        </div>
      </div>
    </aside>
  );
}

function AdminPageFrame({ children, title, subtitle }: AdminLayoutProps) {
  return <main className="min-w-0 flex-1 overflow-y-auto p-4 md:p-8"><div className="mx-auto max-w-6xl"><header className="mb-8"><h1 className="font-display text-3xl uppercase tracking-tight text-white sm:text-4xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-white/50">{subtitle}</p>}</header>{children}</div></main>;
}

/** Layout de ruta: se monta una sola vez para todas las rutas /admin/* y contiene el Outlet. */
export function AdminRouteShell() {
  const [collapsed, setCollapsed] = React.useState(false);
  return <AdminRouteShellContext.Provider value><div className="min-h-screen bg-background text-foreground md:flex"><AdminSidebar collapsed={collapsed} /><div className="flex min-w-0 flex-1 flex-col"><AppTopbar onToggleSidebar={() => setCollapsed((value) => !value)} /><Outlet /></div></div></AdminRouteShellContext.Provider>;
}

/** Marco de contenido retrocompatible: dentro de AdminRouteShell ya no duplica chrome. */
export function AdminLayout(props: AdminLayoutProps) {
  const insideRouteShell = React.useContext(AdminRouteShellContext);
  if (insideRouteShell) return <AdminPageFrame {...props} />;
  return <div className="min-h-screen bg-background text-foreground md:flex"><AdminSidebar collapsed={false} /><div className="flex min-w-0 flex-1 flex-col"><AppTopbar /><AdminPageFrame {...props} /></div></div>;
}
