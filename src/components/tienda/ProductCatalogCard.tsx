import {
  BadgeCheck,
  Check,
  Clock3,
  Globe2,
  KeyRound,
  Layers,
  Package,
  Pencil,
  RefreshCw,
  ShoppingCart,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type {
  AccountType,
  AccessScope,
  DeliveryType,
  Product,
  ProductStock,
  ScopeType,
} from "./data";
import { countryFlag, countryLabel } from "./data";
import { PlatformIconMark } from "@/lib/platformIcons";
import { ProductImage } from "@/components/ProductImage";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinuteTick } from "@/hooks/useMinuteTick";
import { getPremiumCardClasses } from "./premium-card-effects";
import { PremiumElectricLayers } from "./PremiumElectricLayers";
import { getCategoryLabel } from "./catalog-taxonomy";

type ProductCatalogCardProps = {
  product: Product & {
    isRenewable?: boolean;
    /** `null`/`undefined` = sin dato reconocido; el chip no se pinta. */
    accountType?: AccountType | null;
    accessScope?: AccessScope | null;
    deliveryType?: DeliveryType | null;
    scopeType?: ScopeType | null;
    scopeCountry?: string | null;
    publisherName?: string | null;
    isPublisherVerified?: boolean;
    isPremium?: boolean;
    premiumStyle?: string | null;
    totalSold?: number;
  };
  stock: ProductStock;
  lastSaleAt?: string | null;
  /** Unidades de este producto que ya están en el carrito del comprador. */
  quantityInCart?: number;
  /** Producto del propio proveedor que lo está mirando: se marca y ofrece su editor. */
  isMine?: boolean;
  /** Abre el editor de productos del proveedor. Solo se usa cuando `isMine`. */
  onManage?: () => void;
  onOpen: () => void;
  /** Devuelve `false` si el producto no llegó a entrar al carrito. */
  onAdd: () => boolean;
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
  quantityInCart = 0,
  isMine = false,
  onManage,
  onOpen,
  onAdd,
  onHover,
}: ProductCatalogCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "hace 3 min" caduca solo: sin este latido el pie se queda con el valor que
  // tenía cuando se montó la tarjeta y miente a los pocos minutos.
  useMinuteTick();

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const sellerName = product.publisherName?.trim() || "CMD Streaming";
  const premiumCardClasses = getPremiumCardClasses(product.isPremium, product.premiumStyle);
  const accountType = product.accountType ?? null;
  const accessScope = product.accessScope ?? null;
  const deliveryType = product.deliveryType ?? accountType ?? null;
  const scopeType =
    product.scopeType ?? (accessScope === "regional" ? "pais_especifico" : accessScope);
  const scopeCountry = product.scopeCountry ?? null;
  const isOutOfService = stock.status === "out-of-service";
  const isOutOfStock = stock.status === "out-of-stock";
  const isStockUnknown = stock.status === "unknown";
  const stockLabel = stock.count != null ? `${stock.count} Stock` : "En stock";
  // El tope del botón es "cuántas más puedo llevar": con el carrito ya cargado
  // el botón lo dice, y al llegar al tope se apaga en lugar de invitar a un clic
  // que el servidor va a rechazar.
  const remaining = stock.count === null ? null : Math.max(0, stock.count - quantityInCart);
  const atCartLimit = remaining === 0;
  const addLabel = quantityInCart > 0 ? `${stockLabel} · ${quantityInCart} en carrito` : stockLabel;
  const footer = lastSaleAt
    ? `Última compra · ${relativeTime(lastSaleAt)}`
    : "Sé el primero en comprar";

  const handleAdd = () => {
    if (stock.status !== "available" || atCartLimit) return;
    // El visto verde se enciende solo si el producto entró de verdad al carrito:
    // sin sesión, sin stock o con el tope alcanzado `onAdd` devuelve `false`, y
    // celebrar una compra que no ocurrió es peor que no dar señales.
    if (!onAdd()) return;
    setJustAdded(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setJustAdded(false), 350);
  };

  return (
    <article
      className={`product-card catalog-product-card group flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-border/70 bg-card ${premiumCardClasses}`}
    >
      {premiumCardClasses && <PremiumElectricLayers />}
      <div className="cmd-premium-electric__media relative isolate aspect-[1.05] w-full shrink-0 overflow-hidden rounded-t-[7px]">
        {product.image && (
          <div
            aria-hidden="true"
            className="catalog-product-media-glow"
            style={{ backgroundImage: `url(${JSON.stringify(product.image)})` }}
          />
        )}
        <ProductImage
          src={product.image}
          alt={`Portada de ${product.name}`}
          className={`catalog-product-image cmd-product-image-fade pointer-events-none relative z-[1] h-full w-full object-contain transition-transform duration-500 motion-reduce:transition-none ${
            isOutOfService ? "opacity-65 saturate-75" : ""
          }`}
          fallback={
            <div className="relative z-[1] grid h-full w-full place-items-center">
              <Package className="h-10 w-10 text-white/10" aria-hidden="true" />
            </div>
          }
        />

        {/* Los distintivos van en su propia capa por encima del botón que cubre la
            imagen: si no, el velo oscuro del hover los apaga, y la franja roja de
            "Fuera de servicio" es un aviso de estado que debe leerse siempre. El
            contenedor es transparente al puntero, así que el clic sigue llegando
            al botón de debajo. */}
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-1.5 top-1.5">
            {/* El color del texto va en el mismo condicional que el del fondo: blanco sobre
                `emerald-500` se queda en ≈2,6:1 con texto de 8-9 px, por debajo del 4,5:1 que
                pide AA. Sobre el verde, el emparejamiento correcto es el texto oscuro que el
                botón de agregar ya usa. El atributo de contraste fijo se queda en la rama
                oscura, que es la única que necesita conservar el blanco en tema claro. */}
            <span
              data-cmd-fixed-contrast={product.isRenewable === false ? "" : undefined}
              className={`inline-flex items-center gap-1 whitespace-nowrap rounded-[4px] px-1.5 py-1 font-sans text-[9px] font-semibold uppercase leading-none tracking-[0.02em] shadow-sm ring-1 ring-white/15 sm:text-[10px] ${
                product.isRenewable === false
                  ? "bg-slate-700/95 text-white"
                  : "bg-emerald-500/95 text-emerald-950"
              }`}
            >
              {product.isRenewable === false ? (
                <>
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                </>
              ) : (
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
              )}
              {product.isRenewable === false ? "No renovable" : "Renovable"}
            </span>
          </div>
          <div className="absolute right-1.5 top-1.5">
            <span className="cmd-on-accent inline-flex whitespace-nowrap rounded-[4px] bg-destructive px-1.5 py-1 font-sans text-[9px] font-semibold uppercase leading-none tracking-[0.02em] text-white shadow-sm ring-1 ring-white/15 sm:text-[10px]">
              {product.duracion}
            </span>
          </div>

          {isOutOfService && (
            <div className="absolute inset-x-0 bottom-0 flex h-9 items-center justify-center bg-destructive px-2 font-sans text-[11px] font-bold uppercase tracking-[0.08em] text-white sm:h-9 sm:text-[12px]">
              Fuera de servicio
            </div>
          )}
        </div>

        {/* El velo y el cartel dependen de si el dispositivo tiene puntero fino, no
            del ancho: una tableta táctil supera los 640px pero no tiene hover, así
            que "Ver detalles" nunca aparecía. `styles.css` ya usa esta misma
            distinción para el realce de la tarjeta. */}
        <button
          type="button"
          onClick={onOpen}
          onMouseEnter={onHover}
          className="absolute inset-0 z-[2] grid place-items-center bg-black/10 transition duration-200 pointer-fine:bg-black/40 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100"
          aria-label={`Ver detalles de ${product.name}`}
        >
          <span
            data-cmd-fixed-contrast
            className="rounded-lg border border-white/15 bg-black/70 px-3 py-1.5 font-sans text-[10px] font-medium uppercase tracking-[0.1em] text-white backdrop-blur-sm transition-transform duration-300 pointer-fine:translate-y-2 pointer-fine:group-hover:translate-y-0"
          >
            Ver detalles
          </span>
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex min-h-7 items-center justify-between gap-1.5">
          <div className="flex min-w-0 items-center gap-1">
            <span
              aria-hidden="true"
              data-cmd-fixed-contrast
              className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-brand to-blue-950 text-[9px] font-black text-white"
            >
              {initials(sellerName)}
            </span>
            {/* `truncate` es inevitable en una columna de 10rem, pero el nombre
                recortado no se podía recuperar de ninguna forma: el título lo
                muestra entero al pasar el puntero y el detalle del producto ya lo
                enseña completo. */}
            <span
              title={sellerName}
              className="truncate font-sans text-[10px] font-semibold tracking-[0.01em] text-white/85 sm:text-[11px]"
            >
              {sellerName}
            </span>
            {/* Solo se acredita si el perfil comercial está verificado en la base
                de datos; no se asume por publicar en el catálogo. */}
            {product.isPublisherVerified === true && (
              <BadgeCheck
                className="h-3.5 w-3.5 shrink-0 text-sky-400"
                role="img"
                aria-label="Vendedor verificado"
              />
            )}
          </div>
          {product.iconId ? (
            <PlatformIconMark
              iconId={product.iconId}
              className="ml-auto h-7 w-7 shrink-0 rounded-md border border-white/20 shadow-sm"
              iconClassName="h-4 w-4"
            />
          ) : (
            <span className="ml-auto grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/15 bg-white/[0.06] text-white/55">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </div>

        <h3 className="catalog-product-title mt-1.5 line-clamp-2 min-h-[2.36em] font-product text-[13px] font-bold uppercase leading-[1.16] tracking-[-0.01em] text-foreground transition-colors duration-200 sm:text-[14px]">
          {product.name}
        </h3>

        <div className="mt-1 flex min-w-0 items-center justify-between gap-1 text-[10px] text-muted-foreground">
          <span className="truncate" title={getCategoryLabel(product.category)}>
            {getCategoryLabel(product.category)}
          </span>
          {product.isPremium && <span className="shrink-0 text-amber-300">Destacado</span>}
        </div>

        <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-1 font-sans text-[10px] font-medium text-white/80">
          {/* Este chip no es como los dos de abajo: no describe un dato que el vendedor
              declare al publicar, sino que el producto es de quien está mirando. Por eso es
              un botón que lleva a su editor y no una etiqueta. */}
          {isMine && (
            <button
              type="button"
              onClick={onManage}
              className="inline-flex min-h-6 items-center gap-1 rounded-[4px] border border-sky-400/40 bg-sky-400/[0.12] px-1.5 py-0.5 leading-none text-sky-100 transition hover:border-sky-300 hover:text-white"
            >
              <Pencil className="h-3 w-3" aria-hidden="true" />
              Tu producto
            </button>
          )}
          {/* Cada chip describe un valor que el vendedor declara al publicar. Sin
              dato no se pinta ninguno: un icono verde junto a "Completa" validaba
              una afirmación que nadie había hecho. */}
          {deliveryType && (
            <span className="inline-flex items-center gap-1 rounded-[4px] border border-white/12 bg-white/[0.055] px-1.5 py-0.5 leading-none">
              {deliveryType === "manual" ? (
                <KeyRound className="h-3 w-3 text-amber-200" aria-hidden="true" />
              ) : deliveryType === "perfil" ? (
                <UserRound className="h-3 w-3 text-white/70" aria-hidden="true" />
              ) : (
                <Layers className="h-3 w-3 text-white/70" aria-hidden="true" />
              )}
              {deliveryType === "manual"
                ? "Manual"
                : deliveryType === "perfil"
                  ? "Perfil"
                  : "Completa"}
            </span>
          )}
          {scopeType && (
            <span className="inline-flex items-center gap-1 rounded-[4px] border border-white/12 bg-white/[0.055] px-1.5 py-0.5 leading-none">
              <Globe2 className="h-3 w-3 text-sky-300" aria-hidden="true" />
              {scopeType === "global"
                ? "Global"
                : `${countryFlag(scopeCountry)} ${countryLabel(scopeCountry)}`}
            </span>
          )}
        </div>

        <div className="mt-auto pt-2">
          {/* El precio permanece completo y el estado conserva una sola fila;
              si es largo, se trunca visualmente y sigue completo para lectores. */}
          <div className="flex min-w-0 items-center justify-between gap-1.5">
            <span className="shrink-0 whitespace-nowrap font-product text-[15px] font-bold leading-tight tracking-[-0.02em] text-white sm:text-[16px]">
              S/ {product.price.toFixed(2)}
            </span>
            {isOutOfService ? (
              // La franja roja de la imagen ya dice "Fuera de servicio": aquí solo
              // se ocupa el sitio del botón sin afirmar nada sobre las unidades.
              <span
                title="El vendedor retiró este producto de la venta."
                className="ml-auto min-w-0 max-w-[57%] truncate rounded-[4px] bg-white/[0.07] px-1.5 py-1 font-sans text-[10px] font-medium text-white/55"
              >
                No disponible
              </span>
            ) : isOutOfStock ? (
              <span className="ml-auto min-w-0 max-w-[57%] truncate rounded-[4px] bg-white/[0.07] px-1.5 py-1 font-sans text-[10px] font-medium text-white/55">
                Sin stock
              </span>
            ) : isStockUnknown ? (
              // Estado transitorio o de error de la consulta de stock: no se puede
              // comprar todavía, pero el producto no está agotado.
              <button
                type="button"
                disabled
                title="No pudimos comprobar el stock. Reintenta en un momento."
                aria-label={`Sin dato: no pudimos comprobar el stock de ${product.name}`}
                className="ml-auto min-h-8 min-w-0 max-w-[57%] truncate rounded-[4px] bg-white/[0.07] px-1.5 py-1 font-sans text-[10px] font-medium text-white/55"
              >
                Sin dato
              </button>
            ) : atCartLimit ? (
              // Ya tiene todo el stock disponible en el carrito: el botón se
              // apaga en vez de dejar que el clic acabe en un error.
              <button
                type="button"
                disabled
                title={`Ya tienes las ${quantityInCart} unidades disponibles de este producto en el carrito.`}
                aria-label={`En el carrito: ya tienes las ${quantityInCart} unidades disponibles de ${product.name}`}
                className="ml-auto min-h-8 min-w-0 max-w-[57%] truncate rounded-[4px] bg-white/[0.07] px-1.5 py-1 font-sans text-[10px] font-medium text-white/55"
              >
                En el carrito
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                onMouseEnter={onHover}
                className="ml-auto inline-flex min-h-8 min-w-0 max-w-[57%] items-center gap-1 rounded-[4px] bg-emerald-500 px-1.5 py-1 font-sans text-[10px] font-semibold text-emerald-950 shadow-sm shadow-emerald-500/25 transition hover:brightness-110 active:scale-[0.97]"
                // El nombre accesible empieza por el texto visible ("5 Stock",
                // "5 Stock · 2 en carrito"): quien navega por voz dice lo que ve,
                // y un `aria-label` que no lo contenga rompe ese control (WCAG
                // 2.5.3). La confirmación de la compra ya la anuncia el aviso
                // emergente, así que la etiqueta no cambia al agregar.
                aria-label={`${addLabel}: agregar ${product.name} al carrito`}
              >
                {justAdded ? (
                  <Check
                    className="h-3 w-3 shrink-0 animate-in zoom-in-50 duration-200"
                    aria-hidden="true"
                  />
                ) : (
                  <ShoppingCart className="h-3 w-3 shrink-0" aria-hidden="true" />
                )}
                <span className="min-w-0 truncate" title={addLabel}>
                  {addLabel}
                </span>
              </button>
            )}
          </div>

          <p
            title={footer}
            className="mt-1.5 truncate font-sans text-[10px] font-medium leading-3 text-white/55"
          >
            {footer}
          </p>
          {typeof product.totalSold === "number" && product.totalSold > 0 && (
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {product.totalSold} venta{product.totalSold === 1 ? "" : "s"}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Silueta que replica la tarjeta para que el catálogo no salte durante la carga inicial.
 *
 * Es puramente decorativa: con `role="status"` cada una de las doce tarjetas era una
 * región viva propia —doce anuncios simultáneos de "Cargando producto", y encima
 * duplicados, porque el `aria-label` y el texto `sr-only` decían lo mismo—. El aviso
 * de carga lo da ahora una sola región viva en el contador de resultados.
 */
export function ProductCatalogCardSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-[8px] border border-border/70 bg-card"
    >
      <Skeleton className="aspect-[1.05] w-full shrink-0 rounded-none bg-white/[0.08]" />
      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <div className="flex h-7 items-center gap-1.5">
          <Skeleton className="h-[26px] w-[26px] rounded-full bg-white/[0.08]" />
          <Skeleton className="h-2.5 w-20 bg-white/[0.08]" />
          <Skeleton className="ml-auto h-7 w-7 rounded-md bg-white/[0.08]" />
        </div>
        <Skeleton className="mt-1 h-3.5 w-4/5 bg-white/[0.08]" />
        <Skeleton className="mt-1 h-3.5 w-3/5 bg-white/[0.08]" />
        <div className="mt-1 flex gap-1">
          <Skeleton className="h-5 w-14 rounded-md bg-white/[0.08]" />
          <Skeleton className="h-5 w-12 rounded-md bg-white/[0.08]" />
        </div>
        <div className="mt-auto pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16 bg-white/[0.08]" />
            <Skeleton className="h-8 w-16 rounded-md bg-white/[0.08]" />
          </div>
          <Skeleton className="mt-1 h-2.5 w-3/5 bg-white/[0.08]" />
        </div>
      </div>
    </article>
  );
}
