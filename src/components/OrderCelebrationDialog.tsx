import { useEffect, useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  MessageCircle,
  PartyPopper,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildSecureCredentialsMessage,
  buildSupplierSupportMessage,
  credentialTemplateLabel,
  formatOrderExpiry,
  getCredentialFields,
  getSafeExternalUrl,
  type CredentialField,
  type OrderCredentialReceipt,
} from "@/lib/order-credentials";
import { createWhatsAppUrl, openWhatsAppUrl } from "@/lib/whatsapp";

type OrderCelebrationDialogProps = {
  receipt: OrderCredentialReceipt;
  canShareWithClient: boolean;
  onClose: () => void;
};

async function copyCredential(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado.`);
    return true;
  } catch {
    toast.error("No se pudo copiar el dato.");
    return false;
  }
}

function CredentialValue({ field }: { field: CredentialField }) {
  const [copied, setCopied] = useState(false);
  const safeLink = field.id === "access-link" ? getSafeExternalUrl(field.value) : null;

  const handleCopy = async () => {
    if (!field.value) return;
    if (await copyCredential(field.value, field.label)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background/75 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.13em] text-muted-foreground">
        {field.label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {safeLink ? (
          <a
            href={safeLink}
            target="_blank"
            rel="noreferrer"
            className="min-w-0 flex-1 truncate text-sm font-semibold text-primary hover:underline"
          >
            Abrir enlace de acceso
          </a>
        ) : (
          <p className="min-w-0 flex-1 break-all text-sm font-semibold text-foreground">
            {field.value || "No registrado"}
          </p>
        )}
        <button
          type="button"
          disabled={!field.value}
          onClick={() => void handleCopy()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Copiar ${field.label}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
        {safeLink && <ExternalLink className="hidden h-4 w-4 text-muted-foreground sm:block" />}
      </div>
    </div>
  );
}

export function OrderCelebrationDialog({
  receipt,
  canShareWithClient,
  onClose,
}: OrderCelebrationDialogProps) {
  const [sharing, setSharing] = useState(false);
  const fields = getCredentialFields(receipt);
  const supplierUrl = createWhatsAppUrl(
    receipt.supplier_whatsapp,
    buildSupplierSupportMessage(receipt),
  );
  const clientHasWhatsApp = Boolean(createWhatsAppUrl(receipt.client_phone, "Entrega segura"));

  useEffect(() => {
    let cancelled = false;
    let intervalId: number | undefined;

    void import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return;
        const burst = () =>
          confetti({
            particleCount: 42,
            spread: 64,
            startVelocity: 28,
            origin: { y: 0.14 },
            colors: ["#3B82F6", "#60A5FA", "#F8FAFC", "#22C55E"],
            disableForReducedMotion: true,
            zIndex: 130,
          });
        burst();
        intervalId = window.setInterval(burst, 520);
      })
      .catch(() => undefined);

    const timeoutId = window.setTimeout(() => {
      if (intervalId) window.clearInterval(intervalId);
    }, 1700);

    return () => {
      cancelled = true;
      if (intervalId) window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  const shareSecureLink = async () => {
    if (!clientHasWhatsApp) {
      toast.info("Este cliente no tiene un WhatsApp válido registrado.");
      return;
    }

    // Se abre durante el gesto del usuario para evitar que navegadores móviles
    // bloqueen WhatsApp tras la llamada asíncrona que crea el token.
    const whatsappWindow = window.open("about:blank", "_blank");
    if (!whatsappWindow) {
      toast.info("Permite las ventanas emergentes para enviar el enlace por WhatsApp.");
      return;
    }
    whatsappWindow.opener = null;

    setSharing(true);
    try {
      const { data, error } = await supabase.rpc("create_order_credential_share_link", {
        p_order_id: receipt.order_id,
      });
      if (error) throw error;
      const link = data?.[0];
      if (!link?.share_token) throw new Error("No se pudo crear el enlace seguro.");

      const secureLink = `${window.location.origin}/credenciales/${link.share_token}`;
      const url = createWhatsAppUrl(
        receipt.client_phone,
        buildSecureCredentialsMessage(receipt, secureLink),
      );
      if (!url) throw new Error("No se pudo preparar el enlace de WhatsApp.");
      whatsappWindow.location.replace(url);
      toast.success("WhatsApp preparado con un enlace seguro de un solo uso.");
    } catch (error) {
      if (!whatsappWindow.closed) whatsappWindow.close();
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo preparar el enlace seguro para el cliente.",
      );
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-celebration-title"
    >
      <button
        type="button"
        aria-label="Cerrar confirmación del pedido"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm"
      />
      <section className="relative max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-primary/25 bg-card shadow-2xl sm:max-h-[calc(100dvh-2.5rem)]">
        <header className="relative overflow-hidden border-b border-border bg-primary/[0.08] px-5 pb-5 pt-6 sm:px-7">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar confirmación"
            className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-lg border border-border bg-card/80 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <PartyPopper className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-primary">Compra procesada correctamente</p>
              <h2
                id="order-celebration-title"
                className="mt-0.5 text-xl font-black text-foreground sm:text-2xl"
              >
                ¡Pedido confirmado!
              </h2>
            </div>
          </div>
        </header>

        <div className="space-y-5 p-5 sm:p-7">
          <div className="grid gap-3 rounded-xl border border-border bg-muted/45 p-4 text-sm sm:grid-cols-2">
            <InfoItem label="Cliente" value={receipt.client_name} />
            <InfoItem label="Producto" value={receipt.product_name} />
            <InfoItem label="Vencimiento" value={formatOrderExpiry(receipt.expires_at)} />
            <InfoItem label="Pedido" value={`#${receipt.order_id.slice(0, 8)}`} />
          </div>

          <section className="rounded-xl border border-primary/20 bg-primary/[0.045] p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-foreground">Credenciales protegidas</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {credentialTemplateLabel(receipt.credential_template)}. Copia cada dato de forma
                  individual y evita compartirlo con terceros.
                </p>
              </div>
            </div>
            {fields.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {fields.map((field) => (
                  <CredentialValue key={field.id} field={field} />
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-lg border border-dashed border-border bg-background/55 p-3 text-xs text-muted-foreground">
                Este producto no requiere credenciales de acceso. Revisa las instrucciones del
                pedido.
              </p>
            )}
            {receipt.notes && (
              <div className="mt-3 rounded-lg border border-border bg-background/55 p-3 text-xs leading-relaxed text-muted-foreground">
                <span className="font-bold text-foreground">Indicaciones: </span>
                {receipt.notes}
              </div>
            )}
          </section>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={!supplierUrl}
              onClick={() => {
                if (!supplierUrl || !openWhatsAppUrl(supplierUrl)) {
                  toast.info("Este proveedor no tiene un WhatsApp válido registrado.");
                }
              }}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-bold text-foreground transition hover:border-emerald-500/60 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:text-emerald-400"
            >
              <MessageCircle className="h-4 w-4 text-emerald-500" />
              {supplierUrl ? "Soporte del proveedor" : "Proveedor sin WhatsApp"}
            </button>
            {canShareWithClient && (
              <button
                type="button"
                disabled={sharing || !clientHasWhatsApp}
                onClick={() => void shareSecureLink()}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {sharing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                {clientHasWhatsApp ? "Enviar enlace seguro" : "Cliente sin WhatsApp"}
              </button>
            )}
          </div>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            Los enlaces enviados por WhatsApp no contienen contraseñas y vencen tras 15 minutos o
            después de su primer uso.
          </p>
        </div>
        <footer className="border-t border-border bg-card p-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background text-sm font-bold text-foreground transition hover:border-primary/60 hover:text-primary"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Entendido
          </button>
        </footer>
      </section>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
    </div>
  );
}
