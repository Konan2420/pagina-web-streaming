import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Cliente server-only para la API de Payouts de Floid (Perú).
 * Docs: https://readme.floid.io — /pe/payout/create_v2 y /pe/payout/status_v2
 */
const FLOID_BASE_URL = "https://api.floid.app";

export interface FloidBeneficiary {
  entity: string;
  account: string;
  document_type?: string;
  document?: string;
  name?: string;
  father_lastname?: string;
  mother_lastname?: string;
}

export interface FloidResponse {
  code: number;
  msg: string;
  status: string;
  payout_caseid?: string;
  data?: {
    entity?: string;
    beneficiary_name?: string;
    amount?: number;
    transaction_id?: string;
    message?: string;
    updated_at?: string;
    error_message?: string;
  };
}

function getToken(): string {
  const token = process.env["FLOID_API_TOKEN"];
  if (!token) {
    throw new Error(
      "FLOID_API_TOKEN no está configurado. Agrega el token que te entregue Floid para poder enviar payouts.",
    );
  }
  return token;
}

/** URL pública a la que Floid enviará las notificaciones de estado. */
export function buildCallbackUrl(origin: string): string | undefined {
  const secret = process.env["FLOID_WEBHOOK_SECRET"];
  if (!secret || !origin) return undefined;
  return `${origin}/api/public/webhooks/floid?token=${encodeURIComponent(secret)}`;
}

async function floidPost(path: string, body: unknown): Promise<FloidResponse> {
  const res = await fetch(`${FLOID_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: FloidResponse;
  try {
    parsed = JSON.parse(text) as FloidResponse;
  } catch {
    throw new Error(`Respuesta inválida de Floid [${res.status}]: ${text.slice(0, 300)}`);
  }
  return parsed;
}

export function createFloidPayout(payload: {
  currency: "PEN" | "USD";
  amount: number;
  beneficiary: FloidBeneficiary;
  name: string;
  custom?: Record<string, string>;
  callbackurl?: string;
  sandbox: boolean;
}) {
  return floidPost("/pe/payout/create_v2", payload);
}

export function getFloidPayoutStatus(payoutCaseId: string) {
  return floidPost("/pe/payout/status_v2", { payout_caseid: payoutCaseId });
}

export function isFloidConfigured(): boolean {
  return Boolean(process.env["FLOID_API_TOKEN"]);
}

/** Lanza si el usuario autenticado no tiene rol admin. */
export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Solo un administrador puede gestionar payouts.");
}
