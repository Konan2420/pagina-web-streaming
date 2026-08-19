import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Copy,
  Eye,
  Layers3,
  Loader2,
  PackagePlus,
  Pencil,
  Search,
  Settings2,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  createSellerCombo,
  deleteSellerCombo,
  deleteSellerListing,
  getSellerStore,
  saveSellerListings,
  updateSellerComboVisibility,
  updateSellerListingVisibility,
  updateSellerProfile,
} from "@/lib/seller.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Listing = {
  id: string;
  productId: string;
  kind: "listing";
  category: string;
  brand: string;
  platformLogo: string | null;
  providerName: string;
  providerAvatar: string | null;
  baseName: string;
  baseDescription: string;
  customName: string | null;
  customDescription: string | null;
  name: string;
  description: string;
  visible: boolean;
  stock: number;
  costUnit: number;
  priceSale: number;
  promoPrice: number | null;
};

type Combo = Omit<Listing, "kind" | "productId" | "baseName" | "baseDescription" | "customName" | "customDescription"> & {
  kind: "combo";
};

type StoreData = {
  profile: {
    display_name: string;
    slug: string;
    banner_url: string | null;
    status: string;
  };
  listings: Listing[];
  combos: Combo[];
};

type ListingDraft = {
  customName?: string;
  customDescription?: string;
  priceSale?: string;
  promoPrice?: string;
};

type DeleteTarget = { id: string; kind: "listing" | "combo"; name: string } | null;
type PreviewTarget = Listing | Combo | null;

const storeQueryKey = ["seller-store"] as const;

function formatMoney(value: number) {
  return `S/ ${value.toFixed(2)}`;
}

function moneyInput(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("No se pudo acceder al portapapeles.");
}

export function SellerStoreManager() {
  const queryClient = useQueryClient();
  const saveListings = useServerFn(saveSellerListings);
  const setVisibility = useServerFn(updateSellerListingVisibility);
  const setComboVisibility = useServerFn(updateSellerComboVisibility);
  const removeListing = useServerFn(deleteSellerListing);
  const removeCombo = useServerFn(deleteSellerCombo);
  const saveProfile = useServerFn(updateSellerProfile);
  const createCombo = useServerFn(createSellerCombo);

  const { data, isLoading, error } = useQuery<StoreData>({
    queryKey: storeQueryKey,
    queryFn: () => getSellerStore(),
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, ListingDraft>>({});
  const [visibilityBusy, setVisibilityBusy] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [descriptionTarget, setDescriptionTarget] = useState<Listing | null>(null);
  const [descriptionValue, setDescriptionValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget>(null);
  const [settings, setSettings] = useState({ displayName: "", slug: "", bannerUrl: "" });
  const [comboForm, setComboForm] = useState({
    name: "",
    description: "",
    priceSale: "",
    promoPrice: "",
    listingIds: [] as string[],
  });

  useEffect(() => {
    if (!data?.profile) return;
    setSettings({
      displayName: data.profile.display_name,
      slug: data.profile.slug,
      bannerUrl: data.profile.banner_url ?? "",
    });
  }, [data?.profile]);

  const listings = data?.listings ?? [];
  const combos = data?.combos ?? [];
  const visibleRows = useMemo(() => {
    const allRows: Array<Listing | Combo> = [...combos, ...listings];
    const normalizedQuery = query.trim().toLowerCase();
    return allRows.filter((item) => {
      const matchesQuery =
        !normalizedQuery ||
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        item.brand.toLowerCase().includes(normalizedQuery);
      return (
        matchesQuery &&
        (category === "all" || item.category === category) &&
        (brand === "all" || item.brand === brand)
      );
    });
  }, [brand, category, combos, listings, query]);

  const categories = useMemo(
    () => [...new Set([...listings, ...combos].map((item) => item.category))].sort(),
    [combos, listings],
  );
  const brands = useMemo(
    () => [...new Set([...listings, ...combos].map((item) => item.brand))].sort(),
    [combos, listings],
  );
  const groups = useMemo(() => {
    const grouped = new Map<string, Array<Listing | Combo>>();
    for (const item of visibleRows) {
      grouped.set(item.category, [...(grouped.get(item.category) ?? []), item]);
    }
    return [...grouped.entries()];
  }, [visibleRows]);
  const hasChanges = Object.keys(drafts).length > 0;

  const updateDraft = (id: string, update: ListingDraft) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...update } }));
  };

  const inputValue = (listing: Listing, field: "priceSale" | "promoPrice") => {
    const draft = drafts[listing.id];
    if (field === "priceSale") return draft?.priceSale ?? String(listing.priceSale);
    return draft?.promoPrice ?? (listing.promoPrice === null ? "" : String(listing.promoPrice));
  };

  const displayedName = (listing: Listing) =>
    drafts[listing.id]?.customName ?? listing.customName ?? listing.baseName;

  const displayedDescription = (listing: Listing) =>
    drafts[listing.id]?.customDescription ?? listing.customDescription ?? listing.baseDescription;

  const handleCopyList = async () => {
    const exported = visibleRows.filter((item) => item.visible);
    if (!exported.length) {
      toast.info("No hay productos visibles con los filtros actuales.");
      return;
    }
    const text = exported
      .map((item) => `${item.name} — ${formatMoney(item.promoPrice ?? item.priceSale)} — Stock: ${item.stock}`)
      .join("\n");
    try {
      await copyText(text);
      toast.success(`${exported.length} producto${exported.length === 1 ? "" : "s"} copiado${exported.length === 1 ? "" : "s"}.`);
    } catch (copyError) {
      toast.error(copyError instanceof Error ? copyError.message : "No se pudo copiar la lista.");
    }
  };

  const handleVisibility = async (listing: Listing, checked: boolean) => {
    setVisibilityBusy(listing.id);
    try {
      await setVisibility({ data: { id: listing.id, visible: checked } });
      toast.success(checked ? "Producto visible en tu tienda." : "Producto oculto de tu tienda.");
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo actualizar la visibilidad.");
    } finally {
      setVisibilityBusy(null);
    }
  };

  const handleComboVisibility = async (combo: Combo, checked: boolean) => {
    setVisibilityBusy(combo.id);
    try {
      await setComboVisibility({ data: { id: combo.id, visible: checked } });
      toast.success(checked ? "Combo visible en tu tienda." : "Combo oculto de tu tienda.");
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo actualizar la visibilidad.");
    } finally {
      setVisibilityBusy(null);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const items = Object.entries(drafts).map(([id, draft]) => {
        const listing = listings.find((item) => item.id === id);
        if (!listing) throw new Error("No se encontró uno de los productos editados.");
        const priceSale = moneyInput(draft.priceSale ?? String(listing.priceSale));
        const promoText = draft.promoPrice ?? (listing.promoPrice === null ? "" : String(listing.promoPrice));
        const promoPrice = promoText.trim() ? moneyInput(promoText) : null;
        if (priceSale === null || promoPrice === null && promoText.trim()) {
          throw new Error("Ingresa importes válidos para los precios.");
        }
        if (promoPrice !== null && promoPrice > priceSale) {
          throw new Error("El precio promocional no puede superar el precio de venta.");
        }
        return {
          id,
          custom_name: draft.customName ?? listing.customName,
          custom_description: draft.customDescription ?? listing.customDescription,
          price_sale: priceSale,
          promo_price: promoPrice,
        };
      });
      return saveListings({ data: { items } });
    },
    onSuccess: async () => {
      setDrafts({});
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
      toast.success("Cambios guardados correctamente.");
    },
    onError: (mutationError) => {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudieron guardar los cambios.");
    },
  });

  const handleSaveSettings = async () => {
    const bannerUrl = settings.bannerUrl.trim();
    try {
      await saveProfile({
        data: {
          display_name: settings.displayName.trim(),
          slug: settings.slug.trim().toLowerCase(),
          banner_url: bannerUrl || null,
        },
      });
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
      setSettingsOpen(false);
      toast.success("Configuración de tienda guardada.");
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo guardar la configuración.");
    }
  };

  const handleCreateCombo = async () => {
    const priceSale = moneyInput(comboForm.priceSale);
    const promoPrice = comboForm.promoPrice.trim() ? moneyInput(comboForm.promoPrice) : null;
    if (priceSale === null || promoPrice === null && comboForm.promoPrice.trim()) {
      toast.error("Ingresa importes válidos para el combo.");
      return;
    }
    try {
      await createCombo({
        data: {
          name: comboForm.name,
          description: comboForm.description || null,
          price_sale: priceSale,
          promo_price: promoPrice,
          listing_ids: comboForm.listingIds,
        },
      });
      setComboForm({ name: "", description: "", priceSale: "", promoPrice: "", listingIds: [] });
      setComboOpen(false);
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
      toast.success("Combo creado. Activa su visibilidad cuando esté listo.");
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo crear el combo.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "listing") await removeListing({ data: { id: deleteTarget.id } });
      else await removeCombo({ data: { id: deleteTarget.id } });
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: storeQueryKey });
      toast.success(deleteTarget.kind === "listing" ? "Producto eliminado." : "Combo eliminado.");
    } catch (mutationError) {
      toast.error(mutationError instanceof Error ? mutationError.message : "No se pudo eliminar.");
    }
  };

  if (isLoading) {
    return <SellerStoreSkeleton />;
  }
  if (error || !data) {
    return (
      <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-8">
        <div className="mx-auto max-w-5xl rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-red-200">
          No se pudo cargar tu tienda. {error instanceof Error ? error.message : "Inténtalo nuevamente."}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-7 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-5">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Mi Tienda</h1>
          <p className="mt-1 text-xs text-white/55 sm:text-sm">
            Personaliza los productos de tu tienda, edita nombres, descripciones y gestiona tu propio stock.
          </p>
        </header>

        <section className="mb-5 flex flex-wrap items-center gap-2 border-y border-border py-3">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar productos..."
              className="h-9 border-border bg-background pl-9 text-xs text-white placeholder:text-white/35"
            />
          </label>
          <FilterSelect value={category} onValueChange={setCategory} placeholder="Todas las categorías" items={categories} />
          <FilterSelect value={brand} onValueChange={setBrand} placeholder="Todas las marcas" items={brands} />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/v/${data.profile.slug}`, "_blank", "noopener,noreferrer")}
            className="border-border bg-background text-xs text-white hover:bg-white/5"
          >
            <Eye /> Ver mi tienda
          </Button>
          <Button variant="outline" size="sm" onClick={() => void handleCopyList()} className="border-border bg-background text-xs text-white hover:bg-white/5">
            <Copy /> Copiar Lista
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)} className="border-border bg-background text-xs text-white hover:bg-white/5">
            <Settings2 /> Configurar Tienda
          </Button>
          <Button variant="outline" size="sm" onClick={() => setComboOpen(true)} disabled={listings.length < 2} className="border-border bg-background text-xs text-white hover:bg-white/5">
            <PackagePlus /> Crear Combo
          </Button>
          <Button
            size="sm"
            disabled={!hasChanges || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="ml-auto bg-primary text-xs font-bold text-white hover:bg-primary/90"
          >
            {saveMutation.isPending ? <Loader2 className="animate-spin" /> : <Check />} Guardar Cambios
          </Button>
        </section>

        {data.profile.status !== "active" && (
          <div className="mb-4 rounded-lg border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Tu tienda está {data.profile.status === "pending" ? "pendiente de activación" : "suspendida"}; las publicaciones no serán públicas.
          </div>
        )}

        <section className="overflow-hidden rounded-lg border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] border-collapse text-left text-[11px]">
              <thead className="border-b border-border bg-white/[0.02] text-[10px] font-bold uppercase tracking-wide text-white/65">
                <tr>
                  <th className="w-[72px] px-3 py-3">Visible</th>
                  <th className="min-w-[126px] px-3 py-3">Proveedor</th>
                  <th className="min-w-[230px] px-3 py-3">Nombre Personalizado</th>
                  <th className="min-w-[112px] px-3 py-3">Descripción</th>
                  <th className="w-[76px] px-3 py-3">Stock</th>
                  <th className="min-w-[85px] px-3 py-3">Costo Unit.</th>
                  <th className="min-w-[114px] px-3 py-3">Precio Venta</th>
                  <th className="min-w-[125px] px-3 py-3">Precio Promo</th>
                  <th className="min-w-[105px] px-3 py-3">Ganancia</th>
                  <th className="w-[86px] px-3 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-14 text-center text-sm text-white/40">
                      No hay publicaciones que coincidan con los filtros. Los productos aparecerán aquí cuando la administración te asigne stock.
                    </td>
                  </tr>
                ) : (
                  groups.map(([groupName, items]) => (
                    <GroupRows
                      key={groupName}
                      groupName={groupName}
                      items={items}
                      drafts={drafts}
                      displayedName={displayedName}
                      inputValue={inputValue}
                      onDraft={updateDraft}
                      onDescription={(listing) => {
                        setDescriptionTarget(listing);
                        setDescriptionValue(displayedDescription(listing));
                      }}
                      onVisibility={(listing, checked) => void handleVisibility(listing, checked)}
                      onComboVisibility={(combo, checked) => void handleComboVisibility(combo, checked)}
                      visibilityBusy={visibilityBusy}
                      onPreview={setPreviewTarget}
                      onDelete={(item) => setDeleteTarget({ id: item.id, kind: item.kind, name: item.name })}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="border-border bg-background text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Configurar Tienda</DialogTitle>
            <DialogDescription>Actualiza el nombre público, enlace y banner de tu tienda.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Field label="Nombre de tienda"><Input value={settings.displayName} onChange={(event) => setSettings((current) => ({ ...current, displayName: event.target.value }))} /></Field>
            <Field label="Enlace público"><Input value={settings.slug} onChange={(event) => setSettings((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} prefix="/v/" /></Field>
            <Field label="URL del banner (opcional)"><Input value={settings.bannerUrl} onChange={(event) => setSettings((current) => ({ ...current, bannerUrl: event.target.value }))} placeholder="https://..." /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancelar</Button>
            <Button onClick={() => void handleSaveSettings()}>Guardar configuración</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={comboOpen} onOpenChange={setComboOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-background text-white sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Combo</DialogTitle>
            <DialogDescription>Selecciona al menos dos publicaciones de tu tienda y define su precio.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre"><Input value={comboForm.name} onChange={(event) => setComboForm((current) => ({ ...current, name: event.target.value }))} placeholder="Combo Premium" /></Field>
            <Field label="Precio de venta"><Input type="number" min="0" step="0.01" value={comboForm.priceSale} onChange={(event) => setComboForm((current) => ({ ...current, priceSale: event.target.value }))} placeholder="0.00" /></Field>
            <Field label="Precio promocional"><Input type="number" min="0" step="0.01" value={comboForm.promoPrice} onChange={(event) => setComboForm((current) => ({ ...current, promoPrice: event.target.value }))} placeholder="Opcional" /></Field>
            <Field label="Descripción"><Input value={comboForm.description} onChange={(event) => setComboForm((current) => ({ ...current, description: event.target.value }))} placeholder="Incluye..." /></Field>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold text-white/70">Productos incluidos</p>
            <div className="max-h-52 space-y-1 overflow-y-auto rounded-md border border-border p-2">
              {listings.map((listing) => {
                const selected = comboForm.listingIds.includes(listing.id);
                return (
                  <label key={listing.id} className="flex cursor-pointer items-center gap-3 rounded px-2 py-2 text-xs hover:bg-white/5">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => setComboForm((current) => ({
                        ...current,
                        listingIds: selected ? current.listingIds.filter((id) => id !== listing.id) : [...current.listingIds, listing.id],
                      }))}
                    />
                    <span className="min-w-0 flex-1 truncate">{listing.name}</span>
                    <span className="text-white/45">Stock: {listing.stock}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComboOpen(false)}>Cancelar</Button>
            <Button disabled={comboForm.listingIds.length < 2} onClick={() => void handleCreateCombo()}><Layers3 /> Crear Combo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(descriptionTarget)} onOpenChange={(open) => !open && setDescriptionTarget(null)}>
        <DialogContent className="border-border bg-background text-white">
          <DialogHeader>
            <DialogTitle>Descripción personalizada</DialogTitle>
            <DialogDescription>{descriptionTarget?.name}</DialogDescription>
          </DialogHeader>
          <Textarea value={descriptionValue} onChange={(event) => setDescriptionValue(event.target.value)} rows={7} placeholder="Describe el producto para tus clientes..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDescriptionTarget(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (descriptionTarget) updateDraft(descriptionTarget.id, { customDescription: descriptionValue });
              setDescriptionTarget(null);
            }}>Aplicar cambio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(previewTarget)} onOpenChange={(open) => !open && setPreviewTarget(null)}>
        <DialogContent className="border-border bg-background text-white">
          <DialogHeader>
            <DialogTitle>Vista previa</DialogTitle>
            <DialogDescription>Así verá este producto un cliente de tu tienda.</DialogDescription>
          </DialogHeader>
          {previewTarget && <ProductPreview item={previewTarget} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-border bg-background text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar {deleteTarget?.kind === "combo" ? "este combo" : "este producto"}?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción quitará “{deleteTarget?.name}” de tu tienda. No podrá deshacerse.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void handleDelete()}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function GroupRows({
  groupName,
  items,
  drafts,
  displayedName,
  inputValue,
  onDraft,
  onDescription,
  onVisibility,
  onComboVisibility,
  visibilityBusy,
  onPreview,
  onDelete,
}: {
  groupName: string;
  items: Array<Listing | Combo>;
  drafts: Record<string, ListingDraft>;
  displayedName: (listing: Listing) => string;
  inputValue: (listing: Listing, field: "priceSale" | "promoPrice") => string;
  onDraft: (id: string, update: ListingDraft) => void;
  onDescription: (listing: Listing) => void;
  onVisibility: (listing: Listing, checked: boolean) => void;
  onComboVisibility: (combo: Combo, checked: boolean) => void;
  visibilityBusy: string | null;
  onPreview: (item: Listing | Combo) => void;
  onDelete: (item: Listing | Combo) => void;
}) {
  return (
    <>
      <tr className="border-y border-border bg-white/[0.035]">
        <td colSpan={10} className="px-3 py-2 text-xs font-bold text-white/70">
          {groupName === "Mis Combos Premium" ? groupName : `Catálogo ${groupName}`} <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">{items.length}</span>
        </td>
      </tr>
      {items.map((item) => {
        const listing = item.kind === "listing" ? item : null;
        const salePrice = listing ? Number(inputValue(listing, "priceSale")) || 0 : item.priceSale;
        const promoPrice = listing ? inputValue(listing, "promoPrice") : item.promoPrice === null ? "" : String(item.promoPrice);
        const gain = salePrice - item.costUnit;
        return (
          <tr key={item.id} className="border-b border-border/80 bg-background transition-colors hover:bg-white/[0.025]">
            <td className="px-3 py-3">
              {listing ? (
                <Switch checked={listing.visible} disabled={visibilityBusy === listing.id} onCheckedChange={(checked) => onVisibility(listing, checked)} aria-label={`Cambiar visibilidad de ${listing.name}`} />
              ) : (
                <Switch checked={item.visible} disabled={visibilityBusy === item.id} onCheckedChange={(checked) => onComboVisibility(item as Combo, checked)} aria-label={`Cambiar visibilidad de ${item.name}`} />
              )}
            </td>
            <td className="px-3 py-3">
              <div className="flex items-center gap-2">
                <div className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[8px] font-bold text-white/75">
                  {item.providerAvatar ? <img src={item.providerAvatar} alt="" className="h-full w-full object-cover" /> : item.providerName.slice(0, 2).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate text-white/75">{item.providerName}</span>
              </div>
            </td>
            <td className="px-3 py-3">
              <div className="flex items-center gap-2">
                <PlatformIcon src={item.platformLogo} name={item.brand} />
                {listing ? (
                  <Input value={displayedName(listing)} onChange={(event) => onDraft(listing.id, { customName: event.target.value })} className="h-8 min-w-[150px] border-transparent bg-transparent px-1 text-xs font-semibold text-white hover:border-border focus:border-primary" />
                ) : (
                  <span className="font-semibold text-white">{item.name}</span>
                )}
              </div>
            </td>
            <td className="px-3 py-3">
              {listing ? <Button size="sm" variant="outline" onClick={() => onDescription(listing)} className="h-7 border-border bg-transparent px-2 text-[10px] text-white"><Pencil /> Descripción</Button> : <span className="text-white/45">Combo propio</span>}
            </td>
            <td className="px-3 py-3"><span className={cn("inline-flex min-w-11 justify-center rounded px-2 py-1 text-[10px] font-bold", item.stock > 0 ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/10 text-red-300")}>{item.stock} ud.</span></td>
            <td className="px-3 py-3 font-semibold text-white/80">{formatMoney(item.costUnit)}</td>
            <td className="px-3 py-3">
              {listing ? <Input type="number" min="0" step="0.01" value={inputValue(listing, "priceSale")} onChange={(event) => onDraft(listing.id, { priceSale: event.target.value })} className="h-8 w-24 border-transparent bg-white/[0.04] px-2 text-xs text-white hover:border-border focus:border-primary" /> : <span className="font-semibold text-white">{formatMoney(item.priceSale)}</span>}
            </td>
            <td className="px-3 py-3">
              {listing ? <div className="flex items-center gap-1"><Pencil className="h-3 w-3 text-white/35" /><Input type="number" min="0" step="0.01" value={promoPrice} onChange={(event) => onDraft(listing.id, { promoPrice: event.target.value })} placeholder="Sin promo" className="h-8 w-24 border-transparent bg-white/[0.04] px-2 text-xs text-white hover:border-border focus:border-primary" /></div> : <span className="text-white/45">{item.promoPrice === null ? "Sin promo" : formatMoney(item.promoPrice)}</span>}
            </td>
            <td className="px-3 py-3 font-bold text-emerald-300">{gain >= 0 ? "+" : ""}{formatMoney(gain)}</td>
            <td className="px-3 py-3 text-right">
              <Button size="icon" variant="ghost" onClick={() => onPreview(item)} className="h-7 w-7 text-white/60 hover:text-white"><Eye /></Button>
              <Button size="icon" variant="ghost" onClick={() => onDelete(item)} className="h-7 w-7 text-red-300/70 hover:bg-red-500/10 hover:text-red-300"><Trash2 /></Button>
            </td>
          </tr>
        );
      })}
    </>
  );
}

function FilterSelect({ value, onValueChange, placeholder, items }: { value: string; onValueChange: (value: string) => void; placeholder: string; items: string[] }) {
  return <Select value={value} onValueChange={onValueChange}><SelectTrigger className="h-9 w-[175px] border-border bg-background text-xs text-white"><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent>{<SelectItem value="all">{placeholder}</SelectItem>}{items.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>;
}

function Field({ label, children, prefix }: { label: string; children: React.ReactNode; prefix?: string }) {
  return <label className="block space-y-1.5"><span className="text-xs font-medium text-white/65">{label}</span><div className="relative">{prefix && <span className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-sm text-white/40">{prefix}</span>}{children}</div></label>;
}

function PlatformIcon({ src, name }: { src: string | null; name: string }) {
  return <div className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-md border border-white/10 bg-white/[0.06] text-[8px] font-bold text-white/55">{src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.slice(0, 2).toUpperCase()}</div>;
}

function ProductPreview({ item }: { item: Listing | Combo }) {
  return <div className="overflow-hidden rounded-xl border border-border bg-white/[0.03]"><div className="flex min-h-28 items-center gap-4 bg-white/[0.02] p-5"><PlatformIcon src={item.platformLogo} name={item.brand} /><div><p className="font-bold text-white">{item.name}</p><p className="mt-1 text-sm text-white/55">{item.description || "Sin descripción personalizada."}</p></div></div><div className="flex items-center justify-between p-4 text-sm"><span className={item.stock > 0 ? "text-emerald-300" : "text-red-300"}>{item.stock > 0 ? `${item.stock} disponibles` : "Sin stock"}</span><span className="font-bold text-white">{formatMoney(item.promoPrice ?? item.priceSale)}</span></div></div>;
}

function SellerStoreSkeleton() {
  return <main className="min-h-screen bg-background px-4 py-7 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1680px] animate-pulse"><div className="h-8 w-40 rounded bg-white/10" /><div className="mt-2 h-4 w-96 max-w-full rounded bg-white/5" /><div className="mt-6 h-10 rounded bg-white/5" /><div className="mt-5 h-80 rounded-lg border border-border bg-white/[0.025]" /></div></main>;
}
