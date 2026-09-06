import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BadgeCheck,
  ChevronDown,
  Eye,
  Facebook,
  Instagram,
  Loader2,
  Moon,
  Package,
  PencilLine,
  Search,
  ShoppingCart,
  Store,
  Sun,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { getPublicStorefront, placePublicStorefrontOrder } from "@/lib/storefront.functions";
import { supabase } from "@/integrations/supabase/client";
import { FaTiktok, FaXTwitter } from "react-icons/fa6";
import { getStorefrontTemplate } from "@/components/storefront/storefront-templates";

type PublicStoreProduct = {
  id: string;
  sourceId: string;
  sourceType: "master_catalog" | "smm_generator";
  name: string;
  description: string | null;
  imageUrl: string | null;
  platform: string | null;
  category: string;
  durationDays: number | null;
  isRenewable: boolean;
  publisherName: string | null;
  stockCount: number | null;
  salePricePen: number;
  promoPricePen: number | null;
};
type PublicStore = {
  settings: {
    store_owner_id: string;
    store_slug: string;
    display_name: string;
    description: string | null;
    logo_url: string | null;
    banner_url: string | null;
    template_key: string;
    avatar_frame_key: "neon" | "fire" | "gold" | null;
    facebook_url: string | null;
    instagram_url: string | null;
    tiktok_url: string | null;
    x_url: string | null;
    youtube_url: string | null;
  };
  available: boolean;
  totalSales: number;
  products: PublicStoreProduct[];
};

const categoryLabels: Record<string, string> = {
  todo: "Todo",
  combos: "Combos Premium",
  streaming: "Streaming",
  ia: "IA & Herramientas",
  aplicaciones: "Aplicaciones",
  apps: "Aplicaciones",
  licencias: "Licencias",
  cursos: "Cursos",
  recargas: "Recargas",
  videojuegos: "Videojuegos",
  juegos: "Videojuegos",
  giftcards: "Tarjetas de Regalo",
  invitaciones: "Invitaciones",
  redes: "Redes Sociales",
  redes_sociales: "Redes Sociales",
  musica: "Música",
  adultos: "Adultos",
  iptv: "IPTV",
};
function normalizeCategory(category: string) {
  return (
    category
      .toLocaleLowerCase("es")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "otros"
  );
}
function money(value: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value);
}
function initials(value: string) {
  return (
    value
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "CMD"
  );
}

/** Escaparate compartible: solo proyecta catálogo, precios y stock agregado. */
export function PublicStorefront({ slug }: { slug: string }) {
  const getStorefront = useServerFn(getPublicStorefront);
  const placeOrder = useServerFn(placePublicStorefrontOrder);
  const { isAdmin, isProvider, isDistributor } = useIsAdmin();
  const [activeCategory, setActiveCategory] = useState("todo");
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PublicStoreProduct | null>(null);
  const [autoRenew, setAutoRenew] = useState(false);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const storefrontQuery = useQuery({
    queryKey: ["public-storefront", slug],
    queryFn: () => getStorefront({ data: { slug } }),
  });
  const store = storefrontQuery.data as PublicStore | null | undefined;
  const storeProducts = store?.products ?? [];
  const categories = useMemo(
    () => [
      "todo",
      ...[...new Set(storeProducts.map((product) => normalizeCategory(product.category)))].sort(
        (a, b) => (categoryLabels[a] || a).localeCompare(categoryLabels[b] || b, "es"),
      ),
    ],
    [storeProducts],
  );
  const filteredProducts = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return storeProducts.filter(
      (product) =>
        (activeCategory === "todo" || normalizeCategory(product.category) === activeCategory) &&
        (!term ||
          [product.name, product.description, product.platform, product.category]
            .filter(Boolean)
            .some((value) => value!.toLocaleLowerCase("es").includes(term))),
    );
  }, [activeCategory, query, storeProducts]);
  const purchaseMutation = useMutation({
    mutationFn: (product: PublicStoreProduct) =>
      placeOrder({ data: { slug, overrideId: product.id, autoRenew } }),
    onSuccess: (result) => {
      toast.success(
        `Compra confirmada. Se descontó ${money(Number(result.charged_pen))} de tu billetera.`,
      );
      setSelectedProduct(null);
      void storefrontQuery.refetch();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo completar la compra."),
  });
  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (active) setViewerId(data.user?.id ?? null);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setViewerId(session?.user.id ?? null);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  if (storefrontQuery.isLoading)
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-white/55">
        Cargando tienda…
      </div>
    );
  if (!store)
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6 text-center text-sm text-white/55">
        Esta tienda no existe o no está publicada.
      </div>
    );
  const template = getStorefrontTemplate(store.settings.template_key);
  const socialLinks = [
    { href: store.settings.facebook_url, label: "Facebook", icon: Facebook },
    { href: store.settings.instagram_url, label: "Instagram", icon: Instagram },
    { href: store.settings.tiktok_url, label: "TikTok", icon: FaTiktok },
    { href: store.settings.x_url, label: "X", icon: FaXTwitter },
    { href: store.settings.youtube_url, label: "YouTube", icon: Youtube },
  ].filter((link) => Boolean(link.href));
  const avatarFrameClass =
    store.settings.avatar_frame_key === "neon"
      ? "ring-4 ring-cyan-300 shadow-[0_0_22px_rgba(34,211,238,.9)]"
      : store.settings.avatar_frame_key === "fire"
        ? "ring-4 ring-orange-400 shadow-[0_0_22px_rgba(249,115,22,.9)]"
        : store.settings.avatar_frame_key === "gold"
          ? "ring-4 ring-amber-300 shadow-[0_0_22px_rgba(251,191,36,.9)]"
          : "";
  const canCustomize = Boolean(viewerId && (viewerId === store.settings.store_owner_id || isAdmin));
  const managementHref = isAdmin
    ? "/admin/mi-tienda"
    : isProvider
      ? "/proveedor/mi-tienda"
      : isDistributor
        ? "/distribuidor/mi-tienda"
        : "/tienda";
  const openPurchase = (product: PublicStoreProduct) => {
    if (product.sourceType !== "master_catalog")
      return toast.message("Este servicio se gestiona desde el generador de redes sociales.");
    if (product.stockCount !== null && product.stockCount < 1)
      return toast.error("Este producto se encuentra sin stock.");
    if (!viewerId) {
      toast.message("Inicia sesión en CMD para comprar desde tu billetera.");
      window.location.assign("/tienda");
      return;
    }
    setAutoRenew(false);
    setSelectedProduct(product);
  };
  return (
    <main
      className={darkMode ? "min-h-screen text-white" : "min-h-screen bg-slate-100 text-slate-950"}
      style={darkMode ? { backgroundColor: template.surface } : undefined}
    >
      <div className="mx-auto w-full max-w-[1200px] px-3 pb-12 pt-3 sm:px-5 sm:pt-5">
        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 text-white/65 transition hover:text-white"
          >
            <Store className="h-4 w-4" /> Explorar CMD
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDarkMode((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 bg-white/[0.03] text-white/75 transition hover:border-white/35 hover:text-white"
              aria-label="Cambiar tema"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.03] px-3 text-white/80"
            >
              <ShoppingCart className="h-4 w-4" /> Carrito{" "}
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">
                {selectedProduct ? 1 : 0}
              </span>
            </button>
          </div>
        </div>
        <section
          className="mt-4 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/25"
          style={{ backgroundColor: template.surface }}
        >
          <div
            className="relative h-36 overflow-hidden sm:h-56"
            style={{
              background: `linear-gradient(120deg, ${template.surface}, ${template.accent}77)`,
            }}
          >
            {store.settings.banner_url && (
              <img
                src={store.settings.banner_url}
                alt={`Portada de ${store.settings.display_name}`}
                className="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
            {canCustomize && (
              <Link
                to={managementHref}
                style={{ backgroundColor: template.accent }}
                className="absolute right-3 top-3 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-bold text-white shadow-lg shadow-black/25 transition hover:brightness-110"
              >
                <PencilLine className="h-3.5 w-3.5" /> Personalizar orden
              </Link>
            )}
          </div>
          <div className="relative flex flex-col gap-4 px-4 pb-5 pt-0 sm:flex-row sm:items-end sm:px-7">
            <div
              className={`-mt-10 grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-4 border-black/40 text-xl font-black text-white shadow-xl sm:-mt-12 sm:h-24 sm:w-24 ${avatarFrameClass}`}
              style={{ backgroundColor: template.accent }}
            >
              {store.settings.logo_url ? (
                <img
                  src={store.settings.logo_url}
                  alt="Logo de tienda"
                  className="h-full w-full object-cover"
                />
              ) : (
                initials(store.settings.display_name)
              )}
            </div>
            <div className="min-w-0 flex-1 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-product text-2xl font-bold sm:text-3xl">
                  @{store.settings.store_slug}
                </h1>
                <BadgeCheck
                  className="h-5 w-5"
                  style={{ color: template.accentSoft }}
                  aria-label="Tienda verificada"
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span
                  className="rounded px-2 py-1 text-white"
                  style={{ backgroundColor: template.accent }}
                >
                  {store.totalSales} Ventas
                </span>
                <span
                  className={
                    store.available
                      ? "rounded bg-emerald-500/15 px-2 py-1 text-emerald-200"
                      : "rounded bg-slate-500/15 px-2 py-1 text-slate-300"
                  }
                >
                  {store.available ? "● Disponible" : "◐ Fuera de horario"}
                </span>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-white/60">
                {store.settings.description || store.settings.display_name}
              </p>
              {socialLinks.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {socialLinks.map(({ href, label, icon: Icon }) => (
                    <a
                      key={label}
                      href={href ?? undefined}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={label}
                      className="grid h-7 w-7 place-items-center rounded-full border border-white/15 bg-black/15 text-white/80 transition hover:text-white"
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
            <span className="hidden items-center gap-1 pb-1 text-xs text-white/45 sm:inline-flex">
              <Eye className="h-4 w-4" /> Tienda pública
            </span>
          </div>
        </section>
        <section
          className="mt-5 overflow-x-auto pb-2 cmd-dark-scrollbar"
          aria-label="Categorías de la tienda"
        >
          <div className="flex min-w-max gap-2">
            {categories.map((category) => {
              const active = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  style={
                    active
                      ? { backgroundColor: template.accent, borderColor: template.accent }
                      : undefined
                  }
                  className={`inline-flex h-11 items-center gap-2 rounded-lg border px-3 text-xs font-bold transition ${active ? "text-white" : "border-white/10 bg-card text-white/80 hover:border-white/30"}`}
                >
                  <Package className="h-4 w-4" /> {categoryLabels[category] || category}
                </button>
              );
            })}
          </div>
        </section>
        <section className="mt-4">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar producto o servicio..."
              className="h-11 w-full rounded-lg border border-white/10 bg-card pl-10 pr-12 text-sm text-white outline-none placeholder:text-white/35 focus:border-primary/75"
            />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
          </label>
          <p className="mt-3 text-xs font-semibold text-white/50">
            {filteredProducts.length} producto{filteredProducts.length === 1 ? "" : "s"} disponible
            {filteredProducts.length === 1 ? "" : "s"}
          </p>
          <div className="mt-3 grid gap-3 min-[500px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => {
              const price = product.promoPricePen ?? product.salePricePen;
              const outOfStock = product.stockCount !== null && product.stockCount < 1;
              return (
                <article
                  key={product.id}
                  className="group flex min-h-[23rem] flex-col overflow-hidden rounded-xl border border-white/10 bg-card transition duration-200 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-black/25"
                >
                  <div className="relative aspect-square overflow-hidden bg-background">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-4xl font-black text-white/15">
                        {product.platform?.slice(0, 1) || product.name.slice(0, 1)}
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded bg-emerald-500 px-2 py-1 text-[9px] font-bold text-white">
                      {product.isRenewable ? "RENOVABLE" : "SERVICIO"}
                    </span>
                    {product.durationDays ? (
                      <span className="absolute right-2 top-2 rounded bg-primary px-2 py-1 text-[9px] font-bold text-white">
                        {product.durationDays} DÍAS
                      </span>
                    ) : null}
                    {outOfStock && (
                      <span className="absolute inset-x-0 bottom-0 bg-destructive px-2 py-2 text-center text-[10px] font-bold uppercase text-white">
                        Fuera de servicio
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-[10px] font-semibold text-primary">
                      {product.publisherName || store.settings.display_name}
                    </p>
                    <h2 className="mt-1 min-h-10 line-clamp-2 font-product text-sm font-bold leading-5 text-white">
                      {product.name}
                    </h2>
                    <p className="mt-2 min-h-8 line-clamp-2 text-[11px] leading-4 text-white/45">
                      {product.description || "Servicio digital"}
                    </p>
                    <div className="mt-auto flex items-end justify-between gap-2 border-t border-white/10 pt-3">
                      <div>
                        {product.promoPricePen !== null && (
                          <p className="text-[10px] text-white/35 line-through">
                            {money(product.salePricePen)}
                          </p>
                        )}
                        <p className="font-product text-lg font-bold text-white">{money(price)}</p>
                      </div>
                      <button
                        type="button"
                        disabled={outOfStock}
                        onClick={() => openPurchase(product)}
                        className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-2 text-[10px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" /> Comprar
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <p className="mt-6 rounded-xl border border-dashed border-white/15 p-10 text-center text-sm text-white/45">
              No hay productos publicados para este filtro.
            </p>
          )}
        </section>
      </div>
      <Dialog
        open={Boolean(selectedProduct)}
        onOpenChange={(open) => !open && setSelectedProduct(null)}
      >
        <DialogContent className="max-w-md border-white/15 bg-card text-white">
          <DialogHeader>
            <DialogTitle>Confirmar compra</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-product text-lg font-bold">{selectedProduct.name}</p>
                <p className="mt-1 text-sm text-white/55">
                  Precio final:{" "}
                  <strong className="text-white">
                    {money(selectedProduct.promoPricePen ?? selectedProduct.salePricePen)}
                  </strong>
                </p>
              </div>
              {selectedProduct.isRenewable && (
                <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-white/10 p-4 text-sm">
                  <span>
                    <strong>Auto-renovación</strong>
                    <small className="mt-1 block text-xs text-white/50">
                      Renueva tres días antes del vencimiento si hay saldo.
                    </small>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoRenew}
                    onChange={(event) => setAutoRenew(event.target.checked)}
                    className="h-4 w-4 accent-primary"
                  />
                </label>
              )}
              <p className="text-xs leading-relaxed text-white/55">
                La cuenta se asignará a tu compra y podrás ver las credenciales en Mis compras.
              </p>
            </div>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="h-10 rounded-lg border border-white/15 px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={!selectedProduct || purchaseMutation.isPending}
              onClick={() => selectedProduct && purchaseMutation.mutate(selectedProduct)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-xs font-bold text-white disabled:opacity-60"
            >
              {purchaseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Confirmar
              pedido
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
