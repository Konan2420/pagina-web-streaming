import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ChangeEvent } from "react";
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Image as ImageIcon,
  Loader2,
  Settings2,
  Trash2,
  Upload,
  User,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  formatRechargeAmount,
  formatRechargeDate,
  rechargeMethodLabel,
  RECHARGE_STATUS_LABELS,
  RECHARGE_STATUS_STYLES,
  type Recarga,
  type RechargeStatus,
} from "@/lib/recargas";
import { cn } from "@/lib/utils";

type RechargeProfile = Pick<Tables<"profiles">, "id" | "nombre_completo" | "email">;
type AdminRecharge = Recarga & {
  requester: RechargeProfile | null;
  beneficiary: RechargeProfile | null;
};
type StatusFilter = "todas" | RechargeStatus;
type PaymentSettings = Pick<
  Tables<"payment_settings">,
  | "lemon_qr_url"
  | "lemon_tag"
  | "yape_plin_contact"
  | "yape_plin_qr_url"
  | "binance_pay_id"
  | "binance_qr_url"
>;
type QrUrlField = "lemon_qr_url" | "yape_plin_qr_url" | "binance_qr_url";

const EMPTY_SETTINGS: PaymentSettings = {
  lemon_qr_url: null,
  lemon_tag: null,
  yape_plin_contact: null,
  yape_plin_qr_url: null,
  binance_pay_id: null,
  binance_qr_url: null,
};

export const Route = createFileRoute("/_authenticated/admin/recargas")({
  component: RechargesAdminPage,
});

function RechargesAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendiente");
  const [selectedRecharge, setSelectedRecharge] = useState<AdminRecharge | null>(null);
  const [settingsForm, setSettingsForm] = useState<PaymentSettings>(EMPTY_SETTINGS);
  const [uploadingQr, setUploadingQr] = useState<QrUrlField | null>(null);

  const rechargesQuery = useQuery({
    queryKey: ["admin-recharges"],
    queryFn: async () => {
      const { data: recharges, error: rechargesError } = await supabase
        .from("recargas")
        .select("*")
        .order("created_at", { ascending: false });
      if (rechargesError) throw rechargesError;

      const profileIds = [
        ...new Set(
          (recharges ?? []).flatMap((recharge) =>
            [recharge.user_id, recharge.beneficiario_id].filter((id): id is string => Boolean(id)),
          ),
        ),
      ];
      let profilesById: Record<string, RechargeProfile> = {};

      if (profileIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nombre_completo, email")
          .in("id", profileIds);
        if (profilesError) throw profilesError;
        profilesById = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile]));
      }

      return (recharges ?? []).map<AdminRecharge>((recharge) => ({
        ...recharge,
        requester: profilesById[recharge.user_id] ?? null,
        beneficiary: recharge.beneficiario_id ? profilesById[recharge.beneficiario_id] ?? null : null,
      }));
    },
  });

  const settingsQuery = useQuery({
    queryKey: ["admin-payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("lemon_qr_url, lemon_tag, yape_plin_contact, yape_plin_qr_url, binance_pay_id, binance_qr_url")
        .eq("id", "default")
        .maybeSingle();
      if (error) throw error;
      return data as PaymentSettings | null;
    },
  });

  useEffect(() => {
    if (settingsQuery.data) setSettingsForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const approveMutation = useMutation({
    mutationFn: async ({ rechargeId, creditedAmount }: { rechargeId: string; creditedAmount: number }) => {
      const { error } = await supabase.rpc("approve_recarga", {
        _recarga_id: rechargeId,
        _monto_acreditado_pen: creditedAmount,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recarga verificada y saldo acreditado.");
      setSelectedRecharge(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-recharges"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
    },
    onError: () => toast.error("No se pudo acreditar la recarga. Actualiza e inténtalo nuevamente."),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ rechargeId, reason }: { rechargeId: string; reason: string }) => {
      const { error } = await supabase.rpc("reject_recarga", {
        _recarga_id: rechargeId,
        _motivo: reason.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitud de recarga rechazada.");
      setSelectedRecharge(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-recharges"] });
    },
    onError: () => toast.error("No se pudo rechazar la recarga."),
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("payment_settings")
        .update({
          lemon_qr_url: settingsForm.lemon_qr_url?.trim() || null,
          lemon_tag: settingsForm.lemon_tag?.trim() || null,
          yape_plin_contact: settingsForm.yape_plin_contact?.trim() || null,
          yape_plin_qr_url: settingsForm.yape_plin_qr_url?.trim() || null,
          binance_pay_id: settingsForm.binance_pay_id?.trim() || null,
          binance_qr_url: settingsForm.binance_qr_url?.trim() || null,
        })
        .eq("id", "default");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Datos de cobro actualizados.");
      void queryClient.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      void queryClient.invalidateQueries({ queryKey: ["payment-settings"] });
    },
    onError: () => toast.error("No se pudieron guardar los datos de cobro."),
  });

  const handleQrUpload = async (field: QrUrlField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error("El QR debe ser una imagen PNG o JPG.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El QR no puede superar los 5 MB.");
      event.target.value = "";
      return;
    }

    setUploadingQr(field);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Tu sesión de administrador no es válida.");

      const extension = file.type === "image/png" ? "png" : "jpg";
      const path = `${authData.user.id}/${field}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("payment-qr-codes")
        .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from("payment-qr-codes").getPublicUrl(path);
      if (!publicUrlData.publicUrl) throw new Error("No se pudo obtener la URL pública del QR.");

      setSettingsForm((current) => ({ ...current, [field]: publicUrlData.publicUrl }));
      toast.success("QR cargado. Guarda los datos de cobro para publicarlo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`No se pudo cargar el QR: ${message}`);
    } finally {
      setUploadingQr(null);
      event.target.value = "";
    }
  };

  const recharges = rechargesQuery.data ?? [];
  const pendingCount = recharges.filter((recharge) => recharge.estado === "pendiente").length;
  const filteredRecharges = recharges.filter(
    (recharge) => statusFilter === "todas" || recharge.estado === statusFilter,
  );

  return (
    <AdminLayout title="Recargas" subtitle="Verifica pagos, acredita saldo y configura los datos de cobro">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <RechargeStat label="Pendientes" value={pendingCount} tone="amber" />
        <RechargeStat
          label="Verificadas"
          value={recharges.filter((recharge) => recharge.estado === "verificado").length}
          tone="emerald"
        />
        <RechargeStat
          label="Rechazadas"
          value={recharges.filter((recharge) => recharge.estado === "rechazado").length}
          tone="slate"
        />
      </div>

      <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <Settings2 className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h2 className="text-base font-bold text-white">Datos visibles para el cliente</h2>
            <p className="mt-1 text-xs leading-relaxed text-white/50">
              Configura el QR de Lemon Cash y los identificadores oficiales. No se conecta ninguna API de pagos.
            </p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black/10 p-4">
            <QrUploadField
              label="QR Lemon Cash"
              value={settingsForm.lemon_qr_url}
              isUploading={uploadingQr === "lemon_qr_url"}
              onUpload={(event) => handleQrUpload("lemon_qr_url", event)}
              onClear={() => setSettingsForm((current) => ({ ...current, lemon_qr_url: null }))}
            />
            <div className="mt-4">
              <SettingsField
                label="LemonTag"
                value={settingsForm.lemon_tag ?? ""}
                placeholder="@cmdstreaming"
                onChange={(value) => setSettingsForm((current) => ({ ...current, lemon_tag: value }))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-4">
            <QrUploadField
              label="QR Yape / Plin"
              value={settingsForm.yape_plin_qr_url}
              isUploading={uploadingQr === "yape_plin_qr_url"}
              onUpload={(event) => handleQrUpload("yape_plin_qr_url", event)}
              onClear={() => setSettingsForm((current) => ({ ...current, yape_plin_qr_url: null }))}
            />
            <div className="mt-4">
              <SettingsField
                label="Número o contacto Yape / Plin"
                value={settingsForm.yape_plin_contact ?? ""}
                placeholder="999 999 999 · CMD Streaming"
                onChange={(value) => setSettingsForm((current) => ({ ...current, yape_plin_contact: value }))}
              />
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/10 p-4">
            <QrUploadField
              label="QR Binance Pay"
              value={settingsForm.binance_qr_url}
              isUploading={uploadingQr === "binance_qr_url"}
              onUpload={(event) => handleQrUpload("binance_qr_url", event)}
              onClear={() => setSettingsForm((current) => ({ ...current, binance_qr_url: null }))}
            />
            <div className="mt-4">
              <SettingsField
                label="ID de Binance Pay"
                value={settingsForm.binance_pay_id ?? ""}
                placeholder="ID de pago de CMD"
                onChange={(value) => setSettingsForm((current) => ({ ...current, binance_pay_id: value }))}
              />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => saveSettingsMutation.mutate()}
          disabled={saveSettingsMutation.isPending || settingsQuery.isLoading}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
        >
          {saveSettingsMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Settings2 className="h-3.5 w-3.5" />}
          Guardar datos de cobro
        </button>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <WalletCards className="h-5 w-5 text-primary" aria-hidden="true" />
              Solicitudes de recarga
            </h2>
            <p className="mt-1 text-xs text-white/45">Aprueba únicamente pagos que hayas confirmado por el método correspondiente.</p>
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
          >
            <option value="todas" className="bg-card">Todos los estados</option>
            {Object.entries(RECHARGE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-card">{label}</option>
            ))}
          </select>
        </div>

        {rechargesQuery.isLoading ? (
          <div className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-white/[0.025]">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Cargando recargas" />
          </div>
        ) : rechargesQuery.isError ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5 text-sm text-red-100">
            No se pudieron cargar las solicitudes. Actualiza la página e inténtalo nuevamente.
          </div>
        ) : filteredRecharges.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
            <CreditCard className="mx-auto h-8 w-8 text-white/25" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-white/70">No hay recargas para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/35 md:grid">
              <span>Solicitante</span><span>Destino y método</span><span>Monto</span><span>Estado</span><span>Fecha</span>
            </div>
            <div className="divide-y divide-white/8">
              {filteredRecharges.map((recharge) => (
                <button
                  key={recharge.id}
                  type="button"
                  onClick={() => setSelectedRecharge(recharge)}
                  className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.045] md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto_auto] md:items-center md:gap-4"
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 truncate text-sm font-semibold text-white">
                      <User className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden="true" />
                      {recharge.requester?.nombre_completo || recharge.nombre_declarado}
                    </span>
                    <span className="mt-1 block truncate text-[10px] text-white/35">{recharge.requester?.email || "Sin correo de perfil"}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-white/75">{rechargeMethodLabel(recharge.metodo)}</span>
                    <span className="mt-1 block truncate text-[10px] text-white/40">
                      {recharge.para_otro_usuario ? `Para: ${recharge.beneficiary?.email || recharge.beneficiario_email}` : "Para su propia billetera"}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-white">{formatRechargeAmount(recharge.monto, recharge.moneda)}</span>
                  <span><RechargeStatusBadge status={recharge.estado} /></span>
                  <span className="text-[10px] text-white/40">{formatRechargeDate(recharge.created_at)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {selectedRecharge && (
        <RechargeReviewModal
          recharge={selectedRecharge}
          pending={approveMutation.isPending || rejectMutation.isPending}
          onClose={() => setSelectedRecharge(null)}
          onApprove={(creditedAmount) => approveMutation.mutate({ rechargeId: selectedRecharge.id, creditedAmount })}
          onReject={(reason) => rejectMutation.mutate({ rechargeId: selectedRecharge.id, reason })}
        />
      )}
    </AdminLayout>
  );
}

function RechargeStat({ label, value, tone }: { label: string; value: number; tone: "amber" | "emerald" | "slate" }) {
  const tones = {
    amber: "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
    emerald: "border-emerald-400/20 bg-emerald-400/[0.08] text-emerald-200",
    slate: "border-white/10 bg-white/[0.04] text-white/65",
  };
  return (
    <div className={cn("rounded-2xl border p-4", tones[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function QrUploadField({
  label,
  value,
  isUploading,
  onUpload,
  onClear,
}: {
  label: string;
  value: string | null;
  isUploading: boolean;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
          {value ? (
            <img src={value} alt={`Vista previa de ${label}`} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full w-full place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-100 text-slate-400">
              <ImageIcon className="h-6 w-6" aria-hidden="true" />
              <span className="px-1 text-center text-[8px] font-bold uppercase tracking-wide">Sin QR</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <label className="flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-[10px] font-bold text-white transition hover:border-primary/50 hover:bg-primary/10">
            {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {isUploading ? "Cargando…" : value ? "Cambiar QR" : "Subir QR"}
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={onUpload}
              disabled={isUploading}
              className="sr-only"
            />
          </label>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-400/20 px-3 text-[10px] font-bold text-red-200 transition hover:border-red-400/50 hover:bg-red-400/10 hover:text-white"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Quitar QR
            </button>
          )}
        </div>
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-white/35">PNG o JPG · máximo 5 MB. El QR se muestra completo, sin deformarse.</p>
    </div>
  );
}

function SettingsField({ label, value, placeholder, onChange }: { label: string; value: string; placeholder: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-primary/60" />
    </label>
  );
}

function RechargeStatusBadge({ status }: { status: RechargeStatus }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide", RECHARGE_STATUS_STYLES[status])}>{RECHARGE_STATUS_LABELS[status]}</span>;
}

function RechargeReviewModal({ recharge, pending, onClose, onApprove, onReject }: { recharge: AdminRecharge; pending: boolean; onClose: () => void; onApprove: (creditedAmount: number) => void; onReject: (reason: string) => void }) {
  const [creditedAmount, setCreditedAmount] = useState(recharge.moneda === "PEN" ? String(recharge.monto) : "");
  const [rejectReason, setRejectReason] = useState("");
  const isPending = recharge.estado === "pendiente";

  const approve = () => {
    const amount = Number(creditedAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Ingresa el monto válido que se acreditará en soles.");
      return;
    }
    onApprove(amount);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="recharge-review-title">
      <button type="button" aria-label="Cerrar revisión" onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <section className="relative flex w-full max-w-xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">Verificación manual</p>
            <h2 id="recharge-review-title" className="mt-1 text-xl font-black text-white">Solicitud de recarga</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"><X className="h-4 w-4" /></button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-sm sm:grid-cols-2">
            <Detail label="Método" value={rechargeMethodLabel(recharge.metodo)} />
            <Detail label="Monto declarado" value={formatRechargeAmount(recharge.monto, recharge.moneda)} />
            <Detail label="Nombre / tag" value={recharge.nombre_declarado} />
            <Detail label="Solicitada" value={formatRechargeDate(recharge.created_at)} />
            <Detail label="Solicitante" value={recharge.requester?.email || recharge.requester?.nombre_completo || "Sin datos"} />
            <Detail label="Billetera destino" value={recharge.para_otro_usuario ? recharge.beneficiary?.email || recharge.beneficiario_email || "No indicada" : "Solicitante"} />
          </div>
          {recharge.motivo_rechazo && <p className="rounded-xl border border-red-400/25 bg-red-400/10 p-3 text-xs text-red-100">Motivo de rechazo: {recharge.motivo_rechazo}</p>}
          {isPending && (
            <>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">Monto a acreditar (PEN)</span>
                <input type="number" min="0.01" step="0.01" value={creditedAmount} onChange={(event) => setCreditedAmount(event.target.value)} placeholder="0.00" className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-primary/60" />
                <span className="block text-[10px] leading-relaxed text-white/40">En Binance USD, este valor lo define manualmente el administrador tras verificar el pago.</span>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">Motivo si rechazas (opcional)</span>
                <textarea rows={3} maxLength={500} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="Ej.: No se encontró el pago con estos datos." className="w-full resize-none rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-primary/60" />
              </label>
            </>
          )}
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-white/10 p-5 sm:flex-row sm:justify-between sm:p-6">
          {isPending ? <button type="button" disabled={pending} onClick={() => onReject(rejectReason)} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-400/25 px-4 text-[10px] font-black uppercase tracking-wide text-red-200 transition hover:border-red-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"><X className="h-3.5 w-3.5" />Rechazar</button> : <span className="text-xs text-white/45">Esta solicitud ya fue {RECHARGE_STATUS_LABELS[recharge.estado].toLowerCase()}.</span>}
          {isPending && <button type="button" disabled={pending} onClick={approve} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">{pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardCheck className="h-3.5 w-3.5" />}Verificar y acreditar</button>}
        </footer>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">{label}</p><p className="mt-1 break-words text-xs text-white/75">{value}</p></div>;
}
