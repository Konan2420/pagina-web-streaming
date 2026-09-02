import * as React from "react";
import type { ReactNode } from "react";
import { Outlet, useLocation } from "@tanstack/react-router";
import { AppTopbar } from "@/components/layout/AppTopbar";

type DistributorLayoutProps = { children: ReactNode; title: string; subtitle?: string };

const DistributorRouteShellContext = React.createContext(false);
const distributorNavigation = { storeHref: "/distribuidor/mi-tienda" } as const;

function DistributorPageFrame({ children, title, subtitle }: DistributorLayoutProps) {
  return (
    <main className="min-w-0 p-4 sm:p-7 md:p-10">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="mb-7">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
            Panel de distribuidor
          </p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-white/50">{subtitle}</p>}
        </header>
        {children}
      </div>
    </main>
  );
}

/** Shell de distribuidor sin área lateral: la navegación vive en AppTopbar. */
export function DistributorRouteShell() {
  const location = useLocation();
  const isStorefrontRoute = location.pathname === "/distribuidor/mi-tienda";

  return (
    <DistributorRouteShellContext.Provider value>
      <div className="min-h-screen bg-background text-foreground">
        {!isStorefrontRoute && <AppTopbar businessNavigation={distributorNavigation} />}
        <Outlet />
      </div>
    </DistributorRouteShellContext.Provider>
  );
}

export function DistributorLayout(props: DistributorLayoutProps) {
  const insideRouteShell = React.useContext(DistributorRouteShellContext);
  if (insideRouteShell) return <DistributorPageFrame {...props} />;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppTopbar businessNavigation={distributorNavigation} />
      <DistributorPageFrame {...props} />
    </div>
  );
}
