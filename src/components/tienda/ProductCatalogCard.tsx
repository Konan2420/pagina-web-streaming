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
    <article className="product-card catalog-product-card group flex h-auto flex-row overflow-hidden rounded-xl border border-border bg-card sm:flex-col">
      <div className="relative aspect-square w-[44%] shrink-0 self-start overflow-hidden bg-background sm:aspect-[4/3] sm:w-auto sm:self-auto">
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
            data-cmd-fixed-contrast={product.isRenewable === false ? "" : undefined}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] text-white shadow-sm ring-1 ring-white/15 sm:px-1.5 sm:py-0.5 sm:text-[8px] ${
              product.isRenewable === false ? "bg-slate-700/95" : "bg-emerald-500/95"
            }`}
          >
            <RefreshCw className="h-3 w-3" aria-hidden="true" />
            {product.isRenewable === false ? "No renovable" : "Renovable"}
          </span>
        </div>
        <div className="pointer-events-none absolute right-2 top-2">
          <span className="cmd-on-accent rounded-md bg-primary px-2 py-1 font-sans text-[9px] font-semibold uppercase tracking-[0.06em] shadow-sm ring-1 ring-white/15 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
            {product.duracion}
          </span>
        </div>

        {isOutOfService && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-8 items-center justify-center bg-destructive px-2 font-sans text-[10px] font-bold uppercase tracking-[0.08em] text-white sm:h-7 sm:text-[9px]">
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
          <span
            data-cmd-fixed-contrast
            className="rounded-lg border border-white/15 bg-black/70 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-transform duration-300 sm:translate-y-2 sm:group-hover:translate-y-0"
          >
            Ver detalles
          </span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-2.5">
        <div className="flex min-h-6 items-center gap-1.5 sm:min-h-6 sm:gap-1.5">
          <div className="flex min-w-0 items-center gap-1">
            <span
              aria-hidden="true"
              data-cmd-fixed-contrast
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-brand to-blue-950 text-[7px] font-black text-white sm:h-5 sm:w-5"
            >
              {initials(sellerName)}
            </span>
            <span className="truncate font-sans text-[9px] font-semibold tracking-[0.01em] text-white/85 sm:text-[9px]">
              {sellerName}
            </span>
            <BadgeCheck
              className="h-3 w-3 shrink-0 text-sky-400"
              aria-label="Vendedor verificado"
            />
          </div>
          {product.iconId ? (
            <PlatformIconMark
              iconId={product.iconId}
              className="ml-auto h-6 w-6 shrink-0 rounded-lg border border-white/20 shadow-md"
              iconClassName="h-3 w-3"
            />
          ) : (
            <span className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/[0.06] text-white/55">
              <Package className="h-3 w-3" aria-hidden="true" />
            </span>
          )}
        </div>

        <h3 className="catalog-product-title mt-1 line-clamp-2 font-product text-[13px] font-bold leading-[1.3] tracking-[-0.015em] text-white transition-colors duration-200 sm:text-[13px] sm:leading-[1.2]">
          {product.name}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-1 font-sans text-[8px] font-medium text-white/80 sm:gap-1 sm:text-[8px]">
          <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/[0.055] px-1.5 py-1 leading-none sm:px-1 sm:py-0.5">
            {accountTypeLabel === "Perfil" ? (
              <UserRound className="h-3 w-3 text-white/70" aria-hidden="true" />
            ) : (
              <CircleCheck className="h-3 w-3 text-emerald-300" aria-hidden="true" />
            )}
            {accountTypeLabel}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-white/12 bg-white/[0.055] px-1.5 py-1 leading-none sm:px-1 sm:py-0.5">
            <Globe2 className="h-3 w-3 text-sky-300" aria-hidden="true" />
            {accessScopeLabel}
          </span>
        </div>

        <div className="mt-3 border-t border-border pt-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-product text-sm font-bold leading-tight tracking-[-0.02em] text-white sm:text-[15px]">
              S/ {product.price.toFixed(2)}
            </span>
            {isOutOfService ? (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-white/[0.07] px-2 py-1 font-sans text-[9px] font-medium text-white/45 sm:px-1.5 sm:py-0.5 sm:text-[8px]">
                Sin stock
              </span>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                onMouseEnter={onHover}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-md bg-emerald-500 px-2 py-1 font-sans text-[9px] font-semibold text-emerald-950 shadow-sm shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.97] sm:min-h-0 sm:px-1.5 sm:py-0.5 sm:text-[8px]"
                aria-label={
                  justAdded
                    ? `${product.name} agregado al carrito`
                    : `Agregar ${product.name} al carrito`
                }
              >
                {justAdded ? (
                  <Check
                    className="h-3 w-3 animate-in zoom-in-50 duration-200"
                    aria-hidden="true"
                  />
                ) : (
                  <ShoppingCart className="h-3 w-3" aria-hidden="true" />
                )}
                {stockLabel}
              </button>
            )}
          </div>

          <p className="mt-1 truncate font-sans text-[9px] font-medium leading-3 text-white/45 sm:text-[9px] sm:leading-3">
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
      className="flex h-auto flex-row overflow-hidden rounded-xl border border-border bg-card sm:flex-col"
      role="status"
      aria-label="Cargando producto"
    >
      <Skeleton className="aspect-square w-[44%] shrink-0 self-start rounded-none bg-white/[0.08] sm:aspect-[4/3] sm:w-full sm:self-auto" />
      <div className="flex min-w-0 flex-1 flex-col p-2.5">
        <div className="flex h-6 items-center gap-1.5">
          <Skeleton className="h-5 w-5 rounded-full bg-white/[0.08]" />
          <Skeleton className="h-2.5 w-20 bg-white/[0.08]" />
          <Skeleton className="ml-auto h-6 w-6 rounded-lg bg-white/[0.08]" />
        </div>
        <Skeleton className="mt-1 h-3.5 w-4/5 bg-white/[0.08]" />
        <Skeleton className="mt-1 h-3.5 w-3/5 bg-white/[0.08]" />
        <div className="mt-1 flex gap-1">
          <Skeleton className="h-5 w-14 rounded-md bg-white/[0.08]" />
          <Skeleton className="h-5 w-12 rounded-md bg-white/[0.08]" />
        </div>
        <div className="mt-3 border-t border-border pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 bg-white/[0.08]" />
            <Skeleton className="h-11 w-16 rounded-md bg-white/[0.08] sm:h-5" />
          </div>
          <Skeleton className="mt-1 h-2.5 w-3/5 bg-white/[0.08]" />
        </div>
      </div>
      <span className="sr-only">Cargando producto</span>
    </article>
  );
}
