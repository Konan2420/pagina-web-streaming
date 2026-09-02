import http from "node:http";
import net from "node:net";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const host = "0.0.0.0";
const port = 3001;
const viteEntrypoint = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));

function isServerHealthy() {
  return new Promise((resolve) => {
    const request = http.get({ port, path: "/tienda", timeout: 3_000 }, (response) => {
      response.resume();
      resolve(response.statusCode !== undefined && response.statusCode < 500);
    });

    request.on("error", () => resolve(false));
    request.on("timeout", () => {
      request.destroy();
      resolve(false);
    });
  });
}

function isPortAvailable() {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen({ host, port });
  });
}

if (await isServerHealthy()) {
  process.stdout.write("CMD Streaming ya está disponible en el puerto configurado.\n");
  process.exit(0);
}

if (!(await isPortAvailable())) {
  console.error(
    `El puerto ${port} está ocupado por un proceso que no responde como CMD Streaming. ` +
      "Libera ese puerto o cierra el proceso antes de ejecutar npm run dev.",
  );
  process.exit(1);
}

const vite = spawn(
  process.execPath,
  [viteEntrypoint, "dev", "--host", host, "--port", String(port), "--strictPort"],
  { stdio: "inherit" },
);

vite.on("error", (error) => {
  console.error("No se pudo iniciar Vite:", error.message);
  process.exit(1);
});

vite.on("exit", (code) => process.exit(code ?? 1));
