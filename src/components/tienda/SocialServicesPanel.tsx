import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ChevronDown,
  CircleAlert,
  Clipboard,
  Clock3,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShoppingCart,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiDiscord,
  SiFacebook,
  SiGoogle,
  SiInstagram,
  SiKick,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from "react-icons/si";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { PlatformIconMark } from "@/lib/platformIcons";
import {
  createSocialServiceOrder,
  getMySocialServiceOrders,
  getSocialOrderClients,
  getSocialServiceCatalog,
  getSocialServiceProviderStatus,
} from "@/lib/social-services.functions";
import { cn } from "@/lib/utils";
import { withRequestTimeout } from "@/lib/request-timeout";
import { QueryErrorState, SectionLoadingState } from "@/components/ui/loading-states";

type SocialService = Pick<
  Tables<"social_service_catalog">,
  | "id"
  | "provider_key"
  | "provider_service_id"
  | "platform"
  | "category"
  | "name"
  | "description"
  | "unit_cost_pen"
  | "min_quantity"
  | "max_quantity"
  | "is_featured"
  | "provider_updated_at"
>;

type SocialClient = Pick<Tables<"profiles">, "id" | "nombre_completo" | "whatsapp">;

type SocialPlatform = {
  id: string;
  label: string;
  color: string;
  Icon?: IconType;
  iconId?: string;
};

const socialPlatforms: SocialPlatform[] = [
  { id: "youtube", label: "YouTube", color: "text-[#ff0000]", Icon: SiYoutube },
  { id: "tiktok", label: "TikTok", color: "text-white", Icon: SiTiktok },
  { id: "kick", label: "Kick", color: "text-[#53fc18]", Icon: SiKick },
  { id: "facebook", label: "Facebook", color: "text-[#1877f2]", Icon: SiFacebook },
  { id: "x", label: "X", color: "text-white", Icon: SiX },
  { id: "instagram", label: "Instagram", color: "text-[#ff3b81]", Icon: SiInstagram },
  { id: "spotify", label: "Spotify", color: "text-[#1ed760]", Icon: SiSpotify },
  { id: "google", label: "Google", color: "text-white", Icon: SiGoogle },
  { id: "canva", label: "Canva", color: "text-cyan-300", iconId: "canva-pro" },
  { id: "discord", label: "Discord", color: "text-[#5865f2]", Icon: SiDiscord },
  { id: "telegram", label: "Telegram", color: "text-[#27a7e7]", Icon: SiTelegram },
  { id: "whatsapp", label: "WhatsApp", color: "text-[#25d366]", Icon: SiWhatsapp },
];

const statusClasses: Record<string, string> = {
  pending_provider: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  in_progress: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  completed: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  failed: "border-red-400/25 bg-red-400/10 text-red-200",
  cancelled: "border-white/15 bg-white/[0.06] text-white/65",
  refunded: "border-violet-400/25 bg-violet-400/10 text-violet-200",
};

const statusLabels: Record<string, string> = {
  pending_provider: "Pendiente de proveedor",
  in_progress: "En proceso",
  completed: "Completado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("es");
}

function formatMoney(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(value);
}

function getPlatformDefinition(platform: string) {
  const normalized = normalize(platform);
  return socialPlatforms.find(
    (item) =>
      normalized === item.id || normalized.includes(item.id) || item.id.includes(normalized),
  );
}

function SocialPlatformMark({ platform, className }: { platform: string; className?: string }) {
  const definition = getPlatformDefinition(platform);
  if (!definition) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-[10px] font-black text-white/65",
          className,
        )}
      >
        {platform.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  if (definition.iconId) {
    return <PlatformIconMark iconId={definition.iconId} className={cn("h-8 w-8", className)} />;
  }

  const Icon = definition.Icon;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-black/35 text-lg",
        definition.color,
        className,
      )}
    >
      {Icon && <Icon />}
    </span>
  );
}

function ProviderPendingState() {
  return (
    <div className="rounded-xl border border-dashed border-white/15 bg-black/15 px-4 py-7 text-center">
      <CircleAlert className="mx-auto h-5 w-5 text-amber-300" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-white">Catálogo de servicios pendiente</p>
      <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-white/45">
        Aún no hay proveedor SMM conectado. Los servicios, precios costo, mínimos y máximos se
        cargarán desde la API real cuando se configure.
      </p>
    </div>
  );
}

export function SocialServicesPanel({
  userId,
  displayName,
  walletBalance,
  onLoginRequired,
}: {
  userId?: string;
  displayName: string;
  walletBalance: number;
  onLoginRequired: () => void;
}) {
  const queryClient = useQueryClient();
  const getProviderStatus = useServerFn(getSocialServiceProviderStatus);
  const getCatalog = useServerFn(getSocialServiceCatalog);
  const getClients = useServerFn(getSocialOrderClients);
  const getOrders = useServerFn(getMySocialServiceOrders);
  const createOrder = useServerFn(createSocialServiceOrder);

  const [activeTab, setActiveTab] = useState<"generator" | "orders">("generator");
  const [activePlatform, setActivePlatform] = useState("all");
  const [serviceQuery, setServiceQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [clientId, setClientId] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [quantity, setQuantity] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderMonth, setOrderMonth] = useState("");
  const [orderYear, setOrderYear] = useState("");
  const [orderScope, setOrderScope] = useState<"mine" | "all">("mine");

  const providerStatusQuery = useQuery({
    queryKey: ["social-service-provider-status"],
    queryFn: () => withRequestTimeout(getProviderStatus({})),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
  const serviceCatalogQuery = useQuery({
    queryKey: ["social-service-catalog"],
    queryFn: () => withRequestTimeout(getCatalog({})),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
  const clientsQuery = useQuery({
    queryKey: ["social-service-order-clients", userId],
    queryFn: () => withRequestTimeout(getClients({})),
    enabled: Boolean(userId),
    staleTime: 60_000,
    retry: 1,
  });
  const ordersQuery = useQuery({
    queryKey: ["my-social-service-orders", userId, orderSearch, orderMonth, orderYear, orderScope],
    queryFn: () =>
      withRequestTimeout(
        getOrders({
          data: {
            search: orderSearch,
            month: orderMonth ? Number(orderMonth) : undefined,
            year: orderYear ? Number(orderYear) : undefined,
            scope: orderScope,
          },
        }),
      ),
    enabled: Boolean(userId) && activeTab === "orders",
    retry: 1,
  });

  const services = (serviceCatalogQuery.data ?? []) as SocialService[];
  const providerStatus = providerStatusQuery.data;
  const effectiveClients = useMemo<SocialClient[]>(() => {
    const loadedClients = clientsQuery.data?.clients ?? [];
    if (loadedClients.length > 0) return loadedClients;
    return userId ? [{ id: userId, nombre_completo: displayName, whatsapp: null }] : [];
  }, [clientsQuery.data?.clients, displayName, userId]);

  useEffect(() => {
    if (!userId || clientId || !effectiveClients.some((client) => client.id === userId)) return;
    setClientId(userId);
  }, [clientId, effectiveClients, userId]);

  const categories = useMemo(
    () =>
      [
        ...new Set(
          services
            .filter(
              (service) =>
                activePlatform === "all" || normalize(service.platform).includes(activePlatform),
            )
            .map((service) => service.category),
        ),
      ].sort((a, b) => a.localeCompare(b, "es")),
    [activePlatform, services],
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = normalize(serviceQuery);
    return services.filter((service) => {
      const matchesPlatform =
        activePlatform === "all" || normalize(service.platform).includes(activePlatform);
      const matchesCategory = category === "all" || service.category === category;
      const matchesQuery =
        !normalizedQuery ||
        normalize(service.name).includes(normalizedQuery) ||
        normalize(service.provider_service_id).includes(normalizedQuery) ||
        normalize(service.platform).includes(normalizedQuery);
      return matchesPlatform && matchesCategory && matchesQuery;
    });
  }, [activePlatform, category, serviceQuery, services]);

  const quickServices = useMemo(
    () => services.filter((service) => service.is_featured).slice(0, 4),
    [services],
  );
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const numericQuantity = Number(quantity);
  const quantityIsValid =
    !!selectedService &&
    Number.isInteger(numericQuantity) &&
    numericQuantity >= selectedService.min_quantity &&
    numericQuantity <= selectedService.max_quantity;
  const costTotal =
    selectedService && quantityIsValid ? selectedService.unit_cost_pen * numericQuantity : 0;
  const canSetSalePrice = clientsQuery.data?.canAssignOtherClients === true;
  const numericSalePrice = Number(salePrice);
  const salePriceIsValid = canSetSalePrice
    ? Number.isFinite(numericSalePrice) && numericSalePrice >= costTotal
    : Boolean(selectedService && quantityIsValid);
  const effectiveSalePrice = canSetSalePrice ? numericSalePrice : costTotal;
  const canSubmit =
    Boolean(userId) &&
    Boolean(providerStatus?.is_configured) &&
    Boolean(selectedService) &&
    Boolean(clientId) &&
    targetUrl.trim().length >= 3 &&
    quantityIsValid &&
    salePriceIsValid &&
    !submitting;

  const selectService = (service: SocialService) => {
    setSelectedServiceId(service.id);
    setQuantity("");
    setSalePrice("");
  };

  const copyServiceId = async (serviceId: string) => {
    try {
      await navigator.clipboard.writeText(serviceId);
      toast.success("ID de servicio copiado.");
    } catch {
      toast.error("No se pudo copiar el ID del servicio.");
    }
  };

  const submitOrder = async () => {
    if (!userId) {
      onLoginRequired();
      return;
    }
    if (!providerStatus?.is_configured) {
      toast.error("Aún no se ha configurado un proveedor SMM.");
      return;
    }
    if (!selectedService || !canSubmit) {
      toast.error(
        canSetSalePrice
          ? "Completa los datos obligatorios y valida cantidad y precio."
          : "Completa el enlace y valida la cantidad solicitada.",
      );
      return;
    }

    setSubmitting(true);
    try {
      await createOrder({
        data: {
          serviceId: selectedService.id,
          clientId,
          targetUrl: targetUrl.trim(),
          quantity: numericQuantity,
          salePricePen: effectiveSalePrice,
        },
      });
      toast.success("Pedido registrado y costo descontado de tu billetera.");
      setTargetUrl("");
      setQuantity("");
      setSalePrice("");
      setSelectedServiceId(null);
      void queryClient.invalidateQueries({ queryKey: ["my-social-service-orders", userId] });
      void queryClient.invalidateQueries({ queryKey: ["wallet-balance", userId] });
      setActiveTab("orders");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo registrar el pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="catalogo" className="relative z-10 pb-24">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 sm:pt-8">
        <div className="border-b border-border pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Redes Sociales
          </h1>
          <p className="mt-1 text-xs text-white/60 sm:text-sm">
            Potencia tu presencia digital con servicios premium de alta velocidad y gestiona tus
            pedidos.
          </p>

          <div
            className="mt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            aria-label="Plataformas sociales"
          >
            <button
              type="button"
              onClick={() => setActivePlatform("all")}
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-card text-[10px] font-black transition",
                activePlatform === "all"
                  ? "border-red-accent bg-red-accent/15 text-white shadow-[0_0_0_1px_rgba(220,38,38,0.38)]"
                  : "border-border text-white/55 hover:border-white/25 hover:text-white",
              )}
              aria-label="Todas las plataformas"
              aria-pressed={activePlatform === "all"}
            >
              Todas
            </button>
            {socialPlatforms.map((platform) => {
              const active = activePlatform === platform.id;
              const Icon = platform.Icon;
              return (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => {
                    setActivePlatform(platform.id);
                    setCategory("all");
                  }}
                  title={platform.label}
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl border bg-card text-lg transition",
                    active
                      ? "border-red-accent bg-red-accent/12 shadow-[0_0_0_1px_rgba(220,38,38,0.4)]"
                      : "border-border hover:border-white/25",
                    platform.color,
                  )}
                  aria-label={`Filtrar por ${platform.label}`}
                  aria-pressed={active}
                >
                  {platform.iconId ? (
                    <PlatformIconMark iconId={platform.iconId} className="h-7 w-7" />
                  ) : (
                    Icon && <Icon />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="mt-4 flex gap-5 border-b border-border"
          role="tablist"
          aria-label="Secciones de Redes Sociales"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "generator"}
            onClick={() => setActiveTab("generator")}
            className={cn(
              "border-b-2 px-2 pb-3 text-xs font-bold transition-colors",
              activeTab === "generator"
                ? "border-red-accent text-white"
                : "border-transparent text-white/45 hover:text-white/80",
            )}
          >
            Generador
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
            className={cn(
              "border-b-2 px-2 pb-3 text-xs font-bold transition-colors",
              activeTab === "orders"
                ? "border-red-accent text-white"
                : "border-transparent text-white/45 hover:text-white/80",
            )}
          >
            Mis Órdenes
          </button>
        </div>

        {!userId ? (
          <div className="mt-5 rounded-xl border border-border bg-card p-7 text-center sm:p-10">
            <WalletCards className="mx-auto h-7 w-7 text-red-accent" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-white">
              Inicia sesión para usar el generador
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/55">
              Podrás recargar tu propia billetera y crear pedidos de servicios para tu cuenta cuando
              haya un proveedor SMM configurado.
            </p>
            <button
              type="button"
              onClick={onLoginRequired}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-accent px-4 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
            >
              Acceder al generador
            </button>
          </div>
        ) : activeTab === "orders" ? (
          <OrdersTab
            loading={ordersQuery.isLoading}
            error={ordersQuery.isError ? ordersQuery.error : null}
            dashboard={ordersQuery.data}
            search={orderSearch}
            month={orderMonth}
            year={orderYear}
            scope={orderScope}
            providerConfigured={Boolean(providerStatus?.is_configured)}
            onSearchChange={setOrderSearch}
            onMonthChange={setOrderMonth}
            onYearChange={setOrderYear}
            onScopeChange={setOrderScope}
            onRefresh={() => {
              if (!providerStatus?.is_configured) {
                toast.info("La sincronización se habilitará al conectar el proveedor SMM.");
                return;
              }
              void ordersQuery.refetch();
            }}
            onRetry={() => void ordersQuery.refetch()}
          />
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(19rem,0.8fr)]">
            <div className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden="true"
                />
                <input
                  value={serviceQuery}
                  onChange={(event) => setServiceQuery(event.target.value)}
                  placeholder="Buscar productos..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-xs text-white outline-none transition focus:border-red-accent/70"
                />
              </div>

              <section className="mt-5" aria-labelledby="quick-social-services-title">
                <h2 id="quick-social-services-title" className="text-xs font-bold text-white">
                  Servicios Rápidos en Tienda
                </h2>
                {serviceCatalogQuery.isLoading ? (
                  <SectionLoadingState label="Cargando servicios…" className="mt-3 min-h-20" />
                ) : serviceCatalogQuery.isError ? (
                  <QueryErrorState
                    error={serviceCatalogQuery.error}
                    title="No se pudo cargar el catálogo SMM"
                    onRetry={() => void serviceCatalogQuery.refetch()}
                    className="mt-3"
                  />
                ) : quickServices.length === 0 ? (
                  <p className="mt-3 text-xs text-white/40">
                    Sin accesos rápidos hasta sincronizar el catálogo real.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {quickServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => selectService(service)}
                        className={cn(
                          "flex min-w-0 items-center gap-2 rounded-lg border p-2.5 text-left transition",
                          selectedServiceId === service.id
                            ? "border-red-accent/75 bg-red-accent/10"
                            : "border-border bg-background hover:border-white/25",
                        )}
                      >
                        <SocialPlatformMark platform={service.platform} />
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-semibold text-white">
                            {service.name}
                          </span>
                          <span className="mt-0.5 block text-[10px] text-white/40">
                            {service.platform}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <div className="mt-6 grid gap-4">
                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white">Cliente</span>
                  <span className="relative">
                    <UserRound
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                    <select
                      value={clientId}
                      onChange={(event) => setClientId(event.target.value)}
                      disabled={clientsQuery.isLoading}
                      className="h-10 w-full appearance-none rounded-lg border border-border bg-background py-0 pl-10 pr-9 text-xs text-white outline-none transition focus:border-red-accent/70 disabled:cursor-wait disabled:text-white/45"
                    >
                      <option value="">Buscar o asignar cliente…</option>
                      {effectiveClients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nombre_completo?.trim() || "Cliente"}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                  </span>
                  {clientsQuery.isError && (
                    <span role="alert" className="text-[10px] leading-relaxed text-amber-100/80">
                      No se pudo comprobar la lista de clientes. Solo se mantiene seleccionable tu
                      propia cuenta. <button type="button" onClick={() => void clientsQuery.refetch()} className="font-bold underline underline-offset-2 hover:text-white">Reintentar</button>
                    </span>
                  )}
                  {clientsQuery.data && !clientsQuery.data.canAssignOtherClients && (
                    <span className="text-[10px] leading-relaxed text-white/40">
                      Como cuenta de usuario, los pedidos se asignan únicamente a tu propia cuenta.
                    </span>
                  )}
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-bold text-white">Categoría</span>
                  <span className="relative">
                    <select
                      value={category}
                      onChange={(event) => setCategory(event.target.value)}
                      className="h-10 w-full appearance-none rounded-lg border border-border bg-background px-3 pr-9 text-xs text-white outline-none transition focus:border-red-accent/70"
                    >
                      <option value="all">Todas las categorías</option>
                      {categories.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                      aria-hidden="true"
                    />
                  </span>
                </label>
              </div>

              <section className="mt-6" aria-labelledby="social-service-list-title">
                <h2 id="social-service-list-title" className="text-xs font-bold text-white">
                  Servicio
                </h2>
                <div className="mt-3 max-h-[34rem] space-y-2 overflow-y-auto pr-1 cmd-dark-scrollbar">
                  {serviceCatalogQuery.isLoading ? (
                    <SectionLoadingState label="Cargando catálogo…" className="min-h-32" />
                  ) : serviceCatalogQuery.isError ? (
                    <QueryErrorState
                      error={serviceCatalogQuery.error}
                      title="No se pudo cargar el catálogo SMM"
                      onRetry={() => void serviceCatalogQuery.refetch()}
                    />
                  ) : filteredServices.length === 0 ? (
                    <ProviderPendingState />
                  ) : (
                    filteredServices.map((service) => (
                      <ServiceRow
                        key={service.id}
                        service={service}
                        selected={selectedServiceId === service.id}
                        onSelect={() => selectService(service)}
                        onCopyId={() => void copyServiceId(service.provider_service_id)}
                      />
                    ))
                  )}
                </div>
              </section>

              {selectedService && (
                <div className="mt-6 grid gap-4 border-t border-border pt-5">
                  <label className="grid gap-2">
                    <span className="text-xs font-bold text-white">Enlace / Link</span>
                    <input
                      value={targetUrl}
                      onChange={(event) => setTargetUrl(event.target.value)}
                      placeholder="https://…"
                      inputMode="url"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-xs text-white outline-none transition focus:border-red-accent/70"
                    />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-xs font-bold text-white">Cantidad</span>
                    <input
                      value={quantity}
                      onChange={(event) => setQuantity(event.target.value.replace(/[^0-9]/g, ""))}
                      placeholder={`${selectedService.min_quantity} – ${selectedService.max_quantity}`}
                      inputMode="numeric"
                      className="h-10 rounded-lg border border-border bg-background px-3 text-xs text-white outline-none transition focus:border-red-accent/70"
                    />
                    {quantity && !quantityIsValid && (
                      <span className="text-[10px] text-red-200">
                        Ingresa una cantidad entre{" "}
                        {selectedService.min_quantity.toLocaleString("es-PE")} y{" "}
                        {selectedService.max_quantity.toLocaleString("es-PE")}.
                      </span>
                    )}
                  </label>
                  {canSetSalePrice && (
                    <label className="grid gap-2">
                      <span className="text-xs font-bold text-white">
                        Precio de Venta al Cliente (obligatorio)
                      </span>
                      <input
                        value={salePrice}
                        onChange={(event) => setSalePrice(event.target.value)}
                        placeholder="PEN — ¿A cuánto se lo vendes al cliente?"
                        inputMode="decimal"
                        className="h-10 rounded-lg border border-border bg-background px-3 text-xs text-white outline-none transition focus:border-red-accent/70"
                      />
                    </label>
                  )}
                </div>
              )}
            </div>

            <aside className="h-fit rounded-xl border border-border bg-card p-4 xl:sticky xl:top-4 sm:p-5">
              <h2 className="text-sm font-bold text-white">Servicio Seleccionado</h2>
              {selectedService ? (
                <div className="mt-5 space-y-4">
                  <div className="flex gap-3">
                    <SocialPlatformMark
                      platform={selectedService.platform}
                      className="h-10 w-10 rounded-xl text-xl"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold leading-relaxed text-white">
                        {selectedService.name}
                      </p>
                      <p className="mt-1 text-[10px] text-white/45">
                        {selectedService.platform} · ID {selectedService.provider_service_id}
                      </p>
                    </div>
                  </div>
                  <SummaryRow
                    label="Cliente"
                    value={
                      effectiveClients.find((client) => client.id === clientId)?.nombre_completo ||
                      "Sin asignar"
                    }
                  />
                  <SummaryRow
                    label="Cantidad"
                    value={
                      quantityIsValid ? numericQuantity.toLocaleString("es-PE") : "Por definir"
                    }
                  />
                  <SummaryRow label="Costo total" value={formatMoney(costTotal, 6)} tone="muted" />
                  {canSetSalePrice ? (
                    <>
                      <SummaryRow
                        label="Precio de venta"
                        value={salePriceIsValid ? formatMoney(numericSalePrice) : "Por definir"}
                      />
                      <SummaryRow
                        label="Ganancia"
                        value={
                          salePriceIsValid ? formatMoney(numericSalePrice - costTotal, 6) : "—"
                        }
                        tone="profit"
                      />
                    </>
                  ) : (
                    <SummaryRow label="Total a descontar" value={formatMoney(costTotal, 6)} />
                  )}
                </div>
              ) : (
                <div className="mt-5 grid min-h-52 place-items-center rounded-xl border border-dashed border-white/10 bg-background px-5 text-center">
                  <p className="text-xs leading-relaxed text-white/45">
                    Selecciona un servicio para ver los detalles.
                  </p>
                </div>
              )}

              <div className="mt-5 border-t border-border pt-4">
                <div className="mb-3 flex items-center justify-between gap-2 text-[10px] text-white/45">
                  <span>Tu saldo disponible</span>
                  <span className="font-semibold text-white/80">
                    {formatMoney(walletBalance, 6)}
                  </span>
                </div>
                {providerStatusQuery.isError ? (
                  <div role="alert" className="mb-3 rounded-lg border border-destructive/30 bg-destructive/[0.07] px-3 py-2 text-[10px] leading-relaxed text-red-100/85">
                    No se pudo verificar el proveedor SMM. El cobro permanece bloqueado por seguridad. {" "}
                    <button type="button" onClick={() => void providerStatusQuery.refetch()} className="font-bold underline underline-offset-2 hover:text-white">Reintentar</button>
                  </div>
                ) : !providerStatus?.is_configured && (
                  <p className="mb-3 rounded-lg border border-amber-400/20 bg-amber-400/[0.07] px-3 py-2 text-[10px] leading-relaxed text-amber-100/80">
                    El cobro se habilitará al conectar una API SMM real. No se descuenta saldo
                    mientras tanto.
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void submitOrder()}
                  disabled={!canSubmit}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-primary/35 disabled:text-white/45"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirmar y Pagar
                </button>
                <p className="mt-4 text-center text-[9px] text-white/35">
                  powered by{" "}
                  {providerStatus?.is_configured
                    ? providerStatus.provider_label || "Proveedor SMM"
                    : "Proveedor SMM pendiente"}
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function ServiceRow({
  service,
  selected,
  onSelect,
  onCopyId,
}: {
  service: SocialService;
  selected: boolean;
  onSelect: () => void;
  onCopyId: () => void;
}) {
  return (
    <article
      className={cn(
        "rounded-xl border p-3 transition sm:p-4",
        selected
          ? "border-primary bg-primary/[0.07]"
          : "border-border bg-background hover:border-white/25",
      )}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <SocialPlatformMark platform={service.platform} />
          <span className="min-w-0">
            <span className="block text-xs font-semibold leading-relaxed text-white">
              {service.provider_service_id} - {service.name}
            </span>
            {service.description && (
              <span className="mt-1 block line-clamp-2 text-[10px] leading-relaxed text-sky-200/80">
                {service.description}
              </span>
            )}
          </span>
        </button>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            onClick={onCopyId}
            className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-white/55 transition hover:border-white/25 hover:text-white"
            aria-label={`Copiar ID ${service.provider_service_id}`}
          >
            <Clipboard className="h-3.5 w-3.5" />
          </button>
          <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-bold text-white">
            {formatMoney(service.unit_cost_pen, 6)}
          </span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 pl-11 text-[10px] text-white/45">
        <span>Mín: {service.min_quantity.toLocaleString("es-PE")}</span>
        <span>Máx: {service.max_quantity.toLocaleString("es-PE")}</span>
        {service.provider_updated_at && (
          <span>
            Actualizado: {new Date(service.provider_updated_at).toLocaleDateString("es-PE")}
          </span>
        )}
      </div>
    </article>
  );
}

function SummaryRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "muted" | "profit";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2 text-xs">
      <span className="text-white/45">{label}</span>
      <span
        className={cn(
          "truncate text-right font-semibold text-white",
          tone === "muted" && "text-white/70",
          tone === "profit" && "text-emerald-300",
        )}
      >
        {value}
      </span>
    </div>
  );
}

type CustomerSocialOrder = {
  id: string;
  service_name: string;
  target_url: string;
  quantity: number;
  status: string;
  created_at: string;
};

type InternalSocialOrder = CustomerSocialOrder & {
  clientName: string;
  initial_quantity: number | null;
  cost_total_pen: number;
  external_order_id: string | null;
};

type SocialOrdersDashboard =
  | { view: "customer"; canViewAllOrders: false; orders: CustomerSocialOrder[] }
  | { view: "internal"; canViewAllOrders: boolean; orders: InternalSocialOrder[] };

const orderMonths = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function OrdersTab({
  loading,
  error,
  dashboard,
  search,
  month,
  year,
  scope,
  providerConfigured,
  onSearchChange,
  onMonthChange,
  onYearChange,
  onScopeChange,
  onRefresh,
  onRetry,
}: {
  loading: boolean;
  error: unknown | null;
  dashboard: SocialOrdersDashboard | undefined;
  search: string;
  month: string;
  year: string;
  scope: "mine" | "all";
  providerConfigured: boolean;
  onSearchChange: (value: string) => void;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onScopeChange: (value: "mine" | "all") => void;
  onRefresh: () => void;
  onRetry: () => void;
}) {
  const activeDashboard: SocialOrdersDashboard =
    dashboard ?? { view: "customer", canViewAllOrders: false, orders: [] };
  const isInternalView = activeDashboard.view === "internal";
  const orders = activeDashboard.orders;
  const inProgress = orders.filter(
    (order) => order.status === "pending_provider" || order.status === "in_progress",
  ).length;
  const investment = isInternalView
    ? activeDashboard.orders.reduce((total, order) => total + order.cost_total_pen, 0)
    : 0;
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 4 }, (_, index) => String(currentYear - index));

  const copyOrderId = async (orderId: string) => {
    try {
      await navigator.clipboard.writeText(orderId);
      toast.success("ID de pedido copiado.");
    } catch {
      toast.error("No se pudo copiar el ID del pedido.");
    }
  };

  return (
    <section className="mt-5 space-y-4">
      {isInternalView ? (
        <div className="grid gap-3 md:grid-cols-3">
          <OrderMetricCard
            icon={<ShoppingCart className="h-4 w-4" />}
            title="Total Impulsos"
            detail="Pedidos realizados en el periodo"
            value={String(orders.length)}
          />
          <OrderMetricCard
            icon={<Check className="h-4 w-4" />}
            title="Inversión SMM"
            detail="Costo total acumulado (PEN)"
            value={formatMoney(investment, 6)}
          />
          <OrderMetricCard
            icon={<Clock3 className="h-4 w-4" />}
            title="En Proceso"
            detail="Pedidos esperando completarse"
            value={String(inProgress)}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <OrderMetricCard
            icon={<ShoppingCart className="h-4 w-4" />}
            title="Servicios comprados"
            detail="Pedidos realizados en el periodo"
            value={String(orders.length)}
          />
          <OrderMetricCard
            icon={<Clock3 className="h-4 w-4" />}
            title="Pedidos en proceso"
            detail="Pedidos esperando completarse"
            value={String(inProgress)}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar productos…"
            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-white outline-none transition placeholder:text-white/35 focus:border-primary/70"
          />
        </label>
        <select
          value={month}
          onChange={(event) => onMonthChange(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-white outline-none focus:border-primary/70"
          aria-label="Filtrar por mes"
        >
          <option value="">Todos los meses</option>
          {orderMonths.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(event) => onYearChange(event.target.value)}
          className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-white outline-none focus:border-primary/70"
          aria-label="Filtrar por año"
        >
          <option value="">Todos los años</option>
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        {isInternalView && activeDashboard.canViewAllOrders && (
          <select
            value={scope}
            onChange={(event) => onScopeChange(event.target.value as "mine" | "all")}
            className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-medium text-white outline-none focus:border-primary/70"
            aria-label="Alcance de pedidos de administrador"
          >
            <option value="mine">Ver mis pedidos</option>
            <option value="all">Ver todos los pedidos</option>
          </select>
        )}
        {isInternalView && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={!providerConfigured}
            title={
              providerConfigured
                ? "Consultar los estados actuales en el proveedor SMM"
                : "Disponible al conectar una API SMM real"
            }
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-background px-3 text-xs font-semibold text-white transition hover:border-primary/70 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Sincronizar Todo
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        {loading ? (
          <SectionLoadingState label="Cargando órdenes…" className="min-h-52 rounded-none border-0" />
        ) : error ? (
          <QueryErrorState
            error={error}
            title="No se pudieron cargar tus órdenes"
            onRetry={onRetry}
            className="m-3"
          />
        ) : orders.length === 0 ? (
          <div className="grid min-h-52 place-items-center px-6 text-center text-xs text-white/50">
            No se encontraron resultados para los filtros aplicados.
          </div>
        ) : isInternalView ? (
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="border-b border-border text-[10px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-3 font-medium">Acciones</th>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">ID</th>
                <th className="px-3 py-3 font-medium">Servicio</th>
                <th className="px-3 py-3 font-medium">Link</th>
                <th className="px-3 py-3 font-medium">Inicial</th>
                <th className="px-3 py-3 font-medium">Cantidad</th>
                <th className="px-3 py-3 font-medium">Costo</th>
                <th className="px-3 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {activeDashboard.orders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.06] text-white/75">
                  <td className="px-3 py-3">
                    <button
                      type="button"
                      onClick={() => void copyOrderId(order.external_order_id || order.id)}
                      className="grid h-7 w-7 place-items-center rounded-md border border-white/10 text-white/60 transition hover:border-white/25 hover:text-white"
                      aria-label="Copiar ID de pedido"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-white/55">
                    {new Date(order.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="px-3 py-3 font-mono text-[10px] text-white/70">
                    {order.external_order_id || order.id.slice(0, 8)}
                  </td>
                  <td className="max-w-60 px-3 py-3 font-medium text-white">
                    <span className="line-clamp-2">{order.service_name}</span>
                    {scope === "all" && (
                      <span className="mt-1 block text-[10px] font-normal text-white/45">
                        Cliente: {order.clientName}
                      </span>
                    )}
                  </td>
                  <td className="max-w-44 px-3 py-3">
                    <a
                      href={order.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sky-300 transition hover:text-sky-200 hover:underline"
                    >
                      {order.target_url}
                    </a>
                  </td>
                  <td className="px-3 py-3">
                    {order.initial_quantity === null
                      ? "—"
                      : order.initial_quantity.toLocaleString("es-PE")}
                  </td>
                  <td className="px-3 py-3">{order.quantity.toLocaleString("es-PE")}</td>
                  <td className="px-3 py-3 font-semibold text-white">
                    {formatMoney(order.cost_total_pen, 6)}
                  </td>
                  <td className="px-3 py-3">
                    <OrderStatus status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="border-b border-border text-[10px] uppercase tracking-wide text-white/45">
              <tr>
                <th className="px-3 py-3 font-medium">Fecha</th>
                <th className="px-3 py-3 font-medium">Servicio</th>
                <th className="px-3 py-3 font-medium">Link</th>
                <th className="px-3 py-3 font-medium">Cantidad</th>
                <th className="px-3 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {activeDashboard.orders.map((order) => (
                <tr key={order.id} className="border-b border-white/[0.06] text-white/75">
                  <td className="whitespace-nowrap px-3 py-3 text-white/55">
                    {new Date(order.created_at).toLocaleDateString("es-PE")}
                  </td>
                  <td className="max-w-72 px-3 py-3 font-medium text-white">
                    <span className="line-clamp-2">{order.service_name}</span>
                  </td>
                  <td className="max-w-52 px-3 py-3">
                    <a
                      href={order.target_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sky-300 transition hover:text-sky-200 hover:underline"
                    >
                      {order.target_url}
                    </a>
                  </td>
                  <td className="px-3 py-3">{order.quantity.toLocaleString("es-PE")}</td>
                  <td className="px-3 py-3">
                    <OrderStatus status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

function OrderMetricCard({
  icon,
  title,
  detail,
  value,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  value: string;
}) {
  return (
    <article className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-white">{title}</p>
        <p className="mt-0.5 text-[10px] leading-relaxed text-white/45">{detail}</p>
      </div>
      <strong className="shrink-0 text-sm font-bold text-white">{value}</strong>
    </article>
  );
}

function OrderStatus({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold",
        statusClasses[status] || statusClasses.pending_provider,
      )}
    >
      {statusLabels[status] || status}
    </span>
  );
}
