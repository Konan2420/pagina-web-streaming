import * as React from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";

type SupplierLayoutProps = { children: ReactNode; title: string; subtitle?: string };

const SupplierRouteShellContext = React.createContext(false);
const supplierNavigation = { storeHref: "/proveedor/mi-tienda" } as const;

function SupplierPageFrame({ children, title, subtitle }: SupplierLayoutProps) {
  return (
    <main className="min-w-0 p-4 sm:p-7 md:p-10">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Panel de proveedor
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-white/50">{subtitle}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}

/** Shell de proveedor sin área lateral: la navegación vive en AppTopbar. */
export function SupplierRouteShell() {
  const location = useLocation();
  const isStorefrontRoute = location.pathname === "/proveedor/mi-tienda";

  return (
    <SupplierRouteShellContext.Provider value>
      <div className="min-h-screen bg-background text-foreground">
        {!isStorefrontRoute && <AppTopbar businessNavigation={supplierNavigation} />}
        <Outlet />
      </div>
    </SupplierRouteShellContext.Provider>
  );
}

export function SupplierLayout(props: SupplierLayoutProps) {
  const insideRouteShell = React.useContext(SupplierRouteShellContext);
  if (insideRouteShell) return <SupplierPageFrame {...props} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppTopbar businessNavigation={supplierNavigation} />
      <SupplierPageFrame {...props} />
    </div>
  );
}
