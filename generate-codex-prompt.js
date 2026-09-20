#!/usr/bin/env node
const BASE_URL = process.env.AGENTROUTER_BASE || "https://agentrouter.org/v1";
const MODEL = process.env.AGENTROUTER_MODEL || "claude-opus-5";
const API_KEY = process.env.AGENTROUTER_API_KEY;

const SYSTEM_PROMPT = `Eres un generador de prompts para el agente Codex de GitHub Copilot,
trabajando sobre el proyecto CMD Streaming (TanStack Start/Router, React, Vite,
Supabase con RLS y Google OAuth, desplegado en Vercel).

A partir del objetivo en lenguaje natural que te da el usuario, genera un prompt
completo para Codex que SIEMPRE incluya, en este orden:

1. Descubrimiento de archivos previo a la implementacion: pasos explicitos
   para que Codex primero localice y liste los archivos/componentes relevantes
   antes de tocar nada.
2. Puntos de confirmacion explicitos: antes de cualquier cambio destructivo
   o sensible en seguridad (borrado de datos, cambios en politicas RLS,
   cambios de roles/permisos, migraciones), el prompt debe indicarle a Codex
   que se detenga y pida confirmacion explicita.
3. Decisiones arquitectonicas ambiguas: si el objetivo deja abierta alguna
   decision, el prompt debe instruir a Codex a presentar opciones y pedir
   confirmacion de Jose en vez de asumir por su cuenta.
4. Resumen de salida estructurado: archivos tocados, decisiones tomadas,
   pendientes, proximos pasos.

Responde UNICAMENTE con el prompt final para Codex, en espanol, listo para
copiar y pegar. Sin explicaciones adicionales, sin markdown de bloque de
codigo envolvente, sin preambulo.`;

async function generatePrompt(goal) {
  if (!API_KEY) {
    throw new Error("Falta AGENTROUTER_API_KEY. Expórtala antes de correr el script.");
  }

  const response = await fetch(`${BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: goal }],
    }),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Respuesta no valida (status ${response.status}): ${raw}`);
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "401 UNAUTHENTICATED: la API key es invalida, no esta activada, o se copio con espacios/comillas de mas.",
      );
    }
    if (response.status === 402) {
      throw new Error(
        "402: se agoto el pool de creditos gratis del dia. Intenta mas tarde o usa otro modelo con AGENTROUTER_MODEL.",
      );
    }
    throw new Error(`Error ${response.status} de agentrouter.org: ${data?.error?.message || raw}`);
  }

  const textBlock = (data.content || []).find((b) => b.type === "text");
  if (!textBlock) {
    throw new Error("La respuesta no contenia un bloque de texto con el prompt.");
  }
  return textBlock.text.trim();
}

async function main() {
  const goal = process.argv.slice(2).join(" ").trim();
  if (!goal) {
    console.error('Uso: node generate-codex-prompt.js "descripcion del objetivo"');
    process.exit(1);
  }

  try {
    const prompt = await generatePrompt(goal);
    console.log("\n=== Prompt para Codex ===\n");
    console.log(prompt);
    console.log("\n==========================\n");
  } catch (err) {
    console.error(`\n✖ ${err.message}\n`);
    process.exit(1);
  }
}

main();
