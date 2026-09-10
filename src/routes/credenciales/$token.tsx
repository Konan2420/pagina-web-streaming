import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Copy, ExternalLink, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildSupplierSupportMessage,
  credentialTemplateLabel,
  formatOrderExpiry,
  getCredentialFields,
  getSafeExternalUrl,
  type CredentialField,
  type OrderCredentialReceipt,
} from "@/lib/order-credentials";
import { createWhatsAppUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/credenciales/$token")({
  ssr: false,
  component: TemporaryCredentialsPage,
});

function TemporaryCredentialsPage() {
  const { token } = Route.useParams();
  const receiptQuery = useQuery({
    queryKey: ["temporary-order-credentials", token],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("consume_order_credential_share_link", {
        p_token: token,
      });
      if (error) throw error;
      if (!data?.[0]) throw new Error("El enlace no contiene una entrega disponible.");
      return data[0] as OrderCredentialReceipt;
    },
    retry: false,
    staleTime: Infinity,
  });

  if (receiptQuery.isLoading) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-5 text-foreground">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4 text-sm font-semibold">
          <Loader2 className="h-5 w-5 animate-spin text-primary" /> Verificando enlace seguro…
        </div>
      </main>
    );
  }

  if (receiptQuery.isError || !receiptQuery.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-background p-5 text-foreground">
        <section className="w-full max-w-md rounded-2xl border border-destructive/35 bg-card p-6 text-center shadow-xl">
          <KeyRound className="mx-auto h-8 w-8 text-destructive" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-black">Enlace no disponible</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Este enlace ya fue utilizado, expiró o no es válido. Solicita uno nuevo a quien realizó
            tu pedido.
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Ir al catálogo
          </Link>
        </section>
      </main>
    );
  }

  const receipt = receiptQuery.data;
  const supplierUrl = createWhatsAppUrl(
    receipt.supplier_whatsapp,
    buildSupplierSupportMessage(receipt),
  );

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 sm:py-12">
      <section className="mx-auto w-full max-w-xl overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-2xl">
        <header className="border-b border-border bg-primary/[0.07] p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-primary">Entrega segura</p>
              <h1 className="mt-0.5 text-xl font-black sm:text-2xl">Tus credenciales</h1>
            </div>
          </div>
        </header>
        <div className="space-y-5 p-5 sm:p-7">
          <div className="rounded-xl border border-border bg-muted/45 p-4 text-sm">
            <p className="font-black text-foreground">{receipt.product_name}</p>
            <p className="mt-1 text-muted-foreground">
              Vence el {formatOrderExpiry(receipt.expires_at)}.
            </p>
          </div>
          <section className="rounded-xl border border-primary/20 bg-primary/[0.045] p-4">
            <p className="text-sm font-black text-foreground">
              {credentialTemplateLabel(receipt.credential_template)}
            </p>
            <div className="mt-4 grid gap-3">
              {getCredentialFields(receipt).map((field) => (
                <TemporaryCredentialField key={field.id} field={field} />
              ))}
            </div>
            {getCredentialFields(receipt).length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Este producto no requiere credenciales de acceso.
              </p>
            )}
          </section>
          {receipt.notes && (
            <p className="rounded-xl border border-border bg-muted/45 p-4 text-sm leading-relaxed text-muted-foreground">
              {receipt.notes}
            </p>
          )}
          {supplierUrl && (
            <a
              href={supplierUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background text-sm font-bold text-foreground transition hover:border-primary/60 hover:text-primary"
            >
              Contactar soporte del proveedor
            </a>
          )}
        </div>
      </section>
    </main>
  );
}

function TemporaryCredentialField({ field }: { field: CredentialField }) {
  const [copied, setCopied] = useState(false);
  const safeLink = field.id === "access-link" ? getSafeExternalUrl(field.value) : null;

  const copy = async () => {
    if (!field.value) return;
    try {
      await navigator.clipboard.writeText(field.value);
      setCopied(true);
      toast.success(`${field.label} copiado.`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("No se pudo copiar el dato.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-3">
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
          onClick={() => void copy()}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:opacity-40"
          aria-label={`Copiar ${field.label}`}
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
        </button>
        {safeLink && <ExternalLink className="hidden h-4 w-4 text-muted-foreground sm:block" />}
      </div>
    </div>
  );
}
