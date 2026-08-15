import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  ShoppingCart,
  Users,
  History,
  ArrowLeft,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsAdmin } from "@/hooks/useIsAdmin";

interface SupplierLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function SupplierLayout({ children, title, subtitle }: SupplierLayoutProps) {
  const location = useLocation();
  const { isSupplier, isAdmin } = useIsAdmin();

  const menuItems = [
    { label: "Dashboard", href: "/proveedor", icon: LayoutDashboard, accent: "text-amber-300" },
    {
      label: "Mi Inventario",
      href: "/proveedor/inventario",
      icon: Database,
      accent: "text-cyan-300",
    },
    { label: "Mis Ventas", href: "/proveedor/ventas", icon: History, accent: "text-emerald-300" },
    { label: "Perfil", href: "/proveedor/perfil", icon: Users, accent: "text-violet-300" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-ink/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col">
        <div className="p-6">
          <Link to="/tienda" className="flex items-center gap-2 mb-8 group">
            <ArrowLeft className="w-4 h-4 text-white/40 group-hover:text-primary transition-colors" />
            <span className="font-display text-xl text-white tracking-tighter">
              CMD <span className="text-primary">PROVEEDOR</span>
            </span>
          </Link>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive
                      ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20"
                      : "text-white/60 hover:text-white hover:bg-white/5",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-slate-950" : `${item.accent} group-hover:brightness-125`,
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
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">Panel Proveedor</p>
              <p className="text-xs text-white/40 truncate">
                {isAdmin ? "Admin Mode" : "Verified Partner"}
              </p>
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
