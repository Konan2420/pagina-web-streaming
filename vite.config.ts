import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Configuración independiente de Lovable.
 * TanStack Start conserva SSR y Server Functions; Nitro genera el servidor
 * Node que se ejecuta con `npm run start` tras compilar.
 */
export default defineConfig({
  plugins: [
    tanstackStart({
      server: { entry: "server" },
    }),
    nitro({
      preset: "vercel",
      noExternals: true,
    }),
    react(),
    tailwindcss(),
  ],
  ssr: {
    noExternal: ["tslib", "@supabase/functions-js", "@supabase/supabase-js"],
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
    hmr: {
      protocol: "wss",
      clientPort: 443,
    },
  },
});
