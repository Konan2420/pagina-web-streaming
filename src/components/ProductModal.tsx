import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Eye,
  Loader2,
  MessageCircle,
  PencilLine,
  Plus,
  RefreshCw,
  Share2,
  ShoppingCart,
  Store,
  TicketCheck,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { inviteCatalogOrderClient } from "@/lib/catalog-detail.functions";
import { saveStorefrontOverride } from "@/lib/storefront.functions";
import { supabase } from "@/integrations/supabase/client";

export type ProductDetail = {
  id: string;
  name: string;
  price: number;
  category: string;
  duracion: string;
  descripcion_larga: string;
  horario_atencion_inicio: string;
  horario_atencion_fin: string;
  whatsapp_contacto: string;
  image?: string;
  iconId?: string | null;
  shortLabel?: string;
  description?: string;
};

type ProductModalProps = {
  product: ProductDetail | null;
  onClose: () => void;
  onLoginRequired: () => void;
  isAuthenticated: boolean;
  userId?: string;
  isRoleLoading?: boolean;
  isAdmin?: boolean;
  isProvider?: boolean;
  isDistributor?: boolean;
  stockAvailable?: boolean;
  stockCount?: number | null;
  totalSold?: number;
  viewCount?: number;
  publisherName?: string | null;
  isRenewable?: boolean;
  onOrderCreated?: () => void | Promise<void>;
};

type CatalogClient = {
  id: string;
  nombre_completo: string | null;
  whatsapp: string | null;
};

type CatalogPurchaseContext = {
  isAvailable: boolean;
  supplierName: string | null;
  supplierWhatsapp: string | null;
  storeSlug: string | null;
  defaultMarkupPercent: number;
  suggestedSalePricePen: number | null;
  walletDebitPen: number;
  walletDebitUsd: number;
  publicSalePricePen: number;
  unitCostPen: number | null;
  durationDays: number | null;
  isRenewable: boolean | null;
};

function money(value: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function digits(value: string | null | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function clientLabel(client: CatalogClient) {
  return client.nombre_completo?.trim() || "Cliente sin nombre";
}

/** PDP única del catálogo: la base de datos, no el navegador, decide rol, cobro y destinatario. */
export function ProductModal({
  product,
  onClose,
  onLoginRequired,
  isAuthenticated,
  userId,
  isRoleLoading = false,
  isAdmin = false,
  isProvider = false,
  isDistributor = false,
  stockAvailable = true,
  stockCount = null,
  totalSold = 0,
  viewCount = 0,
  publisherName,
  isRenewable = true,
  onOrderCreated,
}: ProductModalProps) {
  const queryClient = useQueryClient();
  const inviteClient = useServerFn(inviteCatalogOrderClient);
  const addToStorefront = useServerFn(saveStorefrontOverride);
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [autoRenew, setAutoRenew] = useState(false);
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientWhatsapp, setNewClientWhatsapp] = useState("");
  const [creatingClient, setCreatingClient] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [addingToStore, setAddingToStore] = useState(false);
  const [displayedViewCount, setDisplayedViewCount] = useState(viewCount);
  const canResell = isAuthenticated && !isRoleLoading && (isAdmin || isProvider || isDistributor);

  const purchaseContextQuery = useQuery({
    queryKey: ["catalog-purchase-context", product?.id, userId],
    queryFn: async (): Promise<CatalogPurchaseContext> => {
      const { data, error } = await supabase.rpc("get_catalog_purchase_context", {
        p_product_id: product!.id,
      });
      if (error) throw error;
      return data as CatalogPurchaseContext;
    },
    enabled: Boolean(product?.id && isAuthenticated && !isRoleLoading),
    staleTime: 30_000,
    retry: 2,
  });
  const clientsQuery = useQuery({
    queryKey: ["catalog-order-clients", userId],
    queryFn: async (): Promise<CatalogClient[]> => {
      const { data, error } = await supabase.rpc("get_catalog_order_clients");
      if (error) throw error;
      return data as CatalogClient[];
    },
    enabled: Boolean(product?.id && isAuthenticated && !isRoleLoading),
    staleTime: 30_000,
    retry: 2,
  });

  const purchaseContext = purchaseContextQuery.data;
  const clients = clientsQuery.data ?? [];
  const effectiveRenewable = purchaseContext?.isRenewable ?? isRenewable;
  const filteredClients = useMemo(() => {
    const normalized = clientSearch.trim().toLocaleLowerCase("es");
    if (!normalized) return clients;
    return clients.filter((client) =>
      [client.nombre_completo, client.whatsapp]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase("es").includes(normalized)),
    );
  }, [clientSearch, clients]);

  useEffect(() => {
    if (!product) return;
    setClientId("");
    setClientSearch("");
    setSalePrice("");
    setAutoRenew(false);
    setShowNewClient(false);
    setNewClientName("");
    setNewClientEmail("");
    setNewClientWhatsapp("");
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    setDisplayedViewCount(viewCount);
    void Promise.resolve(supabase.rpc("record_catalog_product_view", { p_product_id: product.id }))
      .then(({ data, error }) => {
        if (!error && typeof data === "number") setDisplayedViewCount(data);
      })
      .catch(() => undefined);
  }, [product?.id, viewCount]);

  useEffect(() => {
    if (!isAuthenticated || !userId || !clients.length || clientId) return;
    const ownClient = clients.find((client) => client.id === userId);
    setClientId(ownClient?.id ?? clients[0]?.id ?? "");
  }, [clientId, clients, isAuthenticated, userId]);

  useEffect(() => {
    if (!canResell || salePrice || !purchaseContext?.suggestedSalePricePen) return;
    setSalePrice(purchaseContext.suggestedSalePricePen.toFixed(2));
  }, [canResell, purchaseContext?.suggestedSalePricePen, salePrice]);

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, product]);

  if (!product) return null;

  const actualSalePrice = canResell
    ? Number(salePrice)
    : (purchaseContext?.publicSalePricePen ?? product.price);
  const unitCost = purchaseContext?.unitCostPen ?? 0;
  const profit = canResell && Number.isFinite(actualSalePrice) ? actualSalePrice - unitCost : 0;
  const salePriceValid =
    !canResell || (Number.isFinite(actualSalePrice) && actualSalePrice >= unitCost);
  // Nunca asumimos que una cuenta es cliente final mientras se resuelve el
  // contexto seguro del servidor. Antes, un error dejaba `purchaseContext`
  // como undefined y por ello mostraba por accidente la interfaz simplificada.
  const isPurchaseContextLoading =
    isAuthenticated && (isRoleLoading || purchaseContextQuery.isLoading);
  const hasPurchaseContextError = isAuthenticated && purchaseContextQuery.isError;
  const hasClientsError = isAuthenticated && clientsQuery.isError;
  const isPurchaseLoading = isPurchaseContextLoading || (isAuthenticated && clientsQuery.isLoading);
  const isProductAvailable = stockAvailable && purchaseContext?.isAvailable !== false;
  const effectiveSupplierName =
    purchaseContext?.supplierName || publisherName?.trim() || "CMD Streaming";
  const whatsappDigits = digits(purchaseContext?.supplierWhatsapp || product.whatsapp_contacto);
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Hola ${effectiveSupplierName}, tengo una consulta sobre ${product.name}.`)}`
    : null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: `Mira ${product.name} en CMD Streaming.`,
          url: window.location.href,
        });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace del producto copiado.");
    } catch (error) {
      if ((error as Error | undefined)?.name !== "AbortError")
        toast.error("No se pudo compartir el producto.");
    }
  };

  const createClient = async () => {
    if (!newClientName.trim()) {
      toast.error("Indica el nombre del cliente.");
      return;
    }
    setCreatingClient(true);
    try {
      const result = await inviteClient({
        data: {
          nombreCompleto: newClientName,
          email: newClientEmail,
          whatsapp: newClientWhatsapp,
        },
      });
      await clientsQuery.refetch();
      setClientId(result.client.id);
      setShowNewClient(false);
      setNewClientName("");
      setNewClientEmail("");
      setNewClientWhatsapp("");
      toast.success(result.created ? "Cliente registrado." : "Cliente seleccionado.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el cliente.");
    } finally {
      setCreatingClient(false);
    }
  };

  const addProductToMyStore = async () => {
    if (!isAuthenticated) return onLoginRequired();
    if (!canResell || !purchaseContext) return;
    setAddingToStore(true);
    try {
      await addToStorefront({
        data: {
          sourceType: "master_catalog",
          sourceId: product.id,
          salePricePen: Number.isFinite(actualSalePrice)
            ? Math.max(actualSalePrice, purchaseContext.suggestedSalePricePen ?? actualSalePrice)
            : purchaseContext.suggestedSalePricePen,
          isVisible: true,
        },
      });
      void queryClient.invalidateQueries({ queryKey: ["storefront-management"] });
      toast.success(
        "Producto añadido y publicado en Mi Tienda. Puedes ajustar su precio y posición.",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo añadir a tu tienda.");
    } finally {
      setAddingToStore(false);
    }
  };

  const confirmOrder = async () => {
    if (!isAuthenticated) return onLoginRequired();
    if (hasPurchaseContextError || !purchaseContext) {
      toast.error("No se pudieron cargar los datos de compra. Reintenta antes de confirmar.");
      return;
    }
    if (hasClientsError) {
      toast.error("No se pudo cargar la lista de clientes. Reintenta antes de confirmar.");
      return;
    }
    if (!purchaseContext || isPurchaseLoading) {
      toast.error("Estamos preparando el detalle del pedido. Intenta en un instante.");
      return;
    }
    if (!isProductAvailable) return toast.error("Este producto ya no está disponible.");
    if (!clientId) return toast.error("Selecciona un cliente antes de confirmar.");
    if (!salePriceValid)
      return toast.error(`El precio de venta debe cubrir al menos ${money(unitCost)}.`);

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("place_catalog_order_from_wallet", {
        p_product_id: product.id,
        p_client_id: clientId,
        p_sale_price_pen: canResell ? actualSalePrice : 0,
        p_auto_renew: effectiveRenewable && autoRenew,
      });
      if (error) throw error;
      const result = data?.[0];
      if (!result) throw new Error("No se pudo crear el pedido.");
      void queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-movements"] });
      void queryClient.invalidateQueries({ queryKey: ["public-products"] });
      toast.success(
        `Pedido confirmado. Se descontó ${money(Number(result.charged_pen))} de tu billetera.`,
      );
      await onOrderCreated?.();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo confirmar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
      <section
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-[96rem] flex-col overflow-hidden rounded-xl border border-sky-200/15 bg-popover shadow-[0_20px_90px_rgba(0,0,0,0.6)] sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar detalle de producto"
          className="absolute right-3 top-3 z-20 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/55 text-white/75 transition hover:border-white/35 hover:text-white sm:h-9 sm:w-9"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain cmd-dark-scrollbar">
          <header className="border-b border-white/[0.07] px-5 pb-4 pt-7 text-center sm:px-8 sm:pt-8">
            <h2
              id="product-modal-title"
              className="font-product text-xl font-bold text-white sm:text-2xl"
            >
              {product.name}
            </h2>
            <p className="mt-1 text-sm text-slate-300/80">
              Formulario para comprar o ver opciones del producto
            </p>
          </header>
          <div className="mx-auto w-full max-w-[76rem] px-5 pb-8 pt-5 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 border-b border-white/[0.07] pb-4">
              <div className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-white">
                <span className="text-white/72">Proveedor:</span>
                <span className="truncate">{effectiveSupplierName}</span>
                <BadgeCheck
                  className="h-4 w-4 shrink-0 text-sky-400"
                  aria-label="Proveedor verificado"
                />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="h-4 w-4" /> {displayedViewCount}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <TicketCheck className="h-4 w-4" /> {totalSold}
                </span>
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-300 transition hover:text-emerald-200"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-white/35">
                    <MessageCircle className="h-4 w-4" /> Sin contacto
                  </span>
                )}
                {purchaseContext?.storeSlug ? (
                  <a
                    href={`/tienda-publica/${purchaseContext.storeSlug}`}
                    className="inline-flex items-center gap-1.5 transition hover:text-white"
                  >
                    <Store className="h-4 w-4" /> Tienda
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-white/45">
                    <Store className="h-4 w-4" /> Tienda
                  </span>
                )}
                {canResell && (
                  <span className="inline-flex items-center gap-1.5">
                    <UsersRound className="h-4 w-4" /> Cliente
                  </span>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white ${isProductAvailable ? "bg-emerald-500" : "bg-slate-700"}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />{" "}
                {stockCount == null ? "Stock disponible" : `${stockCount} Stock`}
              </span>
              <span className="rounded-md bg-primary px-2.5 py-1 text-xs font-bold text-white">
                {product.duracion}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-white ${effectiveRenewable ? "bg-emerald-500" : "bg-slate-700"}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />{" "}
                {effectiveRenewable ? "Renovable" : "No renovable"}
              </span>
            </div>
            <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,0.95fr)_minmax(23rem,1fr)] lg:items-start">
              <div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={`Portada de ${product.name}`}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-square place-items-center bg-white/[0.03] text-sm text-white/45">
                      Sin imagen del producto
                    </div>
                  )}
                </div>
                <p className="mt-4 font-product text-2xl font-bold text-white">
                  👉 {money(actualSalePrice)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleShare()}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-sky-200/20 bg-sky-100/[0.04] px-3 text-xs font-semibold text-white transition hover:bg-sky-100/[0.09] sm:h-10"
                  >
                    <Share2 className="h-4 w-4" /> Compartir
                  </button>
                  {canResell && (
                    <button
                      type="button"
                      disabled={addingToStore}
                      onClick={() => void addProductToMyStore()}
                      className="inline-flex h-11 items-center gap-2 rounded-lg border border-sky-200/20 bg-sky-100/[0.04] px-3 text-xs font-semibold text-white transition hover:bg-sky-100/[0.09] disabled:opacity-60 sm:h-10"
                    >
                      {addingToStore ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}{" "}
                      Añadir a mi tienda
                    </button>
                  )}
                </div>
                <details
                  className="mt-4 rounded-lg border border-sky-200/20 bg-sky-100/[0.035] p-4"
                  open
                >
                  <summary className="cursor-pointer text-sm font-semibold text-white">
                    Descripción y condiciones de uso
                  </summary>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-300/85">
                    {product.descripcion_larga ||
                      product.description ||
                      "Sin condiciones adicionales."}
                  </p>
                </details>
              </div>
              <div className="space-y-5 rounded-xl border border-sky-200/15 bg-[#0b1424]/85 p-4 sm:p-5">
                {!isAuthenticated ? (
                  <div className="rounded-lg border border-sky-200/15 bg-sky-100/[0.04] p-4">
                    <p className="text-sm font-semibold text-white">Inicia sesión para comprar</p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300/75">
                      Usaremos tu billetera CMD y entregaremos la cuenta en Mis compras.
                    </p>
                  </div>
                ) : isPurchaseContextLoading ? (
                  <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-white/60">
                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando opciones de compra…
                  </div>
                ) : hasPurchaseContextError || !purchaseContext ? (
                  <div
                    role="alert"
                    className="rounded-lg border border-red-400/35 bg-red-500/[0.06] p-4"
                  >
                    <p className="text-sm font-bold text-white">
                      No se pudieron cargar los datos de compra
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-300/80">
                      Tu sesión sigue activa. Reintentaremos la consulta segura del producto.
                    </p>
                    <button
                      type="button"
                      onClick={() => void purchaseContextQuery.refetch()}
                      className="mt-3 inline-flex h-11 items-center rounded-md border border-red-300/30 px-3 text-xs font-bold text-red-100 transition hover:bg-red-500/10 sm:h-9"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : canResell ? (
                  <>
                    {hasClientsError && (
                      <div
                        role="alert"
                        className="rounded-lg border border-amber-300/30 bg-amber-400/[0.07] p-3 text-xs leading-relaxed text-amber-50"
                      >
                        <p className="font-bold">No se pudo cargar la lista de clientes.</p>
                        <button
                          type="button"
                          onClick={() => void clientsQuery.refetch()}
                          className="mt-2 font-bold underline underline-offset-2 hover:text-white"
                        >
                          Reintentar
                        </button>
                      </div>
                    )}
                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <label className="text-sm font-bold text-white">Cliente</label>
                        <button
                          type="button"
                          onClick={() => setShowNewClient((value) => !value)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Crear cliente
                        </button>
                      </div>
                      <input
                        value={clientSearch}
                        onChange={(event) => setClientSearch(event.target.value)}
                        placeholder="Buscar cliente…"
                        className="mb-2 h-11 w-full rounded-lg border border-sky-200/15 bg-[#101d33] px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-sky-300/50"
                      />
                      <div className="relative">
                        <select
                          value={clientId}
                          onChange={(event) => setClientId(event.target.value)}
                          className="h-11 w-full appearance-none rounded-lg border border-sky-200/15 bg-[#101d33] px-3 pr-9 text-sm text-white outline-none focus:border-sky-300/50"
                        >
                          <option value="">Buscar o crear cliente…</option>
                          {filteredClients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {clientLabel(client)}
                              {client.whatsapp ? ` · ${client.whatsapp}` : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                    {showNewClient && (
                      <div className="space-y-3 rounded-lg border border-sky-200/15 bg-black/20 p-3.5">
                        <p className="text-xs font-bold uppercase tracking-wide text-sky-200">
                          Registrar cliente
                        </p>
                        <input
                          value={newClientName}
                          onChange={(event) => setNewClientName(event.target.value)}
                          placeholder="Nombre completo"
                          className="h-10 w-full rounded-md border border-white/10 bg-[#101d33] px-3 text-sm text-white outline-none focus:border-sky-300/50"
                        />
                        <input
                          value={newClientEmail}
                          onChange={(event) => setNewClientEmail(event.target.value)}
                          type="email"
                          placeholder="Correo (opcional)"
                          className="h-10 w-full rounded-md border border-white/10 bg-[#101d33] px-3 text-sm text-white outline-none focus:border-sky-300/50"
                        />
                        <input
                          value={newClientWhatsapp}
                          onChange={(event) => setNewClientWhatsapp(event.target.value)}
                          placeholder="WhatsApp (opcional)"
                          className="h-10 w-full rounded-md border border-white/10 bg-[#101d33] px-3 text-sm text-white outline-none focus:border-sky-300/50"
                        />
                        <button
                          type="button"
                          disabled={creatingClient}
                          onClick={() => void createClient()}
                          className="inline-flex h-10 items-center gap-2 rounded-md bg-sky-500 px-3 text-xs font-bold text-slate-950 disabled:opacity-60"
                        >
                          {creatingClient ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}{" "}
                          Guardar cliente
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="mb-2 block text-sm font-bold text-white">
                        Precio al cual lo vas a vender
                      </label>
                      <div className="flex overflow-hidden rounded-lg border border-sky-200/15 bg-[#101d33] focus-within:border-sky-300/50">
                        <span className="flex items-center px-3 text-sm font-semibold text-slate-300">
                          PEN
                        </span>
                        <input
                          value={salePrice}
                          onChange={(event) => setSalePrice(event.target.value)}
                          inputMode="decimal"
                          type="number"
                          min={unitCost}
                          step="0.01"
                          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            purchaseContext?.suggestedSalePricePen &&
                            setSalePrice(purchaseContext.suggestedSalePricePen.toFixed(2))
                          }
                          className="inline-flex items-center gap-1 px-3 text-xs font-semibold text-sky-200 hover:text-white"
                        >
                          <PencilLine className="h-3.5 w-3.5" /> Sugerir precio
                        </button>
                      </div>
                      <p
                        className={`mt-2 text-sm ${profit >= 0 ? "text-slate-200" : "text-red-300"}`}
                      >
                        Tu ganancia será de{" "}
                        <span className="font-bold text-white">{money(Math.max(0, profit))}</span>
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Sugerido con margen estándar de{" "}
                        {purchaseContext?.defaultMarkupPercent ?? 20}%.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-sky-200/15 bg-sky-100/[0.04] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-200">
                      Precio final
                    </p>
                    <p className="mt-1 font-product text-3xl font-bold text-white">
                      {money(purchaseContext?.publicSalePricePen ?? product.price)}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300/75">
                      La compra se asignará a tu propia cuenta y las credenciales aparecerán en Mis
                      compras.
                    </p>
                  </div>
                )}
                {effectiveRenewable && (
                  <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-sky-200/15 bg-sky-100/[0.035] p-4">
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-white">
                        <RefreshCw className="h-4 w-4 text-primary" /> Auto-Renovación{" "}
                        <em className="rounded bg-primary/15 px-1.5 py-0.5 text-xs not-italic text-primary">
                          Opcional
                        </em>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-300/75">
                        Renueva este servicio automáticamente 3 días antes de expirar debitando de
                        tu saldo.
                      </span>
                    </span>
                    <input
                      checked={autoRenew}
                      onChange={(event) => setAutoRenew(event.target.checked)}
                      type="checkbox"
                      className="h-5 w-5 shrink-0 accent-primary"
                    />
                  </label>
                )}
                <div className="rounded-lg border border-red-400/30 bg-red-500/[0.045] p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-white">
                    <CircleAlert className="h-4 w-4 text-red-400" /> Confirmación de Pedido
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300/85">
                    Al confirmar, se creará un pedido de 1 unidad y se descontará{" "}
                    <span className="font-semibold text-red-200">
                      USD {(purchaseContext?.walletDebitUsd ?? 0).toFixed(2)} (≈{" "}
                      {money(purchaseContext?.walletDebitPen ?? product.price)})
                    </span>{" "}
                    de tu saldo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <footer className="border-t border-white/[0.08] bg-popover p-3 sm:px-8 sm:py-4">
          <div className="mx-auto max-w-[76rem]">
            <button
              type="button"
              onClick={() => void confirmOrder()}
              disabled={
                submitting ||
                !isProductAvailable ||
                isPurchaseLoading ||
                hasPurchaseContextError ||
                hasClientsError ||
                !purchaseContext
              }
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-55"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              {submitting
                ? "Confirmando pedido…"
                : isProductAvailable
                  ? "Confirmar Pedido"
                  : "Producto agotado"}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
