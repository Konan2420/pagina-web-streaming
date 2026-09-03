import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bell,
  ChevronDown,
  Copy,
  Eye,
  ImageUp,
  Loader2,
  PackagePlus,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  createStorefrontCombo,
  deleteStorefrontOverride,
  getStorefrontSaleNotifications,
  getStorefrontManagement,
  getStorefrontSupervisorList,
  saveStorefrontOverride,
  saveStorefrontSettings,
} from "@/lib/storefront.functions";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuthState } from "@/hooks/useAuthState";
import { withRequestTimeout } from "@/lib/request-timeout";
import { QueryErrorState, SectionLoadingState } from "@/components/ui/loading-states";
import { StorefrontSupervisorList, type StorefrontSupervisorRow } from "@/components/storefront/StorefrontSupervisorList";
import { StorefrontSettingsEditor, type StorefrontSettingsPayload, type StorefrontSettingsRecord } from "@/components/storefront/StorefrontSettingsEditor";

type StoreProduct = {
  sourceType: "master_catalog" | "smm_generator";
  sourceId: string;
  overrideId: string | null;
  group: string;
  providerName: string;
  iconLabel: string;
  originalName: string;
  originalDescription: string | null;
  category: string;
  stock: number | null;
  unitCostPen: number;
  costIsProvisional: boolean;
  customName: string | null;
  customDescription: string | null;
  salePricePen: number | null;
  promoPricePen: number | null;
  displayOrder: number;
  isVisible: boolean;
};

const storefrontImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const storefrontImageLimit = 5 * 1024 * 1024;

async function uploadStorefrontImage(ownerId: string, kind: "banner" | "logo", file: File) {
  if (!storefrontImageTypes.has(file.type)) {
    throw new Error("Usa una imagen JPG, PNG o WebP.");
  }
  if (file.size > storefrontImageLimit) {
    throw new Error("La imagen no puede superar 5 MB.");
  }
  const extension = file.name.split(".").pop()?.toLocaleLowerCase() || "webp";
  const path = `${ownerId}/${kind}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("storefront-media").upload(path, file, {
    cacheControl: "31536000",
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("storefront-media").getPublicUrl(path);
  if (!data.publicUrl) throw new Error("No se pudo obtener la URL pública de la imagen.");
  return `${data.publicUrl}?v=${Date.now()}`;
}

function money(value: number | null, digits = 2) {
  if (value === null) return "—";
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  }).format(value);
}

function numberValue(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function StorefrontManagement() {
  const queryClient = useQueryClient();
  const loadStorefront = useServerFn(getStorefrontManagement);
  const saveOverride = useServerFn(saveStorefrontOverride);
  const saveSettings = useServerFn(saveStorefrontSettings);
  const createCombo = useServerFn(createStorefrontCombo);
  const deleteOverride = useServerFn(deleteStorefrontOverride);
  const getSaleNotifications = useServerFn(getStorefrontSaleNotifications);
  const loadSupervision = useServerFn(getStorefrontSupervisorList);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [provider, setProvider] = useState("all");
  const [descriptionProduct, setDescriptionProduct] = useState<StoreProduct | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const { status: authStatus, error: authError, retry: retryAuth } = useAuthState();

  const storefrontQuery = useQuery({
    queryKey: ["storefront-management", selectedOwnerId ?? "select-owner"],
    enabled: authStatus === "authenticated",
    queryFn: async () => {
      const input = { data: selectedOwnerId ? { ownerId: selectedOwnerId } : {} };
      return withRequestTimeout(loadStorefront(input));
    },
    retry: false,
  });
  const data = storefrontQuery.data;
  const salesNotificationsQuery = useQuery({
    queryKey: ["storefront-sale-notifications"],
    queryFn: () => withRequestTimeout(getSaleNotifications()),
    enabled: data?.isAdmin === true,
    retry: 1,
  });
  const supervisionQuery = useQuery({
    queryKey: ["storefront-supervision"],
    enabled: authStatus === "authenticated" && data?.isAdmin === true && data.mode === "supervision",
    queryFn: () => withRequestTimeout(loadSupervision()),
    retry: 1,
  });
  const ownerId = data?.ownerId;
  const products = (data?.products ?? []) as StoreProduct[];
  const previewProducts = useMemo(
    () => products.filter((product) => product.isVisible).slice(0, 4).map((product) => ({
      id: `${product.sourceType}:${product.sourceId}`,
      name: product.customName || product.originalName,
      price: product.promoPricePen ?? product.salePricePen,
    })),
    [products],
  );
  const supervisedOwner = (supervisionQuery.data ?? []).find((store) => store.owner_id === ownerId) as StorefrontSupervisorRow | undefined;

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ["storefront-management"] });
  };

  const overrideMutation = useMutation({
    mutationFn: async (input: Parameters<typeof saveOverride>[0]) => saveOverride(input),
    onSuccess: () => void refresh(),
  });
  const settingsMutation = useMutation({
    mutationFn: async (input: Parameters<typeof saveSettings>[0]) => saveSettings(input),
    onSuccess: () => void refresh(),
  });
  const comboMutation = useMutation({
    mutationFn: async (input: Parameters<typeof createCombo>[0]) => createCombo(input),
    onSuccess: () => void refresh(),
  });
  const deleteMutation = useMutation({
    mutationFn: async (input: Parameters<typeof deleteOverride>[0]) => deleteOverride(input),
    onSuccess: () => void refresh(),
  });

  const saveProduct = async (
    product: StoreProduct,
    changes: {
      customName?: string | null;
      customDescription?: string | null;
      salePricePen?: number | null;
      promoPricePen?: number | null;
      displayOrder?: number;
      isVisible?: boolean;
    },
  ) => {
    if (!ownerId) return;
    try {
      await overrideMutation.mutateAsync({
        data: { ownerId, sourceType: product.sourceType, sourceId: product.sourceId, ...changes },
      });
      toast.success("Cambio guardado automáticamente.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el cambio.");
    }
  };

  const filteredProducts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesTerm =
        !term ||
        [product.originalName, product.customName, product.providerName, product.category]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase("es").includes(term));
      return (
        matchesTerm &&
        (category === "all" || product.category === category) &&
        (provider === "all" || product.providerName === provider)
      );
    });
  }, [category, products, provider, query]);
  const groupedProducts = useMemo(() => {
    const groups = new Map<string, StoreProduct[]>();
    for (const product of [...filteredProducts].sort((a, b) => a.displayOrder - b.displayOrder || a.originalName.localeCompare(b.originalName, "es"))) {
      groups.set(product.group, [...(groups.get(product.group) ?? []), product]);
    }
    return [...groups.entries()];
  }, [filteredProducts]);
  const categories = useMemo(
    () =>
      [...new Set(products.map((product) => product.category))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );
  const providers = useMemo(
    () =>
      [...new Set(products.map((product) => product.providerName))].sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [products],
  );
  const isSaving =
    overrideMutation.isPending ||
    settingsMutation.isPending ||
    comboMutation.isPending ||
    deleteMutation.isPending;

  const copyList = async () => {
    const text = filteredProducts
      .map((product) => {
        const name = product.customName || product.originalName;
        return `${name} — ${product.salePricePen === null ? "Sin precio" : money(product.salePricePen)}`;
      })
      .join("\n");
    try {
      await navigator.clipboard.writeText(text || "No hay productos para copiar.");
      toast.success("Lista copiada al portapapeles.");
    } catch {
      toast.error("No se pudo copiar la lista.");
    }
  };

  if (authStatus === "checking" || storefrontQuery.isLoading) {
    return <SectionLoadingState label="Cargando Mi Tienda…" className="min-h-72" />;
  }

  if (authStatus === "signed-out") {
    return (
      <section className="rounded-xl border border-destructive/35 bg-destructive/5 p-6 text-center">
        <h1 className="font-display text-2xl font-black text-white">Tu sesión ya no está activa</h1>
        <p className="mx-auto mt-2 max-w-lg text-sm text-white/60">
          Inicia sesión nuevamente para acceder a la gestión segura de Mi Tienda.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.assign("/?auth=login");
          }}
          className="mt-5 inline-flex h-10 items-center rounded-lg border border-primary/45 bg-primary/10 px-4 text-xs font-bold text-primary transition hover:bg-primary/20"
        >
          Iniciar sesión
        </button>
      </section>
    );
  }

  if (authStatus === "error") {
    return (
      <QueryErrorState
        error={authError}
        title="No pudimos validar tu sesión"
        onRetry={retryAuth}
        className="min-h-64"
      />
    );
  }

  if (storefrontQuery.isError || !data) {
    return (
      <QueryErrorState
        error={storefrontQuery.error}
        title="No se pudo cargar Mi Tienda"
        onRetry={() => void storefrontQuery.refetch()}
        className="min-h-64"
      />
    );
  }

  return (
    <section className="space-y-3">
      <header className="flex flex-col gap-3 rounded-xl border border-border bg-card/70 px-4 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-5">
        <div>
        <h1 className="font-display text-xl font-black tracking-tight text-white sm:text-2xl">{data.mode === "supervision" ? "Supervisión de Tiendas" : "Mi Tienda"}</h1>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-white/55 sm:text-sm">
          {data.mode === "supervision" ? "Consulta y administra las tiendas de proveedores y distribuidores de la plataforma." : "Personaliza los productos de la tienda seleccionada, edita nombres, descripciones y gestiona su stock."}
        </p>
        </div>
        {data.isAdmin && data.mode === "management" && <button type="button" onClick={() => { setSelectedOwnerId(undefined); setSettingsOpen(false); }} className="h-11 rounded-lg border border-border bg-background px-3 text-xs font-bold text-white/80 transition hover:border-primary/55 hover:text-white sm:h-9">Volver a supervisión</button>}
      </header>

      {data.isAdmin && (salesNotificationsQuery.data?.length ?? 0) > 0 && (
        <section className="rounded-xl border border-emerald-400/25 bg-emerald-500/[0.06] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-100"><Bell className="h-4 w-4" /> Ventas recientes acreditadas a tu billetera</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {salesNotificationsQuery.data?.map((notification) => <article key={notification.id} className="rounded-lg border border-white/10 bg-black/15 p-3"><p className="text-xs font-bold text-white">{notification.title}</p><p className="mt-1 text-xs leading-relaxed text-white/60">{notification.body}</p><p className="mt-2 text-[10px] text-white/35">{new Date(notification.created_at).toLocaleString("es-PE")}</p></article>)}
          </div>
        </section>
      )}

      {data.mode === "supervision" ? (
        <StorefrontSupervisorList
          stores={(supervisionQuery.data ?? []) as StorefrontSupervisorRow[]}
          loading={supervisionQuery.isLoading}
          onOpen={(nextOwnerId) => setSelectedOwnerId(nextOwnerId)}
        />
      ) : (
        <>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
        <label className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar productos..."
            className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-xs text-white outline-none transition placeholder:text-white/35 focus:border-red-accent/70 sm:h-9"
          />
        </label>
        <FilterSelect
          value={category}
          onChange={setCategory}
          label="Todas las categorías"
          items={categories}
        />
        <FilterSelect
          value={provider}
          onChange={setProvider}
          label="Todas las marcas"
          items={providers}
        />
        <div className="flex flex-wrap gap-2 xl:ml-auto xl:flex-nowrap">
          <button
            type="button"
            onClick={() =>
              window.open(
                `/tienda-publica/${data.settings.store_slug}`,
                "_blank",
                "noopener,noreferrer",
              )
            }
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-white transition hover:border-white/30 sm:h-9"
          >
            <Eye className="h-3.5 w-3.5" /> Ver mi tienda
          </button>
          <button
            type="button"
            onClick={() => void copyList()}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-white transition hover:border-white/30 sm:h-9"
          >
            <Copy className="h-3.5 w-3.5" /> Copiar Lista
          </button>
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-bold text-white transition hover:border-white/30 sm:h-9"
          >
            <Settings2 className="h-3.5 w-3.5" /> Configurar Tienda
          </button>
          <button
            type="button"
            onClick={() => setComboOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-primary/45 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary/20 sm:h-9"
          >
            <PackagePlus className="h-3.5 w-3.5" /> Crear Combo
          </button>
          <button
            type="button"
            onClick={() => void refresh()}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-red-accent px-3 text-xs font-bold text-white transition hover:brightness-110 sm:h-9"
          >
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isSaving ? "Guardando" : "Guardar Cambios"}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <div className="min-w-[1120px]">
          <StoreTableHeader />
          <ComboSection combos={data.combos} comboItems={data.comboItems} />
          {groupedProducts.map(([group, items]) => (
            <ProductGroup
              key={group}
              title={group}
              products={items}
              storeSlug={data.settings.store_slug}
              saving={overrideMutation.isPending || deleteMutation.isPending}
              onSave={saveProduct}
              onDescription={setDescriptionProduct}
              onDelete={async (product) => {
                if (!product.overrideId || !ownerId) return;
                try {
                  await deleteMutation.mutateAsync({
                    data: { ownerId, overrideId: product.overrideId },
                  });
                  toast.success("Producto retirado de esta tienda.");
                } catch (error) {
                  toast.error(
                    error instanceof Error ? error.message : "No se pudo retirar el producto.",
                  );
                }
              }}
            />
          ))}
          {groupedProducts.length === 0 && (
            <div className="p-10 text-center text-sm text-white/45">
              No se encontraron productos para estos filtros.
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-white/40">
        Los cambios se guardan automáticamente al salir de cada campo. El costo y la ganancia se
        calculan desde la fuente original.
      </p>

      <DescriptionDialog
        product={descriptionProduct}
        saving={overrideMutation.isPending}
        onClose={() => setDescriptionProduct(null)}
        onSave={async (description) => {
          if (!descriptionProduct) return;
          await saveProduct(descriptionProduct, { customDescription: description });
        }}
      />
      <StorefrontSettingsEditor
        open={settingsOpen}
        ownerId={ownerId}
        ownerName={supervisedOwner?.owner_name || data.settings.display_name}
        isAdministrativeEditing={data.isAdmin}
        settings={data.settings as StorefrontSettingsRecord}
        products={previewProducts}
        totalSales={data.totalSales ?? 0}
        saving={settingsMutation.isPending}
        onClose={() => setSettingsOpen(false)}
        onPublish={async (settings: StorefrontSettingsPayload) => {
          if (!ownerId) return;
          try {
            await settingsMutation.mutateAsync({ data: { ownerId, ...settings } });
            toast.success(data.isAdmin ? "Cambios publicados y auditados en esta tienda." : "Cambios publicados en tu tienda.");
            setSettingsOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["storefront-supervision"] });
          } catch (error) {
            toast.error(
              error instanceof Error ? error.message : "No se pudieron publicar los cambios.",
            );
          }
        }}
        onUploadImage={(kind, file) => {
          if (!ownerId || !file) return Promise.reject(new Error("Selecciona una imagen válida."));
          return uploadStorefrontImage(ownerId, kind, file);
        }}
      />
      <ComboDialog
        open={comboOpen}
        products={products.filter((product) => product.overrideId !== null)}
        saving={comboMutation.isPending}
        onClose={() => setComboOpen(false)}
        onSave={async (combo) => {
          if (!ownerId) return;
          try {
            await comboMutation.mutateAsync({ data: { ownerId, ...combo } });
            toast.success("Combo creado correctamente.");
            setComboOpen(false);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "No se pudo crear el combo.");
          }
        }}
      />
        </>
      )}
    </section>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  items,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  items: string[];
}) {
  return (
    <label className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-40 appearance-none rounded-lg border border-border bg-card px-3 pr-8 text-xs font-semibold text-white outline-none focus:border-red-accent/70 sm:h-9"
      >
        <option value="all">{label}</option>
        {items.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
    </label>
  );
}

function StoreTableHeader() {
  return (
    <div className="grid grid-cols-[68px_120px_minmax(185px,1.45fr)_92px_76px_92px_112px_112px_100px_34px_34px] items-center gap-2 border-b border-border px-3 py-3 text-[10px] font-bold uppercase tracking-wide text-white/45">
      <span>Visible</span>
      <span>Proveedor</span>
      <span>Nombre personalizado</span>
      <span>Descripción</span>
      <span>Stock</span>
      <span>Costo unit.</span>
      <span>Precio venta</span>
      <span>Precio promo</span>
      <span>Ganancia</span>
      <span />
      <span />
    </div>
  );
}

function ComboSection({
  combos,
  comboItems,
}: {
  combos: Array<{
    id: string;
    name: string;
    sale_price_pen: number;
    promo_price_pen: number | null;
    is_visible: boolean;
  }>;
  comboItems: Array<{ combo_id: string }>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 bg-white/[0.025] px-3 py-2 text-left text-xs font-bold text-white/65 hover:bg-white/[0.05]"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition", !open && "-rotate-90")} /> Mis Combos
        Premium{" "}
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{combos.length}</span>
      </button>
      {open &&
        combos.map((combo) => (
          <div
            key={combo.id}
            className="grid grid-cols-[68px_120px_minmax(185px,1.45fr)_92px_76px_92px_112px_112px_100px_34px_34px] items-center gap-2 border-t border-white/[0.045] px-3 py-2.5 text-xs text-white/75"
          >
            <span
              className={cn(
                "text-[10px] font-bold",
                combo.is_visible ? "text-emerald-300" : "text-white/35",
              )}
            >
              {combo.is_visible ? "Visible" : "Oculto"}
            </span>
            <span className="text-white/45">Propio</span>
            <span className="font-semibold text-white">{combo.name}</span>
            <span>Combo</span>
            <span>—</span>
            <span>—</span>
            <span>{money(combo.sale_price_pen)}</span>
            <span>{money(combo.promo_price_pen)}</span>
            <span className="text-emerald-300">
              {comboItems.filter((item) => item.combo_id === combo.id).length} ítems
            </span>
            <span />
            <span />
          </div>
        ))}
    </div>
  );
}

function ProductGroup({
  title,
  products,
  storeSlug,
  saving,
  onSave,
  onDescription,
  onDelete,
}: {
  title: string;
  products: StoreProduct[];
  storeSlug: string;
  saving: boolean;
  onSave: (
    product: StoreProduct,
    changes: {
      customName?: string | null;
      customDescription?: string | null;
      salePricePen?: number | null;
      promoPricePen?: number | null;
      displayOrder?: number;
      isVisible?: boolean;
    },
  ) => Promise<void>;
  onDescription: (product: StoreProduct) => void;
  onDelete: (product: StoreProduct) => Promise<void>;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border/80">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2 bg-white/[0.025] px-3 py-2 text-left text-xs font-bold text-white/65 hover:bg-white/[0.05]"
      >
        <ChevronDown className={cn("h-3.5 w-3.5 transition", !open && "-rotate-90")} /> {title}{" "}
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">{products.length}</span>
      </button>
      {open &&
        products.map((product) => (
          <StoreProductRow
            key={`${product.sourceType}:${product.sourceId}`}
            product={product}
            storeSlug={storeSlug}
            saving={saving}
            onSave={onSave}
            onDescription={onDescription}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

function StoreProductRow({
  product,
  storeSlug,
  saving,
  onSave,
  onDescription,
  onDelete,
}: {
  product: StoreProduct;
  storeSlug: string;
  saving: boolean;
  onSave: (
    product: StoreProduct,
    changes: {
      customName?: string | null;
      salePricePen?: number | null;
      promoPricePen?: number | null;
      displayOrder?: number;
      isVisible?: boolean;
    },
  ) => Promise<void>;
  onDescription: (product: StoreProduct) => void;
  onDelete: (product: StoreProduct) => Promise<void>;
}) {
  const [name, setName] = useState(product.customName || product.originalName);
  const [displayOrder, setDisplayOrder] = useState(product.displayOrder.toString());
  const [salePrice, setSalePrice] = useState(product.salePricePen?.toString() || "");
  const [promoPrice, setPromoPrice] = useState(product.promoPricePen?.toString() || "");
  useEffect(() => {
    setName(product.customName || product.originalName);
    setDisplayOrder(product.displayOrder.toString());
    setSalePrice(product.salePricePen?.toString() || "");
    setPromoPrice(product.promoPricePen?.toString() || "");
  }, [product.customName, product.displayOrder, product.originalName, product.promoPricePen, product.salePricePen]);
  const profit = product.salePricePen === null ? null : product.salePricePen - product.unitCostPen;
  return (
    <div className="grid grid-cols-[68px_120px_minmax(185px,1.45fr)_92px_76px_92px_112px_112px_100px_34px_34px] items-center gap-2 border-t border-white/[0.045] px-3 py-2.5 text-xs text-white/75">
      <Switch
        checked={product.isVisible}
        disabled={saving}
        onCheckedChange={(checked) => void onSave(product, { isVisible: checked })}
        aria-label={`Mostrar ${product.originalName} en mi tienda`}
      />
      <span className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white/10 text-[10px] font-black text-primary">
          {product.iconLabel}
        </span>
        <span className="truncate">{product.providerName}</span>
      </span>
      <div className="flex min-w-0 items-center gap-1.5">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => {
            const next = name.trim();
            if (next && next !== (product.customName || product.originalName))
              void onSave(product, { customName: next });
          }}
          className="h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-xs font-semibold text-white outline-none hover:border-white/10 focus:border-red-accent/60 focus:bg-background"
        />
        <input
          aria-label={`Posición pública de ${product.originalName}`}
          title="Posición en la tienda pública"
          value={displayOrder}
          inputMode="numeric"
          onChange={(event) => setDisplayOrder(event.target.value.replace(/\D/g, ""))}
          onBlur={() => {
            const next = Number(displayOrder || "0");
            if (Number.isInteger(next) && next >= 0 && next !== product.displayOrder)
              void onSave(product, { displayOrder: next });
          }}
          className="h-8 w-11 rounded-md border border-border bg-background px-1 text-center text-[10px] font-bold text-white outline-none focus:border-red-accent/60"
        />
      </div>
      <button
        type="button"
        onClick={() => onDescription(product)}
        className="h-8 rounded-md border border-border bg-background px-2 text-[10px] font-semibold text-white transition hover:border-white/30"
      >
        Descripción
      </button>
      <span>
        {product.stock === null ? (
          "--"
        ) : (
          <span className="rounded bg-emerald-400/15 px-1.5 py-1 text-[10px] font-bold text-emerald-200">
            {product.stock} ud.
          </span>
        )}
      </span>
      <span
        title={
          product.costIsProvisional
            ? "Costo base actual del catálogo; el administrador puede definir el costo privado."
            : undefined
        }
        className="font-semibold text-white"
      >
        {money(product.unitCostPen, 6)}
      </span>
      <PriceInput
        value={salePrice}
        placeholder="PEN"
        disabled={saving}
        onChange={setSalePrice}
        onBlur={() => {
          const value = numberValue(salePrice);
          if (value !== product.salePricePen) void onSave(product, { salePricePen: value });
        }}
      />
      <PriceInput
        value={promoPrice}
        placeholder="Sin promo"
        disabled={saving}
        onChange={setPromoPrice}
        onBlur={() => {
          const value = numberValue(promoPrice);
          if (value !== product.promoPricePen) void onSave(product, { promoPricePen: value });
        }}
      />
      <span
        className={cn(
          "font-bold",
          profit === null ? "text-white/35" : profit >= 0 ? "text-emerald-300" : "text-red-300",
        )}
      >
        {profit === null ? "--" : `${profit >= 0 ? "+" : ""}${money(profit, 6)}`}
      </span>
      <button
        type="button"
        onClick={() => window.open(`/tienda-publica/${storeSlug}`, "_blank", "noopener,noreferrer")}
        className="grid h-7 w-7 place-items-center rounded text-white/50 transition hover:bg-white/10 hover:text-white"
        aria-label="Vista previa"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        disabled={!product.overrideId || saving}
        onClick={() => void onDelete(product)}
        className="grid h-7 w-7 place-items-center rounded text-red-300/70 transition hover:bg-red-400/10 hover:text-red-200 disabled:opacity-30"
        aria-label="Quitar de mi tienda"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PriceInput({
  value,
  placeholder,
  disabled,
  onChange,
  onBlur,
}: {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      inputMode="decimal"
      placeholder={placeholder}
      className="h-8 w-full rounded-md border border-transparent bg-transparent px-2 text-xs text-white outline-none hover:border-white/10 focus:border-red-accent/60 focus:bg-background disabled:opacity-50"
    />
  );
}

function DescriptionDialog({
  product,
  saving,
  onClose,
  onSave,
}: {
  product: StoreProduct | null;
  saving: boolean;
  onClose: () => void;
  onSave: (description: string | null) => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  useEffect(
    () => setDescription(product?.customDescription || product?.originalDescription || ""),
    [product],
  );
  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Descripción personalizada</DialogTitle>
        </DialogHeader>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={2400}
          className="min-h-36 rounded-lg border border-border bg-background p-3 text-sm text-white outline-none focus:border-red-accent/70"
          placeholder="Describe este producto para los clientes de tu tienda."
        />
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-xs font-bold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void onSave(description.trim() || null).then(onClose)}
            className="h-10 rounded-lg bg-red-accent px-4 text-xs font-bold text-white"
          >
            Guardar descripción
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettingsDialog({
  open,
  ownerId,
  settings,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  ownerId?: string;
  settings: StorefrontSettingsRecord;
  saving: boolean;
  onClose: () => void;
  onSave: (settings: {
    displayName: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    isPublic: boolean;
    storeSlug: string;
    availabilityMode: "manual" | "schedule";
    isAvailable: boolean;
    opensAt: string | null;
    closesAt: string | null;
    timezone: string;
  }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    availabilityMode: settings.availability_mode,
    bannerUrl: settings.banner_url || "",
    closesAt: settings.closes_at?.slice(0, 5) || "",
    displayName: settings.display_name,
    description: settings.description || "",
    isAvailable: settings.is_available,
    logoUrl: settings.logo_url || "",
    opensAt: settings.opens_at?.slice(0, 5) || "",
    isPublic: settings.is_public,
    storeSlug: settings.store_slug,
    timezone: settings.timezone || "America/Lima",
  });
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
  useEffect(
    () =>
      setForm({
        availabilityMode: settings.availability_mode,
        bannerUrl: settings.banner_url || "",
        closesAt: settings.closes_at?.slice(0, 5) || "",
        displayName: settings.display_name,
        description: settings.description || "",
        isAvailable: settings.is_available,
        logoUrl: settings.logo_url || "",
        opensAt: settings.opens_at?.slice(0, 5) || "",
        isPublic: settings.is_public,
        storeSlug: settings.store_slug,
        timezone: settings.timezone || "America/Lima",
      }),
    [settings],
  );
  const handleImage = async (kind: "banner" | "logo", file?: File) => {
    if (!file || !ownerId) return;
    setUploading(kind);
    try {
      const url = await uploadStorefrontImage(ownerId, kind, file);
      setForm((current) =>
        kind === "banner" ? { ...current, bannerUrl: url } : { ...current, logoUrl: url },
      );
      toast.success(kind === "banner" ? "Portada cargada. Guarda para publicarla." : "Logo cargado. Guarda para publicarlo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la imagen.");
    } finally {
      setUploading(null);
    }
  };
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurar Tienda</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <LabeledInput
            label="Nombre público"
            value={form.displayName}
            onChange={(value) => setForm({ ...form, displayName: value })}
          />
          <LabeledInput
            label="Enlace público"
            value={form.storeSlug}
            onChange={(value) => setForm({ ...form, storeSlug: value })}
          />
          <div className="grid gap-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-white">Imagen de portada</p>
            {form.bannerUrl && <img src={form.bannerUrl} alt="Vista previa de portada" className="h-24 w-full rounded-md object-cover" />}
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-white/35">
              {uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />} Subir portada
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!ownerId || uploading !== null} onChange={(event) => void handleImage("banner", event.target.files?.[0])} />
            </label>
            <p className="text-[10px] text-white/45">JPG, PNG o WebP; máximo 5 MB.</p>
          </div>
          <div className="grid gap-2 rounded-lg border border-border p-3">
            <p className="text-xs font-semibold text-white">Logo o foto de perfil</p>
            {form.logoUrl && <img src={form.logoUrl} alt="Vista previa de logo" className="h-16 w-16 rounded-full object-cover" />}
            <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-white/35">
              {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />} Subir logo
              <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!ownerId || uploading !== null} onChange={(event) => void handleImage("logo", event.target.files?.[0])} />
            </label>
          </div>
          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            Descripción
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="min-h-24 rounded-lg border border-border bg-background p-3 text-sm text-white outline-none focus:border-red-accent/70"
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border p-3 text-xs font-semibold text-white">
            Tienda pública{" "}
            <Switch
              checked={form.isPublic}
              onCheckedChange={(isPublic) => setForm({ ...form, isPublic })}
            />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border p-3 text-xs font-semibold text-white">
            Disponible ahora
            <Switch checked={form.isAvailable} onCheckedChange={(isAvailable) => setForm({ ...form, isAvailable })} />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-white/75">
            Disponibilidad
            <select value={form.availabilityMode} onChange={(event) => setForm({ ...form, availabilityMode: event.target.value as "manual" | "schedule" })} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none focus:border-red-accent/70">
              <option value="manual">Manual</option>
              <option value="schedule">Por horario</option>
            </select>
          </label>
          {form.availabilityMode === "schedule" && <div className="grid grid-cols-2 gap-3"><label className="grid gap-1.5 text-xs font-semibold text-white/75">Desde<input type="time" value={form.opensAt} onChange={(event) => setForm({ ...form, opensAt: event.target.value })} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none focus:border-red-accent/70" /></label><label className="grid gap-1.5 text-xs font-semibold text-white/75">Hasta<input type="time" value={form.closesAt} onChange={(event) => setForm({ ...form, closesAt: event.target.value })} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none focus:border-red-accent/70" /></label></div>}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-xs font-bold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void onSave({
                availabilityMode: form.availabilityMode,
                bannerUrl: form.bannerUrl.trim() || null,
                closesAt: form.closesAt || null,
                displayName: form.displayName,
                description: form.description.trim() || null,
                isAvailable: form.isAvailable,
                logoUrl: form.logoUrl.trim() || null,
                opensAt: form.opensAt || null,
                isPublic: form.isPublic,
                storeSlug: form.storeSlug,
                timezone: form.timezone,
              })
            }
            className="h-10 rounded-lg bg-red-accent px-4 text-xs font-bold text-white"
          >
            Guardar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComboDialog({
  open,
  products,
  saving,
  onClose,
  onSave,
}: {
  open: boolean;
  products: StoreProduct[];
  saving: boolean;
  onClose: () => void;
  onSave: (combo: {
    name: string;
    description: string | null;
    salePricePen: number;
    promoPricePen: number | null;
    isVisible: boolean;
    itemOverrideIds: string[];
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (!open) {
      setName("");
      setPrice("");
      setSelected([]);
    }
  }, [open]);
  const toggle = (id: string) =>
    setSelected((items) =>
      items.includes(id) ? items.filter((item) => item !== id) : [...items, id],
    );
  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear Combo</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <LabeledInput label="Nombre del combo" value={name} onChange={setName} />
          <LabeledInput label="Precio de venta (PEN)" value={price} onChange={setPrice} />
          <p className="text-xs text-white/50">
            Selecciona al menos dos productos ya configurados en esta tienda.
          </p>
          <div className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
            {products.map(
              (product) =>
                product.overrideId && (
                  <label
                    key={product.overrideId}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 text-xs text-white/80 hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.includes(product.overrideId)}
                      onChange={() => toggle(product.overrideId!)}
                    />
                    {product.customName || product.originalName}
                  </label>
                ),
            )}
          </div>
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-xs font-bold text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || selected.length < 2 || !name.trim() || numberValue(price) === null}
            onClick={() => {
              const salePricePen = numberValue(price);
              if (salePricePen !== null)
                void onSave({
                  name: name.trim(),
                  description: null,
                  salePricePen,
                  promoPricePen: null,
                  isVisible: true,
                  itemOverrideIds: selected,
                });
            }}
            className="h-10 rounded-lg bg-red-accent px-4 text-xs font-bold text-white"
          >
            Crear Combo
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-white/75">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none focus:border-red-accent/70"
      />
    </label>
  );
}
