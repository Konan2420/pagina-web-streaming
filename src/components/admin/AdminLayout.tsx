import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  BarChart3,
  History,
  Settings,
  ArrowLeft,
  Tv,
  Users,
  ShoppingCart,
  Banknote,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const location = useLocation();
  const { isAdmin, isEditor, isSupplier } = useIsAdmin();

  const menuItems = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: LayoutDashboard,
      role: "any",
      accent: "text-red-300",
    },
    {
      label: "Productos",
      href: "/admin/productos",
      icon: ShoppingCart,
      role: "any",
      accent: "text-amber-300",
    },
    {
      label: "Servicios",
      href: "/admin/servicios",
      icon: Tv,
      role: "any",
      accent: "text-cyan-300",
    },
    {
      label: "Inventario Auto",
      href: "/admin/inventario",
      icon: Database,
      role: "any",
      accent: "text-violet-300",
    },
    {
      label: "Stock Cuentas",
      href: "/admin/stock",
      icon: Database,
      role: "any",
      accent: "text-indigo-300",
    },
    {
      label: "Ventas Auto",
      href: "/admin/ventas",
      icon: History,
      role: "any",
      accent: "text-emerald-300",
    },
    {
      label: "Pedidos y Entregas",
      href: "/admin/pedidos",
      icon: ShoppingCart,
      role: "any",
      accent: "text-orange-300",
    },
    {
      label: "Pedidos WA",
      href: "/admin/pedidos-manuales",
      icon: Phone,
      role: "any",
      accent: "text-green-300",
    },
    {
      label: "Payouts",
      href: "/admin/payouts",
      icon: Banknote,
      role: "admin",
      accent: "text-yellow-300",
    },
    {
      label: "Usuarios",
      href: "/admin/usuarios",
      icon: Users,
      role: "admin",
      accent: "text-sky-300",
    },
    {
      label: "Proveedores",
      href: "/admin/proveedores",
      icon: Users,
      role: "admin",
      accent: "text-pink-300",
    },
    {
      label: "Analítica",
      href: "/admin/analytics",
      icon: BarChart3,
      role: "any",
      accent: "text-teal-300",
    },
  ];

  const filteredItems = menuItems.filter((item) => {
    if (item.role === "any") return true;
    if (item.role === "admin") return isAdmin;
    if (item.role === "proveedor") return isSupplier;
    return false;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-ink/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8 group">
            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
            <span className="font-display text-xl text-white tracking-tighter">
              CMD <span className="text-primary">ADMIN</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {filteredItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-white" : `${item.accent} group-hover:brightness-125`,
                    )}
                  />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 grid place-items-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Admin Panel</p>
              <p className="text-xs text-white/40 truncate">v1.2.0</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="font-display text-3xl sm:text-4xl text-white uppercase tracking-tight">
              {title}
            </h1>
            {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
          </header>
          {children}
        </div>
      </main>
    </div>
  );
}
