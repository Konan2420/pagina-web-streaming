import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getMyOrderRatings, rateOrderSupplier } from "@/lib/ratings.functions";
import {
  ChevronDown,
  Search,
  SlidersHorizontal,
  ShoppingCart,
  BadgeCheck,
  Package,
  Share2,
  MessageCircle,
  Mail,
  Clapperboard,
  X,
  Loader2,
  Save,
  User as UserIcon,
  Phone,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Key,
  Copy,
  Eye as EyeIcon,
  EyeOff,
  ExternalLink,
  Star,
} from "lucide-react";
import {
  products,
  estadoStyles,
  WA_NUMBER,
  buildWhatsAppMessage,
  buildCartWhatsAppMessage,
  type Product,
  type PanelTab,
  type Profile,
  type Order,
  type PlatformShortcut,
  getAvatarUrl,
} from "@/components/tienda/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal, type AuthMode } from "@/components/AuthModal";
import { ProductModal } from "@/components/ProductModal";
import { AvatarUploader } from "@/components/AvatarUploader";
import { CartDrawer } from "@/components/CartDrawer";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { KeyboardTutorial } from "@/components/KeyboardTutorial";
import { useRouter } from "@tanstack/react-router";
import { cartStore, useCart } from "@/lib/cart-store";
import type { Session } from "@supabase/supabase-js";
import { useAnalytics } from "@/hooks/useAnalytics";
import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { useFuturisticSound } from "@/hooks/useSound";
import { useServerFn } from "@tanstack/react-start";
import { createOrders } from "@/lib/orders.functions";
import type { Database, Tables } from "@/integrations/supabase/types";
import { getAuthDestination } from "@/lib/auth-destination";
import { PlatformNavigation } from "@/components/tienda/PlatformNavigation";
import { StoreSidebar } from "@/components/tienda/StoreSidebar";

export const Route = createFileRoute("/tienda")({
  head: () => ({
    meta: [
      { title: "Tienda CMD Streaming — Cuentas Premium y Licencias" },
      {
        name: "description",
        content:
          "Explora nuestro catálogo de cuentas premium para streaming, herramientas de IA y licencias de software al mejor precio.",
      },
      { property: "og:title", content: "Tienda CMD Streaming — Cuentas Premium" },
      {
        property: "og:description",
        content: "Netflix, Disney+, ChatGPT Plus y más con entrega inmediata.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/tienda" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/tienda" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Catálogo CMD Streaming",
          itemListElement: products.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: p.name,
              category: p.category,
              offers: {
                "@type": "Offer",
                price: p.price.toFixed(2),
                priceCurrency: "PEN",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
            { "@type": "ListItem", position: 2, name: "Tienda", item: "/tienda" },
          ],
        }),
      },
    ],
  }),
  component: TiendaPage,
});

type SortKey = "destacado" | "precio-asc" | "precio-desc" | "nombre";

type DeliveryDetails = Pick<
  Tables<"delivered_accounts">,
  "email" | "password" | "access_link" | "notes"
>;

type StoreOrder = Order & {
  delivery: DeliveryDetails | null;
  fecha_adquisicion?: string | null;
  fecha_vencimiento?: string | null;
  type: "regular" | "manual";
};

type PublicSupplier = Database["public"]["Functions"]["get_public_suppliers"]["Returns"][number];

type SupplierRatingInfo = {
  order_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_avatar_url: string | null;
  supplier_avatar_effect: string;
  rating: number | null;
  comment: string | null;
};

function normalizeOrderStatus(status: string | null): Order["estado"] {
  if (status === "pagado" || status === "entregado" || status === "cancelado") return status;
  return "pendiente";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getProductStock(
  productId: string | number,
  stockLevels: Record<string, number>,
): { available: boolean; count: number | null } {
  const id = String(productId);
  if (!UUID_RE.test(id)) return { available: true, count: null };
  const count = stockLevels[id] ?? 0;
  return { available: count > 0, count };
}

function consumePendingOAuthRedirect(): boolean {
  try {
    if (window.sessionStorage.getItem("cmd-auth-redirect-pending") !== "1") return false;
    window.sessionStorage.removeItem("cmd-auth-redirect-pending");
    return true;
  } catch {
    return false;
  }
}

function getSafeExternalUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

async function copyText(value: string, successMessage = "Copiado al portapapeles") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      if (!copied) throw new Error("Clipboard copy was rejected");
    }
    toast.success(successMessage);
  } catch {
    toast.error("No se pudo copiar. Selecciona el texto manualmente.");
  }
}

function openWhatsApp(url: string) {
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) toast.info("Permite las ventanas emergentes para continuar por WhatsApp.");
}

export function TiendaPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeCat, setActiveCat] = useState("todo");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("destacado");
  const { count: cartCount, items: cartItems, total: cartTotal } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [panel, setPanel] = useState<PanelTab | "supplier_info">("tienda");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const track = useAnalytics();
  const createOrdersFn = useServerFn(createOrders);

  const { playHover, playClick } = useFuturisticSound();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetails | null>(null);
  const [showPass, setShowPass] = useState(false);
  const ordersRequestId = useRef(0);
  const orderSubmissionRef = useRef(false);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  const scrollToCatalog = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const focusCatalogSearch = useCallback(() => {
    setPanel("tienda");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      playClick();
      setActiveCat(categoryId);
      setQuery("");
      scrollToCatalog();
    },
    [playClick, scrollToCatalog],
  );

  const handlePlatformSelect = useCallback(
    (platform: PlatformShortcut) => {
      playClick();
      setActiveCat(platform.categoryId);
      setQuery(platform.searchTerm);
      scrollToCatalog();
    },
    [playClick, scrollToCatalog],
  );

  const handleGoShop = useCallback(() => {
    playClick();
    setPanel("tienda");
    setActiveCat("todo");
    setQuery("");
    scrollToCatalog();
  }, [playClick, scrollToCatalog]);

  const handleAffiliate = useCallback(() => {
    playClick();
    const message = encodeURIComponent(
      "Hola, quiero conocer el programa de afiliados de CMD Streaming y cómo puedo empezar a ganar comisiones.",
    );
    openWhatsApp(`https://wa.me/${WA_NUMBER}?text=${message}`);
  }, [playClick]);

  const handleWallet = useCallback(() => {
    playClick();
    const message = encodeURIComponent(
      "Hola, quiero recargar mi saldo en CMD Streaming. ¿Me indican los métodos de pago disponibles?",
    );
    openWhatsApp(`https://wa.me/${WA_NUMBER}?text=${message}`);
  }, [playClick]);

  const handleSidebarPanel = useCallback(
    (nextPanel: PanelTab) => {
      playClick();
      setPanel(nextPanel);
    },
    [playClick],
  );

  const handleUnavailableSection = useCallback((section: string) => {
    toast.info(`${section} estará disponible próximamente.`);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        focusCatalogSearch();
      }
    };

    window.addEventListener("keydown", handleSearchShortcut);
    return () => window.removeEventListener("keydown", handleSearchShortcut);
  }, [focusCatalogSearch]);

  useEffect(() => {
    let active = true;

    const redirectOAuthUser = async (authSession: Session | null) => {
      if (!authSession || !consumePendingOAuthRedirect()) return;
      const to = await getAuthDestination(authSession.user.id);
      if (active && to !== "/tienda") await router.navigate({ to });
    };

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        console.warn("[Auth] No se pudo recuperar la sesión local.", error);
        setSession(null);
        return;
      }
      setSession(data.session);
      void redirectOAuthUser(data.session);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (event === "PASSWORD_RECOVERY") {
        setAuthMode("update");
        setAuthOpen(true);
      }
      if (event === "SIGNED_IN") void redirectOAuthUser(nextSession);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [router]);

  const userId = session?.user.id;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre_completo, whatsapp, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        const permissionLike =
          error.code === "42501" || error.message?.toLowerCase().includes("permission denied");
        if (!permissionLike) {
          console.warn("[Profile] Non-critical profile read error:", error);
        }
        setProfile(
          (prev) =>
            prev ?? {
              nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
              whatsapp: "",
              avatar_url: null,
            },
        );
        return;
      }

      if (!data) {
        setProfile({
          nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
          whatsapp: "",
          avatar_url: null,
        });
        return;
      }

      setProfile({
        nombre_completo: data.nombre_completo ?? "",
        whatsapp: data.whatsapp ?? "",
        avatar_url: data.avatar_url ?? null,
      });
    } catch (err) {
      console.error("[Profile] Unexpected error:", err);
      setProfile({
        nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
        whatsapp: "",
        avatar_url: null,
      });
    }
  }, [userId, session?.user?.email]);

  useEffect(() => {
    if (userId) {
      fetchProfile();
      return;
    }

    ordersRequestId.current += 1;
    setProfile(null);
    setOrders([]);
    setSelectedDelivery(null);
    setShowPass(false);
    setCartOpen(false);
    setLoadingOrders(false);
  }, [userId, fetchProfile]);

  const loadOrders = useCallback(async () => {
    if (!userId) {
      ordersRequestId.current += 1;
      setOrders([]);
      setLoadingOrders(false);
      return;
    }
    const requestId = ++ordersRequestId.current;
    setLoadingOrders(true);

    const [regularResult, manualResult] = await Promise.all([
      supabase
        .from("orders")
        .select(
          `
        id, 
        producto_id, 
        producto_nombre, 
        precio, 
        estado, 
        created_at,
        delivery:delivered_accounts (
          email,
          password,
          access_link,
          notes
        )
      `,
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("manual_orders")
        .select(
          "id, producto_nombre, monto, estado, created_at, fecha_adquisicion, fecha_vencimiento",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (requestId !== ordersRequestId.current) return;

    const { data: regularOrders, error: rError } = regularResult;
    const { data: manualOrders, error: mError } = manualResult;
    setLoadingOrders(false);

    if (rError || mError) {
      toast.error("No se pudieron cargar todos tus pedidos");
    }

    const formattedRegular: StoreOrder[] = (regularOrders || []).map((o) => ({
      id: o.id,
      producto_id: o.producto_id,
      producto_nombre: o.producto_nombre,
      precio: o.precio,
      estado: normalizeOrderStatus(o.estado),
      created_at: o.created_at,
      delivery: o.delivery?.[0] ?? null,
      type: "regular",
    }));

    const formattedManual: StoreOrder[] = (manualOrders || []).map((o) => ({
      id: o.id,
      producto_id: "manual",
      producto_nombre: o.producto_nombre,
      precio: o.monto,
      estado: normalizeOrderStatus(o.estado),
      created_at: o.created_at ?? o.fecha_adquisicion,
      delivery: null,
      fecha_adquisicion: o.fecha_adquisicion,
      fecha_vencimiento: o.fecha_vencimiento,
      type: "manual",
    }));

    setOrders(
      [...formattedRegular, ...formattedManual].sort(
        (a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime(),
      ),
    );
  }, [userId]);

  useEffect(() => {
    if (panel === "compras") loadOrders();
  }, [panel, loadOrders]);

  // Reset panel when logging out
  useEffect(() => {
    if (!session) setPanel("tienda");
  }, [session]);

  // Load products from DB
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Perfiles públicos de proveedores (única fuente: supplier_profiles.avatar_url / avatar_effect)
  const supplierIds = useMemo(
    () =>
      Array.from(
        new Set(
          dbProducts
            .map((product) => product.supplier_id)
            .filter((id): id is string => Boolean(id)),
        ),
      ),
    [dbProducts],
  );

  const { data: supplierMap = {} } = useQuery({
    queryKey: ["public-suppliers", supplierIds],
    enabled: supplierIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_suppliers", {
        _user_ids: supplierIds,
      });
      if (error) throw error;
      const map: Record<string, PublicSupplier> = {};
      data?.forEach((row) => {
        map[row.user_id] = row;
      });
      return map;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Realtime: cualquier cambio en supplier_profiles (avatar_url / avatar_effect)
  // refresca la tienda al instante, sin recargar la página.
  useEffect(() => {
    const channel = supabase
      .channel("supplier_profiles_public")
      .on("postgres_changes", { event: "*", schema: "public", table: "supplier_profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["public-suppliers"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const allProducts = useMemo(() => {
    const dbMapped: Product[] = dbProducts.map((p) => {
      const sup = p.supplier_id ? supplierMap[p.supplier_id] : undefined;
      return {
        id: p.id,
        name: p.name,
        category: p.category?.toLowerCase() || "streaming",
        price: p.price,
        image: p.image_url || "/placeholder.svg",
        description: p.description || "",
        whatsapp_contacto: WA_NUMBER,
        duracion: "30 Días",
        shortLabel: p.name.toUpperCase(),
        descripcion_larga: p.descripcion_larga || p.description || "Sin descripción detallada.",
        horario_atencion_inicio: "09:00",
        horario_atencion_fin: "22:00",
        vendedor: sup?.display_name || "camd",
        supplier_avatar_url: sup?.avatar_url ? getAvatarUrl(sup.avatar_url) : null,
        supplier_avatar_effect: sup?.avatar_effect ?? "none",
        supplier_verified: sup?.is_verified ?? false,
      };
    });

    const existingNames = new Set(dbMapped.map((p) => p.name.toLowerCase()));
    const filteredMock = products.filter((p) => !existingNames.has(p.name.toLowerCase()));

    return [...dbMapped, ...filteredMock];
  }, [dbProducts, supplierMap]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allProducts.filter(
      (p) =>
        (activeCat === "todo" || p.category === activeCat) &&
        (q === "" || p.name.toLowerCase().includes(q)),
    );
    if (sort === "precio-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "precio-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "nombre") return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }, [allProducts, activeCat, query, sort]);

  // Fetch real-time stock for DB products (uuid ids only)
  const stockIds = useMemo(
    () => visible.map((p) => String(p.id)).filter((id) => UUID_RE.test(id)),
    [visible],
  );

  const { data: stockLevels = {} } = useQuery({
    queryKey: ["inventory-stock", stockIds],
    queryFn: async () => {
      if (stockIds.length === 0) return {};
      // Aggregate-only table: exposes available counts, never account credentials
      const { data, error } = await supabase
        .from("product_stock")
        .select("product_id, available")
        .in("product_id", stockIds);

      if (error) {
        console.error("Error fetching stock:", error);
        return {};
      }

      const counts: Record<string, number> = {};
      data?.forEach((row) => {
        counts[row.product_id] = row.available;
      });
      return counts;
    },
    enabled: stockIds.length > 0,
    refetchInterval: 30000, // Refetch every 30s
  });

  function handleAdd(p: Product) {
    if (!session) {
      openAuth();
      return;
    }
    cartStore.add({
      id: p.id,
      name: p.name,
      price: p.price,
      whatsapp: p.whatsapp_contacto,
    });
    track("add_to_cart", {
      eventName: "add_to_cart",
      metadata: { productId: p.id, productName: p.name, price: p.price },
    });
    toast.success(`${p.name} agregado al carrito`);
    setCartOpen(true);
  }

  async function handleCheckout() {
    if (!session) {
      setCartOpen(false);
      openAuth();
      return;
    }
    if (cartItems.length === 0 || isOrderSubmitting || orderSubmissionRef.current) return;

    orderSubmissionRef.current = true;
    setIsOrderSubmitting(true);
    try {
      await createOrdersFn({
        data: {
          items: cartItems.map((it) => ({ id: it.id, name: it.name, quantity: it.quantity })),
        },
      });

      const msg = encodeURIComponent(buildCartWhatsAppMessage(cartItems, cartTotal));
      const waUrl = `https://wa.me/${WA_NUMBER}?text=${msg}`;
      openWhatsApp(waUrl);

      track("purchase", {
        eventName: "purchase",
        metadata: {
          value: cartTotal,
          currency: "PEN",
          itemCount: cartItems.length,
          items: cartItems.map((it) => ({
            id: it.id,
            name: it.name,
            qty: it.quantity,
            price: it.price,
          })),
        },
      });
      toast.success("Pedido registrado — continúa por WhatsApp");
      cartStore.clear();
      setCartOpen(false);
      if (panel === "compras") loadOrders();
    } catch (err) {
      console.error("Error saving orders:", err);
      toast.error("No se pudo registrar el pedido. Intenta de nuevo.");
    } finally {
      orderSubmissionRef.current = false;
      setIsOrderSubmitting(false);
    }
  }

  async function handleBuyNow(p: Product, quantity = 1) {
    if (!session) {
      openAuth();
      return;
    }
    if (isOrderSubmitting || orderSubmissionRef.current) return;

    orderSubmissionRef.current = true;
    setIsOrderSubmitting(true);
    try {
      await createOrdersFn({
        data: { items: [{ id: p.id, name: p.name, quantity }] },
      });

      const msg = encodeURIComponent(buildWhatsAppMessage(p, { quantity }));
      const waUrl = `https://wa.me/${p.whatsapp_contacto}?text=${msg}`;
      openWhatsApp(waUrl);

      track("purchase", {
        eventName: "buy_now",
        metadata: {
          productId: p.id,
          productName: p.name,
          value: p.price * quantity,
          currency: "PEN",
          quantity,
        },
      });
      toast.success("Pedido registrado — continúa por WhatsApp");
      if (panel === "compras") loadOrders();
    } catch (err) {
      console.error("Error saving order:", err);
      toast.error("No se pudo registrar el pedido. Intenta de nuevo.");
    } finally {
      orderSubmissionRef.current = false;
      setIsOrderSubmitting(false);
    }
  }

  const displayName =
    profile?.nombre_completo?.trim() || session?.user.email?.split("@")[0] || "usuario";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const safeDeliveryUrl = getSafeExternalUrl(selectedDelivery?.access_link ?? null);

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-background text-foreground">

      <StoreSidebar
        open={sidebarOpen}
        sessionActive={!!session}
        displayName={displayName}
        initials={initials}
        avatarUrl={profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null}
        activePanel={panel}
        activeCategory={activeCat}
        onClose={() => setSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
        onPanelSelect={handleSidebarPanel}
        onOpenWallet={handleWallet}
        onOpenAuth={openAuth}
        onUnavailable={handleUnavailableSection}
      />

      <div className="min-h-screen lg:pl-[190px]">

        {panel === "tienda" && (
          <div className="tienda-main-content">
            <PlatformNavigation
              activeCategory={activeCat}
              query={query}
              searchRef={searchRef}
              onCategorySelect={handleCategorySelect}
              onPlatformSelect={handlePlatformSelect}
              onQueryChange={setQuery}
              onGoShop={handleGoShop}
              onOpenAffiliate={handleAffiliate}
              onToggleSidebar={() => setSidebarOpen(true)}
            />
            <section className="mt-4 border-y border-border bg-background">
              <div className="max-w-[1600px] mx-auto flex items-center gap-3 px-4 py-3">
                <label className="relative flex h-9 min-w-0 flex-1 items-center rounded-lg border border-border bg-background pl-9 pr-3">
                  <Search className="absolute left-3 h-3.5 w-3.5 text-white/40" aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full bg-transparent text-xs text-white outline-none placeholder:text-white/35"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setFiltersOpen((value) => !value)}
                  aria-expanded={filtersOpen}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-[10px] font-bold text-white/85 transition hover:border-primary/60"
                >
                  <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                  Filtros
                </button>
              </div>
              {filtersOpen && (
                <div className="max-w-[1600px] mx-auto flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center">
                  <div className="relative w-full sm:w-64">
                    <select
                      value={sort}
                      onChange={(event) => setSort(event.target.value as SortKey)}
                      className="w-full appearance-none rounded-lg border border-border bg-background px-3 py-2.5 pr-9 text-[10px] font-bold uppercase tracking-wider text-white outline-none"
                    >
                      <option value="destacado">Todas las categorías</option>
                      <option value="precio-asc">Precio: Bajo a Alto</option>
                      <option value="precio-desc">Precio: Alto a Bajo</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/40" />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      playClick();
                      setActiveCat("todo");
                      setQuery("");
                      setSort("destacado");
                      searchRef.current?.focus();
                    }}
                    aria-label="Limpiar filtros"
                    className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white transition-all hover:border-primary/60"
                  >
                    <BarChart3 className="h-3.5 w-3.5" />
                    Limpiar filtros
                  </button>
                </div>
              )}
            </section>

            {/* El grid superior reemplaza la barra antigua */}
          </div>
        )}

        {panel === "tienda" && (
          <section id="catalogo" className="relative z-10 mt-4 pb-24">
            <div className="max-w-[1600px] mx-auto px-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[11px] font-black uppercase tracking-wider text-white">
                    {activeCat === "todo" ? "Todos los productos" : activeCat}
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 self-start rounded-lg border border-border bg-background px-2 py-1 text-[9px] font-bold text-white/65 sm:self-auto">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  {visible.length} productos disponibles
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="grid place-items-center rounded-xl border border-border bg-background p-10 text-center sm:p-16">
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg border border-border bg-background">
                    <Package className="w-6 h-6 text-white/70" />
                  </div>
                  <p className="text-sm text-white/60 mb-5">
                    No encontramos productos con esos filtros.
                  </p>
                  <button
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setActiveCat("todo");
                      setQuery("");
                      document
                        .getElementById("catalogo")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className="rounded-lg border border-border bg-background px-5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white transition hover:border-primary hover:text-primary"
                  >
                    Ver todo el catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                  {visible.map((p) => (
                    <article
                      key={p.id}
                      className="product-card group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors duration-300 hover:border-red-accent/60"
                    >
                      <div className="relative aspect-[1.2/1] overflow-hidden bg-background group/img">
                        {p.image && !p.image.includes("/placeholder.svg") ? (
                          <img
                            src={p.image}
                            alt={`Portada de ${p.name}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none sm:group-hover/img:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-background">
                            <Package className="w-6 sm:w-10 h-6 sm:h-10 text-white/10" />
                          </div>
                        )}

                        <div className="pointer-events-none absolute left-1 top-1 flex flex-col gap-1">
                          <span className="bg-emerald-500 px-1.5 py-0.5 text-[7px] font-black text-white">
                            Renovable
                          </span>
                        </div>
                        <div className="pointer-events-none absolute right-1 top-1">
                          <span className="bg-red-accent px-1.5 py-0.5 text-[7px] font-black text-white">
                            {p.duracion}
                          </span>
                        </div>
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-red-accent/95 px-2 py-1 text-center text-[7px] font-black uppercase tracking-wide text-white">
                          Entrega inmediata
                        </div>

                        {/* Detail Overlay Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelected(p);
                          }}
                          onMouseEnter={playHover}
                          className="absolute inset-0 grid place-items-center bg-black/25 opacity-100 transition-opacity duration-300 sm:bg-black/45 sm:opacity-0 sm:group-hover/img:opacity-100"
                        >
                          <div className="rounded-lg bg-background px-3 py-1 text-[6px] font-black uppercase tracking-[0.1em] text-white transition-transform duration-500 sm:px-4 sm:py-1.5 sm:text-[9px] sm:translate-y-4 sm:group-hover/img:translate-y-0">
                            Ver detalles
                          </div>
                        </button>
                      </div>

                      <div className="flex flex-1 flex-col p-2">
                        <div className="mb-2 flex items-center gap-1.5">
                          <div className="grid h-5 w-5 shrink-0 place-items-center overflow-hidden rounded-full bg-white/10 text-[7px] font-black text-white">
                            {p.supplier_avatar_url ? (
                              <img src={p.supplier_avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              p.vendedor.slice(0, 1).toUpperCase()
                            )}
                          </div>
                          <span className="truncate text-[8px] font-bold text-white/75">{p.vendedor}</span>
                          {p.supplier_verified && <BadgeCheck className="h-3 w-3 shrink-0 text-red-accent" />}
                        </div>
                        <div className="mb-2">
                          <h3 className="mb-0.5 line-clamp-2 text-[11px] font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-red-accent sm:text-xs">
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[8px] font-medium uppercase tracking-wider text-white/40">
                            <span className="flex items-center gap-1">
                              <Clapperboard className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                              <span className="hidden min-[380px]:inline">{p.duracion}</span>
                              <span className="inline min-[380px]:hidden">30D</span>
                            </span>
                            <span className="w-0.5 h-0.5 rounded-full bg-white/10" />
                            <span className="flex items-center gap-1">
                              <BadgeCheck className="w-2 sm:w-2.5 h-2 sm:h-2.5" />
                              <span className="hidden sm:inline">Inmediata</span>
                              <span className="inline sm:hidden">Stock</span>
                            </span>
                          </div>
                        </div>

                        {(() => {
                          const stock = getProductStock(p.id, stockLevels);
                          return (
                            <div className="mt-auto border-t border-border pt-2">
                              <div className="flex items-end justify-between gap-2">
                                <div>
                                  <span className="block text-[7px] font-bold uppercase tracking-wider text-white/35">Precio</span>
                                  <span className="text-sm font-black leading-none text-white">S/ {p.price.toFixed(2)}</span>
                                </div>
                                <span
                                  className={`inline-flex items-center gap-1 px-1.5 py-1 text-[7px] font-black text-white ${
                                    stock.available ? "bg-emerald-500" : "bg-red-accent"
                                  }`}
                                >
                                  <span className="h-1 w-1 rounded-full bg-white" />
                                  {stock.available
                                    ? stock.count != null
                                      ? `${stock.count} Stock`
                                      : "Stock"
                                    : "Agotado"}
                                </span>
                              </div>
                              <div className="mt-2 flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    setSelected(p);
                                  }}
                                  className="flex h-7 flex-1 items-center justify-center rounded-lg border border-border bg-background text-[8px] font-black uppercase text-white/80 transition hover:border-primary/60"
                                >
                                  Detalles
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    playClick();
                                    handleAdd(p);
                                  }}
                                  className="grid h-7 w-7 place-items-center rounded-lg bg-red-accent text-white transition hover:brightness-110"
                                  aria-label="Agregar al carrito"
                                >
                                  <ShoppingCart className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {panel === "compras" && (
          <PurchasesPanel
            loading={loadingOrders}
            orders={orders}
            onGoShop={() => setPanel("tienda")}
            onShowDelivery={(d) => setSelectedDelivery(d)}
          />
        )}

        {panel === "perfil" && profile && userId && (
          <ProfilePanel
            userId={userId}
            initials={initials}
            profile={profile}
            email={session!.user.email ?? ""}
            onSaved={(p) => setProfile({ ...profile, ...p })}
            onAvatarUpdate={fetchProfile}
          />
        )}

        {/* Floating buttons */}
        <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col gap-2.5 sm:gap-3">
          <a
            onMouseEnter={playHover}
            onClick={playClick}
            href={`https://wa.me/${WA_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] grid place-items-center hover:scale-110 transition"
            aria-label="WhatsApp"
          >
            <MessageCircle className="w-5 h-5 text-white" />
          </a>
          <button
            onMouseEnter={playHover}
            onClick={() => {
              playClick();
              if (navigator.share) {
                navigator
                  .share({ title: "CMD Streaming", url: window.location.href })
                  .catch(() => {});
              } else {
                void copyText(window.location.href, "Enlace copiado");
              }
            }}
            className="w-11 h-11 sm:w-12 sm:h-12 bg-red-accent grid place-items-center hover:brightness-110 transition"
            aria-label="Compartir"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <AuthModal
          open={authOpen}
          initialMode={authMode}
          onClose={() => {
            setAuthOpen(false);
            setAuthMode("login");
          }}
        />
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          onCheckout={handleCheckout}
          checkoutPending={isOrderSubmitting}
        />

        <KeyboardShortcuts
          authed={!!session}
          onFocusSearch={focusCatalogSearch}
          onToggleCart={() => setCartOpen((v) => !v)}
          onGoPanel={(p) => setPanel(p)}
          onGoHome={() => router.navigate({ to: "/" })}
          onOpenTutorial={() => setTutorialOpen(true)}
        />

        <KeyboardTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />

        <ProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onAddToCart={(p) => {
            handleAdd(p);
            setSelected(null);
          }}
          onBuyNow={(p) => {
            handleBuyNow(p);
          }}
          onLoginRequired={session ? undefined : () => openAuth()}
          isBuying={isOrderSubmitting}
        />

        {/* Modal de Credenciales para el Usuario */}
        {selectedDelivery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => {
                setSelectedDelivery(null);
                setShowPass(false);
              }}
            />
            <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-border bg-background animate-scale-in">
              <div className="flex items-center justify-between border-b border-border bg-background p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Credenciales de Acceso</h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider font-bold">
                      Entrega Protegida
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedDelivery(null);
                    setShowPass(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-colors hover:border-primary/60 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-4">
                  {selectedDelivery.email && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                        Email / Usuario
                      </label>
                      <div className="relative group">
                        <input
                          readOnly
                          value={selectedDelivery.email}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-white transition-all focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            void copyText(selectedDelivery.email ?? "");
                          }}
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-all hover:border-primary/60 hover:text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedDelivery.password && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                        Contraseña
                      </label>
                      <div className="relative group">
                        <input
                          type={showPass ? "text" : "password"}
                          readOnly
                          value={selectedDelivery.password}
                          className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-white transition-all focus:outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() => setShowPass(!showPass)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-all hover:border-primary/60 hover:text-white"
                          >
                            {showPass ? (
                              <EyeOff className="w-3.5 h-3.5" />
                            ) : (
                              <EyeIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              void copyText(selectedDelivery.password ?? "");
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-all hover:border-primary/60 hover:text-white"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {safeDeliveryUrl && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                        Enlace de Acceso
                      </label>
                      <a
                        href={safeDeliveryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-between rounded-lg border border-primary/30 bg-background px-4 py-3 text-sm font-bold text-primary transition-all hover:border-primary"
                      >
                        <span>Abrir Plataforma</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {selectedDelivery.notes && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                        Notas del Administrador
                      </label>
                      <div className="w-full whitespace-pre-line rounded-lg border border-border bg-background px-4 py-3 text-sm italic leading-relaxed text-white/80">
                        {selectedDelivery.notes}
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-[10px] text-center text-white/20 italic">
                    Si tienes problemas con estas credenciales, contáctanos por WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PurchasesPanel({
  loading,
  orders,
  onGoShop,
  onShowDelivery,
}: {
  loading: boolean;
  orders: StoreOrder[];
  onGoShop: () => void;
  onShowDelivery: (delivery: DeliveryDetails) => void;
}) {
  const { playHover, playClick } = useFuturisticSound();
  const queryClient = useQueryClient();
  const { data: ratingInfo = [] } = useQuery({
    queryKey: ["my-order-ratings"],
    queryFn: () => getMyOrderRatings(),
  });
  const infoByOrder = useMemo(
    () =>
      new Map<string, SupplierRatingInfo>(ratingInfo.map((rating) => [rating.order_id, rating])),
    [ratingInfo],
  );
  const rateMutation = useMutation({
    mutationFn: (vars: { order_id: string; rating: number }) => rateOrderSupplier({ data: vars }),
    onSuccess: () => {
      toast.success("¡Gracias por calificar a tu proveedor!");
      queryClient.invalidateQueries({ queryKey: ["my-order-ratings"] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "No se pudo enviar la calificación"),
  });

  const renderStars = (orderId: string) => {
    const info = infoByOrder.get(orderId);
    if (!info) return <span className="text-[10px] text-white/25">—</span>;
    return (
      <div className="flex items-center gap-1.5" title={`Proveedor: ${info.supplier_name}`}>
        <ProviderAvatar
          src={info.supplier_avatar_url}
          effect={info.supplier_avatar_effect}
          size="sm"
          className="scale-[0.55] -mx-2"
          alt={`Avatar de ${info.supplier_name}`}
        />
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => {
              playClick();
              rateMutation.mutate({ order_id: orderId, rating: n });
            }}
            className="p-0.5 transition-transform hover:scale-110"
            aria-label={`Calificar con ${n} estrellas`}
          >
            <Star
              className={`w-3.5 h-3.5 ${info.rating && n <= info.rating ? "text-yellow-400 fill-yellow-400" : "text-white/25"}`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <section className="mt-6 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">Mis Compras</h1>
          <span className="text-xs text-white/70">
            {orders.length} pedido{orders.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="grid place-items-center rounded-xl glass-card p-10">
            <Loader2 className="w-6 h-6 text-white/78 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="grid place-items-center rounded-xl border-2 border-dashed border-border bg-background p-10 text-center sm:p-16">
            <div className="mb-4 grid h-16 w-16 place-items-center rounded-lg border border-border bg-background">
              <Package className="w-8 h-8 text-white/70" />
            </div>
            <p className="text-sm text-white/70 mb-4">Aún no tienes pedidos.</p>
            <button
              onMouseEnter={playHover}
              onClick={() => {
                playClick();
                onGoShop();
              }}
              className="px-5 py-2.5 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 transition"
            >
              Explorar catálogo
            </button>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-xl glass-card sm:block">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.03] text-white/78 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-4 py-3">Producto</th>
                    <th className="text-left px-4 py-3">Precio</th>
                    <th className="text-left px-4 py-3">Estado</th>
                    <th className="text-left px-4 py-3">Adquirido</th>
                    <th className="text-left px-4 py-3">Vencimiento</th>
                    <th className="text-left px-4 py-3">Calificar</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white">{o.producto_nombre}</td>
                      <td className="px-4 py-3 text-white/80">S/ {Number(o.precio).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${estadoStyles[o.estado]}`}
                          >
                            {o.estado}
                          </span>
                          {o.delivery && (
                            <button
                              onClick={() => {
                                playClick();
                                if (o.delivery) onShowDelivery(o.delivery);
                              }}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                            >
                              <Key className="w-3 h-3" />
                              Ver credenciales
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-white/78">
                        {o.fecha_adquisicion
                          ? new Date(o.fecha_adquisicion).toLocaleDateString()
                          : new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-white/78 font-bold">
                        {o.fecha_vencimiento
                          ? new Date(o.fecha_vencimiento).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3">{renderStars(o.id)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {orders.map((o) => (
                <div key={o.id} className="rounded-xl glass-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white leading-tight">
                      {o.producto_nombre}
                    </p>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${estadoStyles[o.estado]}`}
                      >
                        {o.estado}
                      </span>
                      {o.delivery && (
                        <button
                          onClick={() => {
                            playClick();
                            if (o.delivery) onShowDelivery(o.delivery);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
                        >
                          <Key className="w-3 h-3" />
                          Ver credenciales
                        </button>
                      )}
                    </div>
                  </div>
                  {infoByOrder.get(o.id) && (
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider">
                        Calificar
                      </span>
                      {renderStars(o.id)}
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="font-display text-base text-white">
                      S/ {Number(o.precio).toFixed(2)}
                    </span>
                    <div className="flex flex-col items-end text-[10px] text-white/50">
                      <span>
                        Adquirido:{" "}
                        {o.fecha_adquisicion || new Date(o.created_at).toLocaleDateString()}
                      </span>
                      {o.fecha_vencimiento && (
                        <span className="text-red-400">Vence: {o.fecha_vencimiento}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ProfilePanel({
  userId,
  initials,
  profile,
  email,
  onSaved,
  onAvatarUpdate,
}: {
  userId: string;
  initials: string;
  profile: Profile;
  email: string;
  onSaved: (p: Profile) => void;
  onAvatarUpdate?: () => void;
}) {
  const { playHover, playClick } = useFuturisticSound();
  const [nombre, setNombre] = useState(profile.nombre_completo);
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setNombre(profile.nombre_completo);
    setWhatsapp(profile.whatsapp);
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    if (!/^[0-9+\s()-]{7,}$/.test(whatsapp)) {
      toast.error("Número de WhatsApp inválido");
      return;
    }
    setSaving(true);
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user.id;
    if (!uid) {
      setSaving(false);
      toast.error("Sesión no válida");
      return;
    }
    const payload = { id: uid, nombre_completo: nombre.trim(), whatsapp: whatsapp.trim() };
    const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      console.error("Profile save failed", error);
      toast.error("No se pudo guardar, pero puedes seguir navegando");
      return;
    }
    onSaved({ nombre_completo: payload.nombre_completo, whatsapp: payload.whatsapp });
    toast.success("Perfil actualizado");
  }

  return (
    <section className="mt-6 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="font-display text-2xl text-white uppercase tracking-wide mb-4">Mi Perfil</h1>
        <div className="mb-4 rounded-xl glass-card p-5 sm:p-6">
          <AvatarUploader
            userId={userId}
            fallbackInitials={initials}
            onUploaded={() => {
              onAvatarUpdate?.();
            }}
          />
        </div>
        <form onSubmit={handleSave} className="space-y-4 rounded-xl glass-card p-5 sm:p-6">
          <div>
            <label className="text-xs text-white/78 uppercase tracking-wider">Correo</label>
            <div className="mt-1.5 relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-sm text-white/78"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/78 uppercase tracking-wider">
              Nombre completo
            </label>
            <div className="mt-1.5 relative">
              <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/74 transition focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/78 uppercase tracking-wider">WhatsApp</label>
            <div className="mt-1.5 relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" />
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+51 999 999 999"
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-3 text-sm text-white placeholder:text-white/74 transition focus:border-primary/60 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            onMouseEnter={playHover}
            onClick={() => playClick()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 disabled:opacity-60 disabled:hover:scale-100 transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </form>
      </div>
    </section>
  );
}
