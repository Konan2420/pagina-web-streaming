import { defineConfig, type Plugin } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// A Dev Tunnel terminates TLS on port 443. Local Vite development must use
// its default ws:// connection to port 3001 instead of forcing wss://127.0.0.1.
const useDevTunnelHmr = process.env.VITE_DEV_TUNNEL === "true";
const tanstackClientStorageContextId =
  "\0cmd:tanstack-start-storage-context-client";

/**
 * TanStack Start's development barrel currently lets Vite prebundle its
 * server-only AsyncLocalStorage context for browser requests. The functions
 * that reference it are server branches and are removed by the Start compiler;
 * this client shim stops the unused module from throwing at evaluation time.
 */
function tanstackClientStorageContextShim(): Plugin {
  return {
    name: "cmd:tanstack-start-client-storage-context-shim",
    apply: "serve",
    enforce: "pre",
    resolveId(source, _importer, options) {
      if (
        (source === "@tanstack/start-storage-context" ||
          source === "@tanstack/start-storage-context/dist/esm/async-local-storage.js") &&
        options?.ssr !== true
      ) {
        return tanstackClientStorageContextId;
      }

      return null;
    },
    load(id) {
      if (id !== tanstackClientStorageContextId) return null;

      return [
        "export async function runWithStartContext(_context, callback) {",
        "  return callback();",
        "}",
        "export function getStartContext() {",
        '  throw new Error("Start server context is unavailable in the browser.");',
        "}",
      ].join("\n");
    },
  };
}

/**
 * Configuración independiente de Lovable.
 * TanStack Start conserva SSR y Server Functions; Nitro genera el servidor
 * Node que se ejecuta con `npm run start` tras compilar.
 */
export default defineConfig({
  plugins: [
    tanstackClientStorageContextShim(),
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({
      preset: "vercel",
      noExternals: true,
      runtimeConfig: {
        // Vercel expone estos valores a Nitro mediante NITRO_SUPABASE_*.
        // Se mantienen fuera del bundle del navegador.
        supabaseUrl: "",
        supabasePublishableKey: "",
        supabaseServiceRoleKey: "",
      },
    }),
    react(),
    tailwindcss(),
  ],
  ssr: {
    noExternal: ["tslib", "@supabase/functions-js", "@supabase/supabase-js"],
  },
  // Nunca preempaquetar este módulo de contexto de servidor para el navegador.
  // Si Vite lo optimiza, termina exponiendo `node:async_hooks` al cliente y React
  // falla antes de montar la página, dejando el catálogo en skeleton permanente.
  optimizeDeps: {
    exclude: ["@tanstack/start-storage-context"],
  },
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: "0.0.0.0",
    port: 3001,
    strictPort: true,
    // Dev Tunnels forwards the public hostname and connects to this local server.
    // Explicitly accepting its suffix prevents host validation from breaking the client runtime.
    allowedHosts: [".devtunnels.ms"],
    hmr: useDevTunnelHmr
      ? {
          protocol: "wss",
          clientPort: 443,
        }
      : undefined,
    watch: {
      ignored: ["**/.output/**", "**/.tanstack/**", "**/.vercel/**"],
    },
  },
});
