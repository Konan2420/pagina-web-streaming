import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Banknote, RefreshCw, Send, ShieldAlert, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { FLOID_ENTITIES, floidLimitsFor } from "@/lib/floid-entities";
import {
  createPayout,
  listPayouts,
  refreshPayoutStatus,
  getFloidConfigStatus,
} from "@/lib/floid.functions";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  component: PayoutsAdmin,
  head: () => ({
    meta: [
      { title: "Payouts Floid | CMD Streaming Admin" },
      {
        name: "description",
        content: "Envía y monitorea dispersiones de dinero a bancos peruanos y Yape con Floid.",
      },
    ],
  }),
});

const statusStyles: Record<string, string> = {
  SUCCESSFUL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  PROCESSING: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  ERROR: "bg-primary/15 text-primary border-primary/30",
};

function PayoutsAdmin() {
  const queryClient = useQueryClient();
  const fetchPayouts = useServerFn(listPayouts);
  const fetchConfig = useServerFn(getFloidConfigStatus);
  const submitPayout = useServerFn(createPayout);
  const refreshStatus = useServerFn(refreshPayoutStatus);

  const [submitting, setSubmitting] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [entity, setEntity] = useState("BCP");
  const [currency, setCurrency] = useState<"PEN" | "USD">("PEN");
  const [sandbox, setSandbox] = useState(true);

  const config = useQuery({ queryKey: ["floid-config"], queryFn: () => fetchConfig({}) });
  const payouts = useQuery({ queryKey: ["floid-payouts"], queryFn: () => fetchPayouts({}) });

  const limits = floidLimitsFor(entity, currency);
  const isYape = entity === "YAPE";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    try {
      const result = await submitPayout({
        data: {
          currency,
          amount: Number(form.get("amount")),
          entity,
          account: String(form.get("account") ?? "").trim(),
          name: String(form.get("name") ?? "").trim(),
          document_type: String(form.get("document") ?? "").trim() ? "DNI" : undefined,
          document: String(form.get("document") ?? "").trim() || undefined,
          first_name: String(form.get("first_name") ?? "").trim() || undefined,
          father_lastname: String(form.get("father_lastname") ?? "").trim() || undefined,
          mother_lastname: String(form.get("mother_lastname") ?? "").trim() || undefined,
          order_id: String(form.get("order_id") ?? "").trim() || undefined,
          sandbox,
        },
      });
      if (result.ok) {
        toast.success(`Payout ${result.status}: ${result.message ?? "enviado"}`);
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(result.message ?? "Floid rechazó el payout");
      }
      queryClient.invalidateQueries({ queryKey: ["floid-payouts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar el payout");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefresh(id: string) {
    setRefreshingId(id);
    try {
      const res = await refreshStatus({ data: { id } });
      toast.success(`Estado: ${res.status}`);
      queryClient.invalidateQueries({ queryKey: ["floid-payouts"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo consultar el estado");
    } finally {
      setRefreshingId(null);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60";

  return (
    <AdminLayout title="Payouts" subtitle="Dispersiones a bancos peruanos y Yape vía Floid">
      {config.data && !config.data.configured && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div className="text-sm text-amber-200/90">
            <p className="font-semibold text-amber-300">Falta el token de Floid</p>
            <p>
              Puedes registrar payouts en la interfaz, pero no se enviarán hasta guardar el token
              Bearer que te entregue Floid.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-white/5 bg-ink/40 p-6"
        >
          <div className="flex items-center gap-2 text-white">
            <Banknote className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg uppercase tracking-tight">Nuevo payout</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Entidad</span>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className={inputClass}
              >
                {FLOID_ENTITIES.map((ent) => (
                  <option key={ent.code} value={ent.code} className="bg-ink">
                    {ent.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Moneda</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "PEN" | "USD")}
                disabled={isYape}
                className={inputClass}
              >
                <option value="PEN" className="bg-ink">
                  PEN
                </option>
                <option value="USD" className="bg-ink">
                  USD
                </option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">
              {isYape ? "Número de celular" : "CCI (20 dígitos)"}
            </span>
            <input
              name="account"
              required
              maxLength={30}
              className={inputClass}
              placeholder={isYape ? "987654321" : "00210011700199141190"}
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/50">Nombre del beneficiario</span>
            <input
              name="name"
              required
              maxLength={120}
              className={inputClass}
              placeholder="Andres Poblete"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">DNI (opcional)</span>
              <input name="document" maxLength={20} className={inputClass} placeholder="12345678" />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Nombres</span>
              <input
                name="first_name"
                maxLength={60}
                className={inputClass}
                placeholder="Juan Ignacio"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Apellido paterno</span>
              <input
                name="father_lastname"
                maxLength={60}
                className={inputClass}
                placeholder="Pérez"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Apellido materno</span>
              <input
                name="mother_lastname"
                maxLength={60}
                className={inputClass}
                placeholder="García"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">
                Monto ({limits.min}–{limits.max})
              </span>
              <input
                name="amount"
                type="number"
                step="0.01"
                min={limits.min}
                max={limits.max}
                required
                className={inputClass}
                placeholder="100.50"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-medium text-white/50">Referencia (opcional)</span>
              <input
                name="order_id"
                maxLength={60}
                className={inputClass}
                placeholder="ORD-12345"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              type="checkbox"
              checked={sandbox}
              onChange={(e) => setSandbox(e.target.checked)}
              className="h-4 w-4 accent-[var(--color-primary,#DC2626)]"
            />
            <span className="text-sm text-white/70">
              Modo sandbox <span className="text-white/40">(no mueve dinero real)</span>
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar payout
          </button>
        </form>

        <div className="rounded-2xl border border-white/5 bg-ink/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg uppercase tracking-tight text-white">Historial</h2>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["floid-payouts"] })}
              className="flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Actualizar
            </button>
          </div>

          {payouts.isLoading ? (
            <p className="py-10 text-center text-sm text-white/40">Cargando payouts…</p>
          ) : (payouts.data?.length ?? 0) === 0 ? (
            <p className="py-10 text-center text-sm text-white/40">
              Aún no hay payouts registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-white/40">
                  <tr>
                    <th className="pb-3">Beneficiario</th>
                    <th className="pb-3">Entidad</th>
                    <th className="pb-3">Monto</th>
                    <th className="pb-3">Estado</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {payouts.data?.map((p) => (
                    <tr key={p.id} className="text-white/80">
                      <td className="py-3">
                        <p className="font-medium text-white">{p.beneficiary_name}</p>
                        <p className="text-xs text-white/40">{p.account}</p>
                      </td>
                      <td className="py-3">
                        {p.entity}
                        {p.sandbox && (
                          <span className="ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50">
                            sandbox
                          </span>
                        )}
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        {p.currency} {Number(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            statusStyles[p.status] ?? "border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.error_message && (
                          <p className="mt-1 max-w-[220px] text-[11px] text-primary/80">
                            {p.error_message}
                          </p>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleRefresh(p.id)}
                          disabled={!p.payout_caseid || refreshingId === p.id}
                          className="rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:text-primary disabled:opacity-30"
                          aria-label="Consultar estado"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${refreshingId === p.id ? "animate-spin" : ""}`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
