import {
  BadgeCheck,
  Check,
  CircleCheck,
  Globe2,
  Package,
  RefreshCw,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Product } from "./data";
import { PlatformIconMark } from "@/lib/platformIcons";
import { Skeleton } from "@/components/ui/skeleton";

type ProductStock = {
  available: boolean;
  count: number | null;
};

type ProductCatalogCardProps = {
  product: Product & {
    isRenewable?: boolean;
    accountType?: "completa" | "perfil";
    accessScope?: "global" | "regional";
    publisherName?: string | null;
  };
  stock: ProductStock;
  lastSaleAt?: string | null;
  onOpen: () => void;
  onAdd: () => void;
  onHover?: () => void;
};

function relativeTime(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  if (!Number.isFinite(elapsed)) return "hace poco";

  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "hace unos instantes";
  if (minutes < 60) return `hace ${minutes} min`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days === 1 ? "" : "s"}`;

  const months = Math.floor(days / 30);
  return `hace ${months} mes${months === 1 ? "" : "es"}`;
}

function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CMD"
  );
}

/** Tarjeta uniforme del catálogo. La compra se conserva y los datos de venta son públicos y agregados. */
export function ProductCatalogCard({
  product,
  stock,
  lastSaleAt = null,
  onOpen,
  onAdd,
  onHover,
}: ProductCatalogCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const sellerName = product.publisherName?.trim() || "CMD Streaming";
  const accountTypeLabel = product.accountType === "perfil" ? "Perfil" : "Completa";
  const accessScopeLabel = product.accessScope === "regional" ? "Regional" : "Global";
  const isOutOfService = !stock.available;
  const stockLabel = stock.count != null ? `${stock.count} Stock` : "En stock";
  const footer = lastSaleAt
    ? `${sellerName} · ${relativeTime(lastSaleAt)}`
    : "Sé el primero en comprar";

  const handleAdd = () => {
    if (isOutOfService) return;
    setJustAdded(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setJustAdded(false), 350);
    onAdd();
  };

  return (
    <article className="product-card catalog-product-card group flex h-full min-h-[27rem] flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-square shrink-0 overflow-hidden bg-background">
        {product.image && !product.image.includes("/placeholder.svg") ? (
          <img
            src={product.image}
            alt={`Portada de ${product.name}`}
            loading="lazy"
            decoding="async"
            className={`catalog-product-image h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none ${
              isOutOfService ? "opacity-65 saturate-75" : ""
            }`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center bg-background">
            <Package className="h-10 w-10 text-white/10" aria-hidden="true" />
          </div>
        )}

        <div className="pointer-events-none absolute left-2 top-2">
          <span
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm ring-1 ring-white/15 ${
              product.isRenewable === false ? "bg-slate-700/95" : "bg-emerald-500/95"
            }`}
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {product.isRenewable === false ? "No renovable" : "Renovable"}
          </span>
        </div>
        <div className="pointer-events-none absolute right-2 top-2">
          <span className="rounded-md bg-red-accent px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm ring-1 ring-white/15">
            {product.duracion}
          </span>
        </div>

        {isOutOfService && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-red-accent px-2 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-white">
            Fuera de servicio
          </div>
        )}

        <button
          type="button"
          onClick={onOpen}
          onMouseEnter={onHover}
          className="absolute inset-0 grid place-items-center bg-black/20 transition-colors sm:bg-black/45 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={`Ver detalles de ${product.name}`}
        >
          <span className="rounded-lg border border-white/15 bg-black/70 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-transform duration-300 sm:translate-y-2 sm:group-hover:translate-y-0">
            Ver detalles
          </span>
        </button>
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex min-h-7 items-center gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              aria-hidden="true"
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-red-accent to-red-950 text-[8px] font-black text-white"
            >
              {initials(sellerName)}
            </span>
            <span className="truncate font-sans text-[10px] font-semibold tracking-[0.01em] text-white/85">
              {sellerName}
            </span>
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 text-sky-400"
              aria-label="Vendedor verificado"
            />
          </div>
          {product.iconId ? (
            <PlatformIconMark
              iconId={product.iconId}
              className="ml-auto h-7 w-7 shrink-0 rounded-lg border border-white/20 shadow-md"
              iconClassName="h-3.5 w-3.5"
            />
          ) : (
            <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/[0.06] text-white/55">
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          )}
        </div>

        <h3 className="catalog-product-title mt-2 min-h-[2.75rem] line-clamp-2 font-product text-[15px] font-bold leading-[1.35] tracking-[-0.015em] text-white transition-colors duration-200 sm:text-base">
          {product.name}
        </h3>

        <div className="mt-2 flex min-h-5 flex-wrap items-center gap-1.5 font-sans text-[9px] font-medium text-white/80">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/[0.055] px-1.5 py-1 leading-none">
            {accountTypeLabel === "Perfil" ? (
              <UserRound className="h-3 w-3 text-white/70" aria-hidden="true" />
            ) : (
              <CircleCheck className="h-3 w-3 text-emerald-300" aria-hidden="true" />
            )}
            {accountTypeLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/[0.055] px-1.5 py-1 leading-none">
            <Globe2 className="h-3 w-3 text-sky-300" aria-hidden="true" />
            {accessScopeLabel}
          </span>
        </div>

        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-product text-sm font-bold leading-tight tracking-[-0.02em] text-white sm:text-base">
              S/ {product.price.toFixed(2)}
            </span>
            {isOutOfService ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/[0.07] px-2 py-1 font-sans text-[9px] font-medium text-white/45">
                Sin stock
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                onMouseEnter={onHover}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 font-sans text-[9px] font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.97] sm:min-h-0"
                aria-label={
                  justAdded
                    ? `${product.name} agregado al carrito`
                    : `Agregar ${product.name} al carrito`
                }
              >
                {justAdded ? (
                  <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" aria-hidden="true" />
                ) : (
                  <ShoppingCart className="h-3 w-3" aria-hidden="true" />
                )}
                {stockLabel}
              </button>
            )}
          </div>

          <p className="mt-2 min-h-4 truncate font-sans text-[10px] font-medium leading-4 text-white/45">
            {footer}
          </p>
        </div>
      </div>
    </article>
  );
}

/** Silueta que replica la tarjeta para que el catálogo no salte durante la carga inicial. */
export function ProductCatalogCardSkeleton() {
  return (
    <article
      className="flex min-h-[27rem] flex-col overflow-hidden rounded-xl border border-border bg-card"
      role="status"
      aria-label="Cargando producto"
    >
      <Skeleton className="aspect-square shrink-0 rounded-none bg-white/[0.08]" />
      <div className="flex flex-1 flex-col p-3 sm:p-3.5">
        <div className="flex h-7 items-center gap-2">
          <Skeleton className="h-6 w-6 rounded-full bg-white/[0.08]" />
          <Skeleton className="h-2.5 w-24 bg-white/[0.08]" />
          <Skeleton className="ml-auto h-7 w-7 rounded-lg bg-white/[0.08]" />
        </div>
        <Skeleton className="mt-2 h-4 w-4/5 bg-white/[0.08]" />
        <Skeleton className="mt-1 h-4 w-3/5 bg-white/[0.08]" />
        <div className="mt-2 flex gap-1.5">
          <Skeleton className="h-5 w-14 rounded-md bg-white/[0.08]" />
          <Skeleton className="h-5 w-12 rounded-md bg-white/[0.08]" />
        </div>
        <div className="mt-auto border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 bg-white/[0.08]" />
            <Skeleton className="h-6 w-16 rounded-md bg-white/[0.08]" />
          </div>
          <Skeleton className="mt-2 h-2.5 w-3/5 bg-white/[0.08]" />
        </div>
      </div>
      <span className="sr-only">Cargando producto</span>
    </article>
  );
}
