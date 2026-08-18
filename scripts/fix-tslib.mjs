import { cp, readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const functionsRoot = resolve(projectRoot, ".vercel/output/functions");
const tslibSource = resolve(projectRoot, "node_modules/tslib");

async function findFunctionDirectories(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const functionDirectories = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const entryPath = resolve(directory, entry.name);
    if (entry.name.endsWith(".func")) {
      functionDirectories.push(entryPath);
      continue;
    }

    functionDirectories.push(...(await findFunctionDirectories(entryPath)));
  }

  return functionDirectories;
}

try {
  await stat(functionsRoot);
} catch {
  console.warn(
    `[fix-tslib] No se encontró ${functionsRoot}; se omite la copia de tslib.`,
  );
  process.exit(0);
}

try {
  await stat(tslibSource);
} catch {
  console.error(
    `[fix-tslib] No se encontró ${tslibSource}. Ejecuta npm install antes del build.`,
  );
  process.exit(1);
}

const functionDirectories = await findFunctionDirectories(functionsRoot);

if (functionDirectories.length === 0) {
  console.warn(
    `[fix-tslib] No se encontraron carpetas .func dentro de ${functionsRoot}; no hay nada que copiar.`,
  );
  process.exit(0);
}

for (const functionDirectory of functionDirectories) {
  const tslibDestination = resolve(functionDirectory, "node_modules/tslib");
  await cp(tslibSource, tslibDestination, { recursive: true, force: true });
  console.log(`[fix-tslib] Copiado tslib en: ${tslibDestination}`);
}

console.log(
  `[fix-tslib] Confirmado: tslib se copió en ${functionDirectories.length} función(es).`,
);
