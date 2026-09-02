import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Un fallo transitorio recibe un único intento adicional; errores de
        // autenticación no se repiten en segundo plano ni generan bucles.
        retry: (failureCount, error) => {
          const message = error instanceof Error ? error.message : String(error ?? "");
          if (/unauthorized|invalid token|permission|forbidden/i.test(message)) return false;
          return failureCount < 1;
        },
        retryDelay: 900,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
