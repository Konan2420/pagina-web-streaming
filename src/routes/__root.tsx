import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode, useEffect } from "react";

import appCss from "../styles.css?url";
import { usePageView } from "@/hooks/useAnalytics";
import { ConsentBanner } from "@/components/ConsentBanner";
import { GlobalLoadingBar } from "@/components/ui/loading-states";
import { configurePublicSupabase, type PublicSupabaseConfig } from "@/integrations/supabase/client";
import { AppChromeProvider } from "@/components/layout/AppChromeProvider";

/**
 * The browser needs only these two public values for Supabase Auth and RLS.
 * They are resolved at request time from Nitro, avoiding a fragile VITE_ build
 * dependency. Service-role credentials remain server-only.
 */
async function loadPublicSupabaseConfig(): Promise<PublicSupabaseConfig | null> {
  // En local las variables VITE_* están disponibles tanto para SSR como para
  // el navegador. No se debe usar una Server Function en el loader raíz: en
  // Vercel Dev ese salto deja un stream SSR abierto y retrasa la hidratación.
  const bundledUrl = import.meta.env.VITE_SUPABASE_URL;
  const bundledPublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  let config: PublicSupabaseConfig | null =
    bundledUrl && bundledPublishableKey
      ? { url: bundledUrl, publishableKey: bundledPublishableKey }
      : null;

  // En producción se conserva el soporte de configuración de Nitro sin
  // exponer secretos al cliente. Evitamos importar `nitro/runtime-config` en
  // este módulo compartido: Vite lo llegaba a incluir en el grafo del navegador
  // y demoraba/corrompía la hidratación durante el arranque local.
  if (!config && typeof window === "undefined") {
    const serverEnv = (globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }).process?.env;
    const url = serverEnv?.NITRO_SUPABASE_URL || serverEnv?.SUPABASE_URL;
    const publishableKey =
      serverEnv?.NITRO_SUPABASE_PUBLISHABLE_KEY || serverEnv?.SUPABASE_PUBLISHABLE_KEY;

    if (url && publishableKey) config = { url, publishableKey };
  }

  // Child route guards can run before RootComponent renders on client-side
  // navigation. Configure the public client here so those guards never race
  // the root component for Supabase initialization.
  if (typeof window !== "undefined" && config) {
    configurePublicSupabase(config);
  }

  return config;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    if (import.meta.env.DEV) {
      const errorWithDigest = error as Error & { digest?: string };
      console.error(
        "ERROR CAPTURADO:",
        errorWithDigest,
        errorWithDigest.stack,
        errorWithDigest.digest,
      );
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: loadPublicSupabaseConfig,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0A0E1A" },
      { name: "author", content: "CMD Streaming" },
      { property: "og:site_name", content: "CMD Streaming" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/cmd-favicon-blue.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const restoreColorMode = `try { var mode = localStorage.getItem("cmd-color-mode"); if (mode === "light" || mode === "dark") { document.documentElement.dataset.cmdTheme = mode; document.documentElement.style.colorScheme = mode; } } catch (_) {}`;

  return (
    <html lang="es">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: restoreColorMode }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const supabaseConfig = Route.useLoaderData();

  if (supabaseConfig) configurePublicSupabase(supabaseConfig);
  usePageView();

  return (
    <QueryClientProvider client={queryClient}>
      <AppChromeProvider>
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <GlobalLoadingBar />
        <Outlet />
        <ConsentBanner />
      </AppChromeProvider>
    </QueryClientProvider>
  );
}
