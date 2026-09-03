import { Check, CheckCircle2, Copy, ExternalLink, KeyRound, PartyPopper, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type DeliveryCredentials = {
  email: string | null;
  password: string | null;
  access_link: string | null;
  notes: string | null;
};

type DeliveryCelebrationModalProps = {
  open: boolean;
  orderId: string;
  productName: string;
  delivery: DeliveryCredentials;
  celebrate?: boolean;
  onClose: () => void;
  onCopy: (value: string, label: string) => Promise<boolean>;
};

const particles = [
  { left: 5, color: "#fb7185", delay: 0, rotate: 160 },
  { left: 12, color: "#facc15", delay: 180, rotate: 280 },
  { left: 20, color: "#38bdf8", delay: 70, rotate: 120 },
  { left: 29, color: "#a78bfa", delay: 290, rotate: 220 },
  { left: 38, color: "#34d399", delay: 120, rotate: 340 },
  { left: 47, color: "#f97316", delay: 220, rotate: 180 },
  { left: 56, color: "#f472b6", delay: 40, rotate: 260 },
  { left: 65, color: "#22d3ee", delay: 330, rotate: 140 },
  { left: 74, color: "#bef264", delay: 150, rotate: 310 },
  { left: 83, color: "#fbbf24", delay: 250, rotate: 200 },
  { left: 91, color: "#e879f9", delay: 90, rotate: 300 },
  { left: 97, color: "#60a5fa", delay: 360, rotate: 150 },
];

function safeExternalUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export function DeliveryCelebrationModal({
  open,
  orderId,
  productName,
  delivery,
  celebrate = true,
  onClose,
  onCopy,
}: DeliveryCelebrationModalProps) {
  if (!open) return null;

  const accessUrl = safeExternalUrl(delivery.access_link);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delivery-title"
    >
      <style>{`
        @keyframes delivery-confetti-fall {
          0% { transform: translate3d(0, -28px, 0) rotate(0deg) scale(.8); opacity: 0; }
          10% { opacity: 1; }
          82% { opacity: 1; }
          100% { transform: translate3d(42px, 430px, 0) rotate(var(--delivery-rotate)) scale(1); opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          .delivery-confetti { animation: none !important; display: none; }
        }
      `}</style>
      <button
        type="button"
        aria-label="Cerrar entrega"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <section className="relative flex w-full max-w-xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-emerald-300/25 bg-card shadow-2xl shadow-emerald-950/40 animate-in zoom-in-95 duration-200">
        {celebrate && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-64 overflow-hidden"
          >
            {particles.map((particle, index) => (
              <span
                key={index}
                className="delivery-confetti absolute top-0 h-2.5 w-1.5 rounded-sm"
                style={{
                  left: `${particle.left}%`,
                  backgroundColor: particle.color,
                  ["--delivery-rotate" as string]: `${particle.rotate}deg`,
                  animation: `delivery-confetti-fall 2400ms cubic-bezier(.2,.7,.3,1) ${particle.delay}ms both`,
                }}
              />
            ))}
          </div>
        )}

        <header className="relative shrink-0 border-b border-white/10 bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30">
                {celebrate ? <PartyPopper className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
                  {celebrate ? "Pago aprobado · entrega lista" : "Credenciales entregadas"}
                </p>
                <h2 id="delivery-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                  {productName}
                </h2>
                <p className="mt-1 text-xs text-white/55">Pedido #{orderId.slice(0, 8)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {celebrate && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <p>La cuenta ya fue descontada del stock y el cliente puede verla en Mis compras.</p>
            </div>
          )}

          <CredentialRow label="Usuario / correo" value={delivery.email} onCopy={onCopy} />
          <CredentialRow label="Contraseña" value={delivery.password} onCopy={onCopy} sensitive />

          {accessUrl && (
            <a
              href={accessUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-12 items-center justify-between rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 text-sm font-bold text-sky-100 transition hover:border-sky-300/50"
            >
              Abrir plataforma
              <ExternalLink className="h-4 w-4" />
            </a>
          )}

          {delivery.notes && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                Perfil, PIN o notas
              </p>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-white/85">
                {delivery.notes}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-black text-black transition hover:bg-emerald-100"
          >
            Listo
          </button>
        </div>
      </section>
    </div>
  );
}

function CredentialRow({
  label,
  value,
  sensitive = false,
  onCopy,
}: {
  label: string;
  value: string | null;
  sensitive?: boolean;
  onCopy: (value: string, label: string) => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const displayValue = value || "No disponible";

  const handleCopy = async () => {
    if (!value || !(await onCopy(value, label))) return;

    setCopied(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">{label}</p>
        {value && (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold text-emerald-300 transition-all duration-200 hover:bg-emerald-400/10 hover:text-emerald-200 active:scale-95"
          >
            {copied ? (
              <Check
                className="h-3.5 w-3.5 animate-in zoom-in-50 duration-200"
                aria-hidden="true"
              />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {copied ? "Copiado" : "Copiar"}
          </button>
        )}
      </div>
      <p
        className={`mt-2 break-all font-mono text-base text-white sm:text-lg ${sensitive ? "tracking-wide" : ""}`}
      >
        {displayValue}
      </p>
    </div>
  );
}
