import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Share2,
  MessageCircle,
  Mail,
  X,
  Loader2,
  Save,
  User as UserIcon,
  Phone,
  ChevronLeft,
  ChevronRight,
  Key,
  Check,
  Copy,
  Eye as EyeIcon,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import {
  products,
  platformShortcuts,
  estadoStyles,
  WA_NUMBER,
  type Product,
  type PanelTab,
  type Profile,
  type Order,
  type PlatformShortcut,
  getAvatarUrl,
} from "@/components/tienda/data";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AuthMode } from "@/components/AuthModal";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { useRouter } from "@tanstack/react-router";
import { cartStore, useCart } from "@/lib/cart-store";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useFuturisticSound } from "@/hooks/useSound";
import { useServerFn } from "@tanstack/react-start";
import { createOrders } from "@/lib/orders.functions";
import type { Tables } from "@/integrations/supabase/types";
import { getAuthDestination } from "@/lib/auth-destination";
import { cn } from "@/lib/utils";
import { PlatformNavigation } from "@/components/tienda/PlatformNavigation";
import { AppTopbar } from "@/components/layout/AppTopbar";
import {
  ProductCatalogCard,
  ProductCatalogCardSkeleton,
} from "@/components/tienda/ProductCatalogCard";
import {
  CatalogToolbar,
  type CatalogFilters,
  type CatalogSortKey,
} from "@/components/tienda/CatalogToolbar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  SupportTicketsPanel,
  type SupportTicketPrefill,
} from "@/components/tienda/SupportTicketsPanel";
import { StoreSidebar } from "@/components/tienda/StoreSidebar";
import { WalletRechargeModal } from "@/components/tienda/WalletRechargeModal";
import { SocialServicesPanel } from "@/components/tienda/SocialServicesPanel";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { StorefrontManagement } from "@/components/storefront/StorefrontManagement";
import { useAuthState } from "@/hooks/useAuthState";
import {
  RequestTimeoutError,
  UI_REQUEST_TIMEOUT_MS,
  withRequestTimeout,
} from "@/lib/request-timeout";
import { QueryErrorState } from "@/components/ui/loading-states";

const AuthModal = React.lazy(() =>
  import("@/components/AuthModal").then(({ AuthModal: Component }) => ({ default: Component })),
);
const CartDrawer = React.lazy(() =>
  import("@/components/CartDrawer").then(({ CartDrawer: Component }) => ({ default: Component })),
);
const KeyboardTutorial = React.lazy(() =>
  import("@/components/KeyboardTutorial").then(({ KeyboardTutorial: Component }) => ({
    default: Component,
  })),
);
const ProductModal = React.lazy(() =>
  import("@/components/ProductModal").then(({ ProductModal: Component }) => ({
    default: Component,
  })),
);
const AvatarUploader = React.lazy(() =>
  import("@/components/AvatarUploader").then(({ AvatarUploader: Component }) => ({
    default: Component,
  })),
);
const ClientsPanel = React.lazy(() =>
  import("@/components/tienda/ClientsPanel").then(({ ClientsPanel: Component }) => ({
    default: Component,
  })),
);

type CatalogProduct = Product & {
  serviceId: string | null;
  durationDays: number;
  isRenewable: boolean;
  totalSold: number;
  accountType: "completa" | "perfil";
  accessScope: "global" | "regional";
  isCatalogAvailable: boolean;
  publisherName: string | null;
  totalViews: number;
  createdAt: string | null;
};

const categoryAliases: Record<string, string> = {
  musica: "music",
  música: "music",
  juegos: "videojuegos",
  videojuegos: "videojuegos",
  inteligencia_artificial: "ia",
};

function toCatalogCategory(category: string): PlatformShortcut["categoryId"] {
  const normalized = (categoryAliases[category.toLowerCase()] || category.toLowerCase()).trim();
  const knownCategories = new Set([
    "todo",
    "combos",
    "streaming",
    "ia",
    "apps",
    "licencias",
    "cursos",
    "recargas",
    "videojuegos",
    "giftcards",
    "invitaciones",
    "music",
    "adult",
    "iptv",
    "redes",
  ]);
  return (knownCategories.has(normalized) ? normalized : "todo") as PlatformShortcut["categoryId"];
}

function toPlatformSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeCatalogSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function getDurationLabel(days: number) {
  const commonDurations: Record<number, string> = {
    30: "1 mes",
    90: "3 meses",
    180: "6 meses",
    365: "12 meses",
  };
  return commonDurations[days] ?? `${days} días`;
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    combos: "Packs Premium",
    streaming: "Streaming",
    ia: "Inteligencia Artificial",
    apps: "Aplicaciones",
    licencias: "Licencias",
    cursos: "Cursos",
    recargas: "Recargas",
    videojuegos: "Juegos",
    giftcards: "Giftcards",
    invitaciones: "Invitaciones",
    music: "Música",
    adult: "Adultos",
    iptv: "IPTV",
    redes: "Redes Sociales",
  };
  return labels[category] ?? category;
}

const EMPTY_CATALOG_FILTERS: CatalogFilters = {
  minPrice: "",
  maxPrice: "",
  durationDays: [],
  availableOnly: false,
  renewalTypes: [],
};

const CATALOG_RENDER_PAGE_SIZE = 42;


type SidebarPlaceholderPanel = Exclude<
  PanelTab,
  "tienda" | "mi-tienda" | "compras" | "perfil" | "soporte" | "clientes"
>;

const sidebarPlaceholderContent: Record<
  SidebarPlaceholderPanel,
  { title: string; description: string; eyebrow: string }
> = {
  buzon: {
    title: "Buzón",
    description: "Tus mensajes, avisos y actualizaciones comerciales aparecerán en este espacio.",
    eyebrow: "Mi Negocio",
  },
  publicidad: {
    title: "Publicidad",
    description: "Encuentra recursos y estrategias para promocionar tu negocio digital.",
    eyebrow: "Academia",
  },
  cursos: {
    title: "Cursos",
    description: "Muy pronto tendrás cursos prácticos para hacer crecer tus ventas.",
    eyebrow: "Academia",
  },
  meets: {
    title: "Meets",
    description: "Las próximas sesiones y encuentros de la comunidad se mostrarán aquí.",
    eyebrow: "Academia",
  },
};

function isSidebarPlaceholderPanel(panel: PanelTab): panel is SidebarPlaceholderPanel {
  return (
    panel !== "tienda" &&
    panel !== "mi-tienda" &&
    panel !== "compras" &&
    panel !== "perfil" &&
    panel !== "soporte" &&
    panel !== "clientes"
  );
}

const SIDEBAR_COLLAPSED_STORAGE_KEY = "cmd-tienda-sidebar-collapsed";

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

function normalizeOrderStatus(status: string | null): Order["estado"] {
  if (status === "pagado" || status === "entregado" || status === "cancelado") return status;
  return "pendiente";
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getProductStock(
  product: Pick<Product, "id"> & { isCatalogAvailable?: boolean },
  stockLevels: Record<string, number>,
): { available: boolean; count: number | null } {
  const id = String(product.id);
  const isCatalogAvailable = product.isCatalogAvailable ?? true;
  if (!isCatalogAvailable) {
    return { available: false, count: UUID_RE.test(id) ? (stockLevels[id] ?? 0) : null };
  }
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
    return true;
  } catch {
    toast.error("No se pudo copiar. Selecciona el texto manualmente.");
    return false;
  }
}

function DeliveryCopyButton({
  value,
  label,
  className,
}: {
  value: string;
  label: string;
  className: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    },
    [],
  );

  const handleCopy = async () => {
    const wasCopied = await copyText(value, `${label} copiado`);
    if (!wasCopied) return;

    setCopied(true);
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={className}
      aria-label={copied ? `${label} copiado` : `Copiar ${label}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 animate-in zoom-in-50 duration-200" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

function openWhatsApp(url: string) {
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  if (!popup) toast.info("Permite las ventanas emergentes para continuar por WhatsApp.");
}

export function TiendaPage({
  catalogOnly = false,
  redirectAuthenticatedRoles = true,
  initialCategory = "todo",
  initialPanel = "tienda",
}: {
  catalogOnly?: boolean;
  redirectAuthenticatedRoles?: boolean;
  initialCategory?: string;
  initialPanel?: PanelTab;
} = {}) {
  const { session, lastEvent } = useAuthState();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [activeCat, setActiveCat] = useState(initialCategory);
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sort, setSort] = useState<CatalogSortKey>("recent");
  const [catalogFilters, setCatalogFilters] = useState<CatalogFilters>(EMPTY_CATALOG_FILTERS);
  const [catalogPage, setCatalogPage] = useState(1);
  const { count: cartCount, items: cartItems, total: cartTotal } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [panel, setPanel] = useState<PanelTab>(initialPanel);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isOrderSubmitting, setIsOrderSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  // El SSR y el primer render del navegador deben producir el mismo árbol.
  // Las consultas que requieren el cliente se habilitan después de hidratar.
  const [isClientMounted, setIsClientMounted] = useState(false);
  const [catalogRequestTimedOut, setCatalogRequestTimedOut] = useState(false);
  const [supportTicketPrefill, setSupportTicketPrefill] = useState<SupportTicketPrefill | null>(
    null,
  );
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const track = useAnalytics();
  const createOrdersFn = useServerFn(createOrders);
  const {
    isAdmin,
    isProvider,
    isDistributor,
    loading: isRoleLoading,
  } = useIsAdmin();

  const { playHover, playClick } = useFuturisticSound();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetails | null>(null);
  const [showPass, setShowPass] = useState(false);
  const ordersRequestId = useRef(0);
  const orderSubmissionRef = useRef(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  useEffect(() => {
    try {
      setSidebarCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true");
    } catch {
      // El catálogo sigue siendo totalmente usable aunque el navegador bloquee el almacenamiento local.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(sidebarCollapsed));
    } catch {
      // No es necesario interrumpir la navegación si la preferencia no se puede guardar.
    }
  }, [sidebarCollapsed]);

  const handleSidebarToggle = useCallback(() => {
    if (window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarCollapsed((value) => !value);
      return;
    }
    setSidebarOpen(true);
  }, []);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  useEffect(() => {
    const mode = new URLSearchParams(window.location.search).get("auth");
    if (mode !== "login" && mode !== "forgot") return;

    openAuth(mode);
    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, [openAuth]);

  const scrollToCatalog = useCallback(() => {
    requestAnimationFrame(() => {
      document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const focusCatalogSearch = useCallback(() => {
    setPanel("tienda");
    requestAnimationFrame(() => searchRef.current?.focus());
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timeoutId);
  }, [query]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      playClick();
      setActiveCat(categoryId);
      setActiveServiceId(null);
      setQuery("");
      setDebouncedQuery("");
      scrollToCatalog();
    },
    [playClick, scrollToCatalog],
  );

  const handlePlatformSelect = useCallback(
    (platform: PlatformShortcut) => {
      playClick();
      setActiveCat(platform.categoryId);
      setActiveServiceId(platform.serviceId ?? null);
      setQuery(platform.searchTerm);
      setDebouncedQuery(platform.searchTerm);
      scrollToCatalog();
    },
    [playClick, scrollToCatalog],
  );

  const handleGoShop = useCallback(() => {
    playClick();
    setPanel("tienda");
    setActiveCat("todo");
    setActiveServiceId(null);
    setQuery("");
    setDebouncedQuery("");
    scrollToCatalog();
  }, [playClick, scrollToCatalog]);

  const handleWallet = useCallback(() => {
    playClick();
    if (!session) {
      openAuth();
      return;
    }
    setWalletOpen(true);
  }, [openAuth, playClick, session]);

  const handleSidebarPanel = useCallback(
    (nextPanel: PanelTab) => {
      if (catalogOnly && nextPanel !== "tienda") {
        toast.info("Tu cuenta tiene acceso únicamente al catálogo.");
        return;
      }
      playClick();
      setPanel(nextPanel);
    },
    [catalogOnly, playClick],
  );

  const handleOpenAdmin = useCallback(() => {
    if (!isAdmin) return;
    setSidebarOpen(false);
    void router.navigate({ to: "/admin" });
  }, [isAdmin, router]);

  const handleOpenStorefront = useCallback(() => {
    setSidebarOpen(false);
    if (isAdmin) {
      void router.navigate({ to: "/admin/mi-tienda" });
      return;
    }
    if (isProvider) {
      void router.navigate({ to: "/proveedor/mi-tienda" });
      return;
    }
    if (isDistributor) {
      void router.navigate({ to: "/distribuidor/mi-tienda" });
      return;
    }
    toast.error("Tu cuenta no tiene acceso a la gestión de Mi Tienda.");
  }, [isAdmin, isDistributor, isProvider, router]);

  const handleSignOut = useCallback(async () => {
    setSidebarOpen(false);
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast.error("No se pudo cerrar la sesión. Inténtalo nuevamente.");
      return;
    }

    setProfile(null);
    await router.navigate({ to: "/" });
  }, [router]);

  const handleUnavailableSection = useCallback((section: string) => {
    toast.info(`${section} estará disponible próximamente.`);
  }, []);

  useEffect(() => {
    let active = true;

    if (lastEvent === "PASSWORD_RECOVERY") {
      setAuthMode("update");
      setAuthOpen(true);
    }

    if (!session || !consumePendingOAuthRedirect()) return () => {
      active = false;
    };

    void (async () => {
      const to = await getAuthDestination(session.user.id);
      if (active && to !== router.state.location.pathname) await router.navigate({ to });
    })();

    return () => {
      active = false;
    };
  }, [lastEvent, router, session]);

  const userId = session?.user.id;

  useEffect(() => {
    if (catalogOnly || !redirectAuthenticatedRoles || !userId) return;
    let cancelled = false;

    void getAuthDestination(userId).then((destination) => {
      if (!cancelled) void router.navigate({ to: destination });
    });

    return () => {
      cancelled = true;
    };
  }, [catalogOnly, redirectAuthenticatedRoles, router, userId]);

  const walletBalanceQuery = useQuery({
    queryKey: ["wallet-balance", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_balances")
        .select("saldo_pen")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return Number(data?.saldo_pen ?? 0);
    },
    refetchInterval: 30_000,
  });
  const walletBalance = walletBalanceQuery.data ?? 0;

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nombre_completo, whatsapp, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
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
    } catch {
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
    setWalletOpen(false);
    setSupportTicketPrefill(null);
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
    if (!session && initialPanel === "tienda") setPanel("tienda");
  }, [initialPanel, session]);

  // Load products from DB
  const {
    data: dbProducts = [],
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await withRequestTimeout(
        Promise.resolve(
          supabase
            .from("products")
            .select(
              "id, name, category, price, image_url, icon_id, description, descripcion_larga, duration_days, is_renewable, is_catalog_available, total_vendidos, total_vistas, account_type, access_scope, publisher_name, created_at, service_id",
            )
            .eq("is_active", true)
            .order("created_at", { ascending: false }),
        ),
      );
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    // El catálogo es público: debe intentar la consulta incluso si el navegador
    // informa erróneamente un estado offline. De otro modo React Query la deja
    // pausada en `pending` y las tarjetas nunca salen del skeleton.
    networkMode: "always",
    // No habilitar en el primer render del navegador: debe coincidir con SSR.
    enabled: isClientMounted,
  });

  const {
    data: managedPlatforms = [],
    isError: isManagedPlatformsError,
    error: managedPlatformsError,
    refetch: refetchManagedPlatforms,
  } = useQuery({
    queryKey: ["public-managed-platforms"],
    queryFn: async () => {
      const { data, error } = await withRequestTimeout(
        Promise.resolve(
          supabase
            .from("servicios_streaming")
            .select("id, nombre, slug, categoria, icon_url, display_order")
            .eq("is_visible", true)
            .order("display_order")
            .order("nombre"),
        ),
      );
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    networkMode: "always",
    enabled: isClientMounted,
  });

  const navigationPlatforms = useMemo(() => {
    const managedBySlug = new Map(
      managedPlatforms.map((service) => [
        service.slug,
        {
          label: service.nombre,
          categoryId: toCatalogCategory(service.categoria),
          searchTerm: service.nombre,
          fallback: service.nombre.slice(0, 2).toUpperCase(),
          serviceId: service.id,
          iconUrl: service.icon_url,
        } satisfies PlatformShortcut,
      ]),
    );

    const knownSlugs = new Set(platformShortcuts.map((platform) => toPlatformSlug(platform.label)));
    const resolvedExisting = platformShortcuts.map(
      (platform) => managedBySlug.get(toPlatformSlug(platform.label)) ?? platform,
    );
    const newPlatforms = [...managedBySlug.entries()]
      .filter(([slug]) => !knownSlugs.has(slug))
      .map(([, platform]) => platform);

    return [...resolvedExisting, ...newPlatforms];
  }, [managedPlatforms]);

  const allProducts = useMemo(() => {
    return dbProducts.map<CatalogProduct>((p) => ({
      id: p.id,
      name: p.name,
      category: p.category?.toLowerCase() || "streaming",
      price: p.price,
      image: p.image_url || "/placeholder.svg",
      iconId: p.icon_id,
      description: p.description || "",
      whatsapp_contacto: WA_NUMBER,
      duracion: getDurationLabel(p.duration_days ?? 30),
      shortLabel: p.name.toUpperCase(),
      descripcion_larga: p.descripcion_larga || p.description || "Sin descripción detallada.",
      horario_atencion_inicio: "09:00",
      horario_atencion_fin: "22:00",
      serviceId: p.service_id,
      durationDays: p.duration_days ?? 30,
      isRenewable: p.is_renewable ?? true,
      isCatalogAvailable: p.is_catalog_available ?? true,
      totalSold: p.total_vendidos ?? 0,
      totalViews: p.total_vistas ?? 0,
      accountType: p.account_type === "perfil" ? "perfil" : "completa",
      accessScope: p.access_scope === "regional" ? "regional" : "global",
      publisherName: p.publisher_name?.trim() || null,
      createdAt: p.created_at,
    }));
  }, [dbProducts]);

  const priceBounds = useMemo(() => {
    if (allProducts.length === 0) return { min: 0, max: 0 };
    const prices = allProducts.map((product) => product.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [allProducts]);

  const durationOptions = useMemo(
    () =>
      Array.from(new Set([30, 90, 180, 365, ...allProducts.map((product) => product.durationDays)]))
        .sort((a, b) => a - b)
        .map((days) => ({ days, label: getDurationLabel(days) })),
    [allProducts],
  );

  const searchSuggestions = useMemo(() => {
    const normalizedQuery = normalizeCatalogSearch(debouncedQuery);
    if (!normalizedQuery) return [];

    return allProducts
      .filter((product) => normalizeCatalogSearch(product.name).includes(normalizedQuery))
      .slice(0, 6)
      .map((product) => ({
        id: String(product.id),
        name: product.name,
        price: product.price,
        categoryLabel: getCategoryLabel(product.category),
        iconId: product.iconId ?? null,
      }));
  }, [allProducts, debouncedQuery]);

  const catalogCandidates = useMemo(() => {
    const normalizedQuery = normalizeCatalogSearch(debouncedQuery);
    const minPrice = catalogFilters.minPrice === "" ? null : Number(catalogFilters.minPrice);
    const maxPrice = catalogFilters.maxPrice === "" ? null : Number(catalogFilters.maxPrice);

    return allProducts.filter((p) => {
      const matchesCategory = activeServiceId
        ? true
        : activeCat === "todo"
          ? p.category !== "redes"
          : p.category === activeCat;
      const matchesService =
        !activeServiceId ||
        p.serviceId === activeServiceId ||
        (normalizedQuery !== "" && normalizeCatalogSearch(p.name).includes(normalizedQuery));
      const matchesSearch =
        activeServiceId ||
        normalizedQuery === "" ||
        normalizeCatalogSearch(p.name).includes(normalizedQuery);
      const matchesMinPrice = minPrice == null || !Number.isFinite(minPrice) || p.price >= minPrice;
      const matchesMaxPrice = maxPrice == null || !Number.isFinite(maxPrice) || p.price <= maxPrice;
      const matchesDuration =
        catalogFilters.durationDays.length === 0 ||
        catalogFilters.durationDays.includes(p.durationDays);
      const matchesRenewal =
        catalogFilters.renewalTypes.length === 0 ||
        catalogFilters.renewalTypes.includes(p.isRenewable ? "renewable" : "nonrenewable");

      return (
        matchesCategory &&
        matchesService &&
        matchesSearch &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesDuration &&
        matchesRenewal
      );
    });
  }, [allProducts, activeCat, activeServiceId, catalogFilters, debouncedQuery]);

  // Fetch stock for the complete catalog. Cart and product details can stay valid
  // even when the user changes category or applies a search filter.
  const stockIds = useMemo(
    () => allProducts.map((p) => String(p.id)).filter((id) => UUID_RE.test(id)),
    [allProducts],
  );

  const {
    data: stockLevels = {},
    isLoading: isStockLoading,
    isError: isStockError,
    error: stockError,
    refetch: refetchStock,
  } = useQuery({
    queryKey: ["inventory-stock", stockIds],
    queryFn: async () => {
      if (stockIds.length === 0) return {};
      // Aggregate-only table: exposes available counts, never account credentials
      const { data, error } = await withRequestTimeout(
        Promise.resolve(
          supabase.from("product_stock").select("product_id, available").in("product_id", stockIds),
        ),
      );
      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((row) => {
        counts[row.product_id] = row.available;
      });
      return counts;
    },
    enabled: isClientMounted && stockIds.length > 0,
    networkMode: "always",
    refetchInterval: 30000, // Refetch every 30s
  });

  const { data: catalogActivity = [] } = useQuery({
    queryKey: ["catalog-product-activity", stockIds],
    queryFn: async () => {
      if (stockIds.length === 0) return [];
      const { data, error } = await withRequestTimeout(
        supabase.rpc("get_catalog_product_activity", { _product_ids: stockIds }),
      );
      if (error) throw error;
      return data ?? [];
    },
    enabled: isClientMounted && stockIds.length > 0,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
    networkMode: "always",
  });

  const lastSaleByProduct = useMemo(
    () => new Map(catalogActivity.map((activity) => [activity.product_id, activity.last_sale_at])),
    [catalogActivity],
  );

  const visible = useMemo(() => {
    const list = catalogCandidates.filter(
      (product) =>
        !catalogFilters.availableOnly || getProductStock(product, stockLevels).available,
    );

    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "sales-desc") {
      return [...list].sort(
        (a, b) =>
          b.totalSold - a.totalSold || b.price - a.price || a.name.localeCompare(b.name, "es"),
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    );
  }, [catalogCandidates, catalogFilters.availableOnly, sort, stockLevels]);

  const isCatalogFiltering =
    query !== debouncedQuery || (catalogFilters.availableOnly && isStockLoading);
  const isCatalogLoading = !isClientMounted || isProductsLoading || isCatalogFiltering;
  const catalogLoadError = isProductsError
    ? productsError
    : catalogRequestTimedOut
      ? new RequestTimeoutError(UI_REQUEST_TIMEOUT_MS)
      : null;

  // `withRequestTimeout` es la protección principal de cada consulta. Este
  // guardia independiente cubre navegadores/extensiones que pausen o cancelen
  // una promesa antes de que React Query reciba su rechazo: la UI siempre pasa
  // de skeleton a una acción de reintento recuperable.
  useEffect(() => {
    if (!isClientMounted || !isProductsLoading) {
      setCatalogRequestTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(
      () => setCatalogRequestTimedOut(true),
      UI_REQUEST_TIMEOUT_MS + 1_000,
    );
    return () => window.clearTimeout(timeout);
  }, [isClientMounted, isProductsLoading]);
  const renderedVisibleProducts = useMemo(
    () => visible.slice(0, catalogPage * CATALOG_RENDER_PAGE_SIZE),
    [catalogPage, visible],
  );
  const canRenderMoreProducts = renderedVisibleProducts.length < visible.length;

  useEffect(() => {
    setCatalogPage(1);
  }, [activeCat, activeServiceId, catalogFilters, debouncedQuery, sort]);

  const clearCatalogFilters = useCallback(() => {
    setCatalogFilters(EMPTY_CATALOG_FILTERS);
    setSort("recent");
  }, []);

  const handleSuggestionSelect = useCallback(
    (productId: string) => {
      const product = allProducts.find((item) => String(item.id) === productId);
      if (!product) return;
      playClick();
      setSelected(product);
    },
    [allProducts, playClick],
  );

  function handleAdd(p: Product) {
    if (!session) {
      openAuth();
      return;
    }

    const stock = getProductStock(p, stockLevels);
    const quantityInCart = cartItems.find((item) => item.id === p.id)?.quantity ?? 0;
    if (!stock.available || (stock.count !== null && quantityInCart >= stock.count)) {
      toast.error("Este producto se agotó o ya alcanzaste el stock disponible.");
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

    const unavailableItem = cartItems.find((item) => {
      const product = allProducts.find((catalogProduct) => catalogProduct.id === item.id);
      const stock = getProductStock(product ?? { id: item.id }, stockLevels);
      return !stock.available || (stock.count !== null && item.quantity > stock.count);
    });
    if (unavailableItem) {
      toast.error(`${unavailableItem.name} ya no tiene stock suficiente.`);
      return;
    }

    orderSubmissionRef.current = true;
    setIsOrderSubmitting(true);
    try {
      await createOrdersFn({
        data: {
          items: cartItems.map((it) => ({ id: it.id, name: it.name, quantity: it.quantity })),
        },
      });

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
      toast.success("Compra completada. Tus credenciales ya están disponibles.");
      cartStore.clear();
      setCartOpen(false);
      await loadOrders();
      setPanel(catalogOnly ? "tienda" : "compras");
    } catch {
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

    const stock = getProductStock(p, stockLevels);
    if (!stock.available || (stock.count !== null && quantity > stock.count)) {
      toast.error("Este producto ya no tiene stock disponible.");
      return;
    }

    orderSubmissionRef.current = true;
    setIsOrderSubmitting(true);
    try {
      await createOrdersFn({
        data: { items: [{ id: p.id, name: p.name, quantity }] },
      });

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
      toast.success("Compra completada. Tus credenciales ya están disponibles.");
      await loadOrders();
      setPanel(catalogOnly ? "tienda" : "compras");
    } catch {
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
        collapsed={sidebarCollapsed}
        sessionActive={!!session}
        walletBalance={walletBalance}
        isAdmin={isAdmin}
        isProvider={isProvider}
        isDistributor={isDistributor}
        catalogOnly={catalogOnly}
        accountRoleLabel={
          isAdmin
            ? "Administrador"
            : isProvider
              ? "Proveedor"
              : isDistributor
                ? "Distribuidor"
                : "Cliente"
        }
        displayName={displayName}
        initials={initials}
        avatarUrl={profile?.avatar_url ? getAvatarUrl(profile.avatar_url) : null}
        activePanel={panel}
        activeCategory={activeCat}
        onClose={() => setSidebarOpen(false)}
        onCategorySelect={handleCategorySelect}
        onPanelSelect={handleSidebarPanel}
        onOpenAdmin={handleOpenAdmin}
        onOpenStorefront={handleOpenStorefront}
        onOpenWallet={handleWallet}
        onOpenAuth={openAuth}
        onSignOut={handleSignOut}
        onUnavailable={handleUnavailableSection}
      />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          !catalogOnly &&
            (sidebarCollapsed
              ? "lg:pl-[var(--store-sidebar-collapsed-width)]"
              : "lg:pl-[var(--store-sidebar-width)]"),
        )}
      >
        <AppTopbar
          onToggleSidebar={handleSidebarToggle}
          businessNavigation={
            isProvider
              ? { storeHref: "/proveedor/mi-tienda" }
              : isDistributor
                ? { storeHref: "/distribuidor/mi-tienda" }
                : undefined
          }
        />
        {(panel === "tienda" || panel === "mi-tienda") && (
          <div className="tienda-main-content">
            <PlatformNavigation
              activeCategory={activeCat}
              platforms={navigationPlatforms}
              onCategorySelect={handleCategorySelect}
              onPlatformSelect={handlePlatformSelect}
              showCatalogNavigation={panel === "tienda" && activeCat !== "redes"}
            />
            {panel === "tienda" && activeCat === "redes" ? (
              <SocialServicesPanel
                userId={userId}
                displayName={displayName}
                walletBalance={walletBalance}
                onLoginRequired={() => openAuth()}
              />
            ) : panel === "tienda" ? (
              <CatalogToolbar
                query={query}
                inputRef={searchRef}
                suggestions={searchSuggestions}
                isDebouncing={query !== debouncedQuery}
                onQueryChange={setQuery}
                onSuggestionSelect={handleSuggestionSelect}
                sort={sort}
                onSortChange={setSort}
                filters={catalogFilters}
                onFiltersChange={setCatalogFilters}
                onClearFilters={clearCatalogFilters}
                priceBounds={priceBounds}
                durationOptions={durationOptions}
                resultCount={visible.length}
              />
            ) : null}

            {/* El grid superior reemplaza la barra antigua */}
          </div>
        )}

        {panel === "tienda" && activeCat !== "redes" && (
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
                  {visible.length} producto{visible.length === 1 ? "" : "s"} encontrado
                  {visible.length === 1 ? "" : "s"}
                </div>
              </div>

              {catalogLoadError ? (
                <QueryErrorState
                  error={catalogLoadError}
                  title="No se pudo cargar el catálogo"
                  onRetry={() => {
                    setCatalogRequestTimedOut(false);
                    void refetchProducts();
                    void refetchManagedPlatforms();
                  }}
                />
              ) : isCatalogLoading ? (
                <div className="grid auto-rows-fr grid-cols-1 gap-3 min-[520px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
                  {Array.from({ length: 12 }, (_, index) => (
                    <ProductCatalogCardSkeleton key={index} />
                  ))}
                </div>
              ) : visible.length === 0 ? (
                <div className="grid place-items-center rounded-xl border border-border bg-background p-10 text-center sm:p-16">
                  <div className="mb-5 grid h-14 w-14 place-items-center rounded-lg border border-border bg-background">
                    <Package className="w-6 h-6 text-white/70" />
                  </div>
                  <p className="text-sm text-white/60 mb-5">
                    {query.trim()
                      ? "No se encontraron productos para tu búsqueda."
                      : "No encontramos productos con esos filtros."}
                  </p>
                  <button
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      setActiveCat("todo");
                      setActiveServiceId(null);
                      setQuery("");
                      setDebouncedQuery("");
                      clearCatalogFilters();
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
                <>
                  {isManagedPlatformsError && (
                    <div
                      role="alert"
                      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.06] px-3 py-2.5 text-xs text-amber-50/85"
                    >
                      <span>Se cargó el catálogo, pero no se pudieron actualizar los íconos de plataformas.</span>
                      <button
                        type="button"
                        onClick={() => void refetchManagedPlatforms()}
                        className="font-bold underline underline-offset-2 hover:text-white"
                        title={
                          managedPlatformsError instanceof Error
                            ? managedPlatformsError.message
                            : undefined
                        }
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  {isStockError && (
                    <div
                      role="alert"
                      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/25 bg-amber-300/[0.06] px-3 py-2.5 text-xs text-amber-50/85"
                    >
                      <span>No se pudo comprobar el stock. Las compras permanecen bloqueadas por seguridad.</span>
                      <button
                        type="button"
                        onClick={() => void refetchStock()}
                        className="font-bold underline underline-offset-2 hover:text-white"
                        title={stockError instanceof Error ? stockError.message : undefined}
                      >
                        Reintentar
                      </button>
                    </div>
                  )}
                  <div className="grid auto-rows-fr grid-cols-1 gap-3 min-[520px]:grid-cols-2 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-7">
                    {renderedVisibleProducts.map((p) => (
                      <ProductCatalogCard
                        key={p.id}
                        product={p}
                        stock={getProductStock(p, stockLevels)}
                        lastSaleAt={lastSaleByProduct.get(p.id) ?? null}
                        onHover={playHover}
                        onOpen={() => {
                          playClick();
                          setSelected(p);
                        }}
                        onAdd={() => {
                          playClick();
                          handleAdd(p);
                        }}
                      />
                    ))}
                  </div>
                  {canRenderMoreProducts && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setCatalogPage((page) => page + 1)}
                        className="rounded-lg border border-red-accent/45 bg-red-accent/[0.08] px-5 py-2.5 text-xs font-bold text-white transition hover:bg-red-accent/18"
                      >
                        Ver más productos ({visible.length - renderedVisibleProducts.length})
                      </button>
                    </div>
                  )}
                </>
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

        {panel === "mi-tienda" && (
          <section className="relative z-10 mt-6 pb-24">
            <div className="mx-auto max-w-[1600px] px-4">
              {!session || isRoleLoading ? (
                <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-white/55">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando Mi Tienda…
                </div>
              ) : (
                <StorefrontManagement />
              )}
            </div>
          </section>
        )}

        {panel === "perfil" && profile && userId && (
          <ProfilePanel
            userId={userId}
            initials={initials}
            profile={profile}
            email={session!.user.email ?? ""}
            onSaved={(p) => setProfile({ ...profile, ...p })}
            onAvatarUpdate={(avatarUrl) =>
              setProfile((current) => (current ? { ...current, avatar_url: avatarUrl } : current))
            }
          />
        )}

        {panel === "soporte" && (
          <SupportTicketsPanel
            userId={userId}
            onOpenAuth={openAuth}
            onGoShop={() => setPanel("tienda")}
            createTicketPrefill={supportTicketPrefill}
            onCreateTicketPrefillConsumed={() => setSupportTicketPrefill(null)}
            onContactSupport={() => {
              const message = encodeURIComponent(
                "Hola, necesito ayuda con mi cuenta de CMD Streaming.",
              );
              openWhatsApp(`https://wa.me/${WA_NUMBER}?text=${message}`);
            }}
          />
        )}

        {panel === "clientes" && userId && (
          <React.Suspense
            fallback={
              <div className="mx-auto mt-6 max-w-[1600px] px-4 pb-24 sm:px-6">
                <div className="h-80 animate-pulse rounded-xl border border-border bg-card/40" />
              </div>
            }
          >
            <ClientsPanel
              userId={userId}
              isAdmin={isAdmin}
              isProvider={isProvider}
              isDistributor={isDistributor}
              onGoShop={() => setPanel("tienda")}
            />
          </React.Suspense>
        )}

        {isSidebarPlaceholderPanel(panel) && (
          <SidebarPlaceholderPanel panel={panel} onGoShop={() => setPanel("tienda")} />
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

        {authOpen && (
          <React.Suspense fallback={null}>
            <AuthModal
              open={authOpen}
              initialMode={authMode}
              onClose={() => {
                setAuthOpen(false);
                setAuthMode("login");
              }}
            />
          </React.Suspense>
        )}
        {walletOpen && userId && (
          <WalletRechargeModal
            userId={userId}
            onClose={() => setWalletOpen(false)}
            onReportSupport={() => {
              setWalletOpen(false);
              setSupportTicketPrefill({
                asunto: "Problema con la verificación de mi recarga",
                categoria: "pago",
                descripcion:
                  "Indica el método, monto, fecha aproximada y cualquier dato de tu pago para que podamos revisarlo.",
              });
              setPanel("soporte");
            }}
          />
        )}
        {cartOpen && (
          <React.Suspense fallback={null}>
            <CartDrawer
              open={cartOpen}
              onClose={() => setCartOpen(false)}
              onCheckout={handleCheckout}
              checkoutPending={isOrderSubmitting}
            />
          </React.Suspense>
        )}

        <KeyboardShortcuts
          authed={!!session}
          onFocusSearch={focusCatalogSearch}
          onToggleCart={() => setCartOpen((v) => !v)}
          onGoPanel={(p) => {
            if (!catalogOnly || p === "tienda") setPanel(p);
          }}
          onGoHome={() => router.navigate({ to: "/" })}
          onOpenTutorial={() => setTutorialOpen(true)}
        />

        {tutorialOpen && (
          <React.Suspense fallback={null}>
            <KeyboardTutorial open={tutorialOpen} onClose={() => setTutorialOpen(false)} />
          </React.Suspense>
        )}

        {selected && (
          <React.Suspense fallback={null}>
            <ProductModal
              product={selected}
              onClose={() => setSelected(null)}
              onLoginRequired={() => openAuth()}
              isAuthenticated={Boolean(session)}
              userId={userId}
              isRoleLoading={isRoleLoading}
              isAdmin={isAdmin}
              isProvider={isProvider}
              isDistributor={isDistributor}
              stockAvailable={getProductStock(selected, stockLevels).available}
              stockCount={getProductStock(selected, stockLevels).count}
              totalSold={selected.totalSold}
              viewCount={selected.totalViews}
              publisherName={selected.publisherName}
              isRenewable={selected.isRenewable}
              onOrderCreated={async () => {
                await Promise.all([loadOrders(), walletBalanceQuery.refetch()]);
                if (!isAdmin && !isProvider && !isDistributor) {
                  setPanel(catalogOnly ? "tienda" : "compras");
                }
              }}
            />
          </React.Suspense>
        )}

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
            <div className="relative flex w-full max-w-md max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-background animate-scale-in">
              <div className="flex shrink-0 items-center justify-between border-b border-border bg-background p-5 sm:p-6">
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

              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
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
                        <DeliveryCopyButton
                          value={selectedDelivery.email}
                          label="Usuario"
                          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-all duration-200 hover:border-primary/60 hover:text-white active:scale-90"
                        />
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
                          <DeliveryCopyButton
                            value={selectedDelivery.password}
                            label="Contraseña"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-white/40 transition-all duration-200 hover:border-primary/60 hover:text-white active:scale-90"
                          />
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

function SidebarPlaceholderPanel({
  panel,
  onGoShop,
}: {
  panel: SidebarPlaceholderPanel;
  onGoShop: () => void;
}) {
  const content = sidebarPlaceholderContent[panel];

  return (
    <section className="mt-6 pb-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="rounded-xl border border-border bg-background p-6 text-center sm:p-10">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
            <Package className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
            {content.eyebrow}
          </p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-white">
            {content.title}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/60">
            {content.description}
          </p>
          <span className="mt-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold text-white/55">
            Próximamente
          </span>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onGoShop}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-white/80 transition hover:border-primary/60 hover:text-white"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    </section>
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
          <div
            className="space-y-3 rounded-xl glass-card p-4 sm:p-5"
            role="status"
            aria-label="Cargando compras"
          >
            <div className="hidden space-y-3 sm:block">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1.6fr)_0.7fr_0.65fr_0.9fr_0.9fr] gap-4 rounded-lg border border-white/5 p-4"
                >
                  <Skeleton className="h-4 w-4/5 bg-white/[0.08]" />
                  <Skeleton className="h-4 w-16 bg-white/[0.08]" />
                  <Skeleton className="h-5 w-20 rounded-full bg-white/[0.08]" />
                  <Skeleton className="h-4 w-20 bg-white/[0.08]" />
                  <Skeleton className="h-4 w-20 bg-white/[0.08]" />
                </div>
              ))}
            </div>
            <div className="space-y-3 sm:hidden">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="rounded-xl border border-white/5 p-4">
                  <Skeleton className="h-4 w-3/4 bg-white/[0.08]" />
                  <Skeleton className="mt-3 h-3 w-2/5 bg-white/[0.08]" />
                  <Skeleton className="mt-4 h-7 w-full bg-white/[0.08]" />
                </div>
              ))}
            </div>
            <span className="sr-only">Cargando compras</span>
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
  onAvatarUpdate?: (avatarUrl: string) => void;
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
          <React.Suspense fallback={null}>
            <AvatarUploader
              userId={userId}
              fallbackInitials={initials}
              avatarUrl={profile.avatar_url}
              onUploaded={onAvatarUpdate}
            />
          </React.Suspense>
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
