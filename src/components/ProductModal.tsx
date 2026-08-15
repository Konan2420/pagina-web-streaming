import { useEffect, useMemo } from "react";
import {
  X,
  ShoppingCart,
  MessageCircle,
  Sun,
  Moon,
  BadgeCheck,
  Store,
  Clock,
  Lock,
} from "lucide-react";
import {
  WA_NUMBER,
  buildProductInquiryWhatsAppMessage,
  buildWhatsAppMessage,
} from "@/components/tienda/data";
import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { useFuturisticSound } from "@/hooks/useSound";

export type ProductDetail = {
  id: string;
  name: string;
  price: number;
  category: string;
  duracion: string;
  descripcion_larga: string;
  horario_atencion_inicio: string; // "HH:MM"
  horario_atencion_fin: string;
  whatsapp_contacto: string; // digits only, international format
  vendedor: string;
  /** Datos reales del proveedor (fuente: supplier_profiles). */
  supplier_avatar_url?: string | null;
  supplier_avatar_effect?: string | null;
  supplier_verified?: boolean;
  image?: string;
  shortLabel?: string;
};

function isOpenNow(inicio: string, fin: string) {
  const [hi, mi] = inicio.split(":").map(Number);
  const [hf, mf] = fin.split(":").map(Number);
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const start = hi * 60 + mi;
  const end = hf * 60 + mf;
  return end >= start ? cur >= start && cur <= end : cur >= start || cur <= end;
}

export function ProductModal({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  isBuying = false,
}: {
  product: ProductDetail | null;
  onClose: () => void;
  onAddToCart: (p: ProductDetail) => void;
  onBuyNow?: (p: ProductDetail) => void;
  isBuying?: boolean;
}) {
  const { playHover, playClick } = useFuturisticSound();
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  const abierto = useMemo(
    () =>
      product ? isOpenNow(product.horario_atencion_inicio, product.horario_atencion_fin) : false,
    [product],
  );

  if (!product) return null;

  const waMessage = encodeURIComponent(buildWhatsAppMessage(product));
  const waHref = `https://wa.me/${product.whatsapp_contacto}?text=${waMessage}`;
  const inquiryMessage = encodeURIComponent(buildProductInquiryWhatsAppMessage(product));
  const inquiryHref = `https://wa.me/${WA_NUMBER}?text=${inquiryMessage}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full h-[100dvh] sm:h-[min(86dvh,700px)] sm:max-w-4xl bg-[#0d0d14] border-y sm:border border-white/10 overflow-hidden animate-scale-in flex flex-col sm:grid sm:grid-cols-2 shadow-2xl sm:rounded-3xl"
      >
        {/* Close */}
        <button
          onClick={() => {
            playClick();
            onClose();
          }}
          onMouseEnter={playHover}
          aria-label="Cerrar"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 border border-white/15 grid place-items-center text-white/80 hover:text-white hover:border-white/30"
        >
          <X className="w-4 h-4" />
        </button>

        {/* IMAGE COLUMN */}
        <div className="relative shrink-0 sm:h-full sm:min-h-0 overflow-hidden">
          <div className="relative h-44 sm:h-full min-h-[160px] bg-gradient-to-br from-red-accent/50 via-violet/40 to-black overflow-hidden flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover opacity-80"
              />
            ) : (
              <div className="absolute inset-0 grid place-items-center">
                <div className="w-24 h-24 sm:w-36 sm:h-36 rounded-3xl bg-white/10 border border-white/20 grid place-items-center">
                  <Store className="w-12 h-12 sm:w-16 sm:h-16 text-white/90" />
                </div>
              </div>
            )}
            <span className="absolute top-3 left-3 max-w-[70%] truncate px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold tracking-wider text-white uppercase">
              {product.shortLabel ?? product.name}
            </span>
          </div>
        </div>

        {/* CONTENT COLUMN */}
        <div className="flex-1 min-h-0 sm:h-full flex flex-col bg-[#0d0d14]">
          <div className="overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-touch scrollbar-none sm:scrollbar-thin">
            <div>
              <h2
                id="product-modal-title"
                className="font-display text-2xl sm:text-3xl text-white leading-tight"
              >
                {product.name}
              </h2>
              <p className="mt-1 font-display text-3xl sm:text-4xl text-gradient-violet">
                S/ {product.price.toFixed(2)}
              </p>
            </div>

            {/* Horario */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center shrink-0">
                  <Clock className="w-4 h-4 text-white/70" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-white/70">
                    Horario de atención
                  </p>
                  <p className="text-sm text-white font-semibold truncate">
                    De {product.horario_atencion_inicio} a {product.horario_atencion_fin}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  abierto
                    ? "bg-green-500/20 border border-green-500/40 text-green-300"
                    : "bg-white/5 border border-white/15 text-white/78"
                }`}
              >
                {abierto ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                {abierto ? "Abierto" : "Cerrado"}
              </span>
            </div>

            {/* Descripción */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/70 mb-2">
                Descripción del producto
              </p>
              <div className="text-sm text-white/80 leading-relaxed whitespace-pre-line">
                {product.descripcion_larga}
              </div>
            </div>

            {/* Contacto */}
            <div className="rounded-2xl bg-gradient-to-br from-red-accent/10 to-violet/10 border border-white/10 p-4 flex items-start gap-3">
              <Lock className="w-4 h-4 text-red-accent mt-0.5 shrink-0" />
              <div className="text-xs text-white/75 leading-relaxed">
                Activación por WhatsApp:{" "}
                <span className="text-white font-semibold">+{product.whatsapp_contacto}</span>
                <br />
                Cualquier duda hacerla de preferencia antes de realizar la compra.
              </div>
            </div>

            {/* Vendedor */}
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-3">
              {product.supplier_avatar_url ? (
                <ProviderAvatar
                  src={product.supplier_avatar_url}
                  effect={product.supplier_avatar_effect ?? "none"}
                  verified={product.supplier_verified ?? false}
                  size="sm"
                  alt={`Avatar de ${product.vendedor}`}
                  className="shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-full gradient-violet grid place-items-center shrink-0">
                  <span className="text-white font-bold text-sm">
                    {product.vendedor.slice(0, 2).toUpperCase()}
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <p className="text-sm font-semibold text-white truncate">@{product.vendedor}</p>
                  <BadgeCheck className="w-4 h-4 text-red-accent fill-red-accent/30 shrink-0" />
                </div>
                <p className="text-[11px] text-white/70">Vendedor Autorizado</p>
              </div>
              <div
                aria-label="Tienda verificada"
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-white/70"
              >
                <Store className="w-4 h-4" />
              </div>
            </div>

            {/* Meta cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/70">Duración</p>
                <p className="mt-1 text-sm font-bold text-white">{product.duracion}</p>
              </div>
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-3">
                <p className="text-[10px] uppercase tracking-wider text-white/70">Categoría</p>
                <p className="mt-1 text-sm font-bold text-white capitalize">{product.category}</p>
              </div>
            </div>
          </div>

          {/* Sticky actions */}
          <div className="p-4 sm:p-6 border-t border-white/10 bg-[#0d0d14] space-y-3 pb-safe-offset-4 shrink-0">
            <button
              onClick={() => {
                playClick();
                onAddToCart(product);
              }}
              onMouseEnter={playHover}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-violet text-white text-sm font-bold hover:scale-[1.01] transition shadow-lg shadow-red-600/10"
            >
              <ShoppingCart className="w-4 h-4" />
              Añadir al carrito — S/ {product.price.toFixed(2)}
            </button>
            <button
              type="button"
              disabled={isBuying}
              onClick={() => {
                if (isBuying) return;
                playClick();
                if (onBuyNow) {
                  onBuyNow(product);
                } else {
                  const phone = product.whatsapp_contacto;
                  const message = encodeURIComponent(buildWhatsAppMessage(product));
                  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

                  const link = document.createElement("a");
                  link.href = whatsappUrl;
                  link.target = "_blank";
                  link.rel = "noopener noreferrer";
                  link.className = "boton-comprar";
                  link.click();
                }
              }}
              onMouseEnter={playHover}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              <MessageCircle className="w-4 h-4" />
              {isBuying ? "Registrando pedido..." : "Comprar ahora"}
            </button>
            <a
              href={inquiryHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={playClick}
              onMouseEnter={playHover}
              className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:brightness-110 transition"
            >
              <MessageCircle className="w-4 h-4" />
              Consultar por WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
