import { createFileRoute, Link } from "@tanstack/react-router";
import * as React from "react";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getMyOrderRatings, rateOrderSupplier } from "@/lib/ratings.functions";
import {
  Search,
  ChevronDown,
  ShoppingCart,
  Eye,
  Moon,
  DollarSign,
  BadgeCheck,
  Moon as MoonIcon,
  Package,
  Share2,
  MessageCircle,
  Mail,
  Clapperboard,
  LogOut,
  ShoppingBag,
  X,
  Plus,
  UserCircle2,
  Loader2,
  Save,
  User as UserIcon,
  Phone,
  BarChart3,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Key,
  Copy,
  Eye as EyeIcon,
  EyeOff,
  ExternalLink,
  LayoutDashboard,
  Star,
} from "lucide-react";
import {
  categories,
  products,
  estadoStyles,
  WA_NUMBER,
  buildWhatsAppMessage,
  buildCartWhatsAppMessage,
  type Product,
  type PanelTab,
  type Profile,
  type Order,
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
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { AvatarEffect } from "@/components/supplier/AvatarEffect";
import { normalizeEffect } from "@/lib/avatar-effects";
import { PlatformBackground } from "@/components/tienda/PlatformBackground";
import { useFuturisticSound } from "@/hooks/useSound";
import { FallingStars, FuturisticBackground } from "@/components/BackgroundAnimations";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { createOrders } from "@/lib/orders.functions";
import type { Database, Tables } from "@/integrations/supabase/types";
import { getAuthDestination } from "@/lib/auth-destination";

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
  const tabsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; scrollLeft: number } | null>(null);
  const track = useAnalytics();
  const createOrdersFn = useServerFn(createOrders);

  const isAdminHook = useIsAdmin();
  const isSupplier = isAdminHook.isSupplier;
  const isAdmin = isAdminHook.isAdmin;
  const { playHover, playClick } = useFuturisticSound();
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryDetails | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(true);
  const [supplierAvatarFailed, setSupplierAvatarFailed] = useState(false);
  const ordersRequestId = useRef(0);
  const orderSubmissionRef = useRef(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  useEffect(() => {
    const getStatus = async () => {
      const { data } = await supabase
        .from("admin_status")
        .select("is_active")
        .limit(1)
        .maybeSingle();
      if (data) setIsAdminActive(data.is_active);
    };
    getStatus();

    const channel = supabase
      .channel("admin_status_changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "admin_status" },
        (payload) => {
          setIsAdminActive(payload.new.is_active);
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;

  const [profileError, setProfileError] = useState<{
    message: string;
    code?: string;
    details?: string;
    hint?: string;
  } | null>(null);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setProfileError(null);
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

  const handleCreateProfileManually = useCallback(async () => {
    if (!userId || isCreatingProfile) return;
    setIsCreatingProfile(true);
    setProfileError(null);
    try {
      const { error } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: session?.user.email || "",
          nombre_completo:
            (session?.user.user_metadata?.full_name as string) ||
            session?.user.email?.split("@")[0] ||
            "",
        },
        { onConflict: "id" },
      );

      if (error) {
        console.error("[Profile] Upsert error:", error);
        setProfileError({
          message: `Error al crear/actualizar perfil: ${error.message}`,
          code: error.code,
          details: error.details,
        });
        toast.error("Error al procesar perfil");
        return;
      }

      toast.success("Perfil sincronizado correctamente");
      await fetchProfile();
    } catch (err) {
      console.error("[Profile] Unexpected error in upsert:", err);
      setProfileError({ message: "Error crítico al intentar sincronizar el perfil." });
    } finally {
      setIsCreatingProfile(false);
    }
  }, [fetchProfile, isCreatingProfile, session?.user.email, session?.user.user_metadata, userId]);

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

  // Perfil de proveedor del usuario actual (para la cabecera de la tienda).
  const { data: mySupplier } = useQuery({
    queryKey: ["public-suppliers", "me", userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("get_public_suppliers", {
        _user_ids: [userId],
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });

  useEffect(() => {
    setSupplierAvatarFailed(false);
  }, [mySupplier?.avatar_url]);

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
      setAuthOpen(true);
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
      setAuthOpen(true);
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
      setAuthOpen(true);
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

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      ordersRequestId.current += 1;
      orderSubmissionRef.current = false;
      await queryClient.cancelQueries();
      queryClient.clear();
      setSession(null);
      setProfile(null);
      setOrders([]);
      setSelectedDelivery(null);
      setShowPass(false);
      setCartOpen(false);
      setPanel("tienda");
      await router.navigate({ to: "/tienda", replace: true });
      toast.success("Sesión cerrada");
    } catch (error) {
      console.error("No se pudo cerrar la sesión:", error);
      toast.error("No se pudo cerrar sesión. Intenta de nuevo.");
    } finally {
      setIsSigningOut(false);
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
    <div className="min-h-screen text-foreground relative isolate overflow-x-hidden">
      <PlatformBackground />
      <FuturisticBackground />
      <FallingStars />

      <div>
        {/* Top nav */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-background/95 sm:bg-background/80 sm:backdrop-blur-xl">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <Link
                to="/"
                className="flex items-center gap-2.5 shrink-0 group"
                onMouseEnter={playHover}
                onClick={playClick}
              >
                <img
                  src="/favicon.png"
                  alt="CMD Streaming"
                  className="h-10 w-10 rounded-xl object-contain transition-transform group-hover:scale-105"
                />
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {session ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-3 pr-2 border-r border-white/10">
                    <div className="w-9 h-9 bg-red-accent rounded-full overflow-hidden shrink-0 shadow-lg shadow-red-600/20">
                      {profile?.avatar_url ? (
                        <img
                          src={getAvatarUrl(profile.avatar_url)}
                          alt="Foto de perfil"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-[11px] font-bold text-white uppercase">
                          {initials || "US"}
                        </div>
                      )}
                    </div>
                    <div className="leading-tight">
                      <p className="text-[10px] text-white/50">Hola,</p>
                      <p className="text-xs text-white font-bold truncate max-w-[120px]">
                        {displayName}
                      </p>
                    </div>
                  </div>
                  {(isAdmin || isSupplier) && (
                    <Link
                      to={isAdmin ? "/admin" : "/proveedor"}
                      className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors group"
                      onMouseEnter={playHover}
                      onClick={() => {
                        playClick();
                        track("cta_click", {
                          eventName: "panel_link",
                          metadata: {
                            location: "tienda_header",
                            role: isAdmin ? "admin" : "supplier",
                          },
                        });
                      }}
                    >
                      <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                    </Link>
                  )}
                  <button
                    type="button"
                    onMouseEnter={playHover}
                    onClick={() => {
                      playClick();
                      handleSignOut();
                    }}
                    className="p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                    disabled={isSigningOut}
                    aria-label="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playClick();
                      setAuthOpen(true);
                    }}
                    onMouseEnter={playHover}
                    className="text-xs font-bold text-white px-4 py-2 bg-red-accent rounded-full hover:brightness-110 transition shadow-lg shadow-red-600/20"
                  >
                    Ingresar
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* CABECERA DE TIENDA */}
        <section className="relative border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10">
            {profileError && profileError.code !== "NOT_FOUND" && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      Error del Sistema
                    </p>
                    <p className="text-xs text-white/70 mt-1">{profileError.message}</p>

                    <div className="mt-2 p-2 bg-black/40 rounded font-mono text-[10px] text-red-400 overflow-x-auto">
                      Detalle Técnico: {profileError.code}
                      {profileError.details && <br />}
                      {profileError.details && `${profileError.details}`}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onMouseEnter={playHover}
                        onClick={() => {
                          playClick();
                          window.location.reload();
                        }}
                        className="px-3 py-1.5 bg-red-accent text-white text-[10px] uppercase font-bold tracking-widest transition"
                      >
                        Refrescar página
                      </button>
                      <button
                        onMouseEnter={playHover}
                        onClick={() => {
                          playClick();
                          fetchProfile();
                        }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest transition"
                      >
                        Reintentar lectura
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-5 shadow-[0_0_50px_rgba(220,38,38,0.1)] sm:p-8 sm:shadow-[0_0_80px_rgba(220,38,38,0.12)] sm:backdrop-blur-xl">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-accent">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-accent shadow-[0_0_10px_rgba(220,38,38,0.7)]" />
                    Acceso inmediato y soporte 24/7
                  </div>
                  <h1 className="mt-4 font-display text-3xl sm:text-5xl uppercase text-white tracking-tight leading-[0.95]">
                    {session ? (
                      <>
                        Hola, {displayName}
                        <br />
                        Tu tienda de streaming
                      </>
                    ) : (
                      <>
                        Tienda premium
                        <br />
                        Catálogo de cuentas
                      </>
                    )}
                  </h1>
                  <p className="mt-4 text-sm sm:text-base text-white/70 leading-relaxed max-w-xl">
                    Explora servicios y licencias con activación rápida, pagos seguros y una
                    experiencia más rápida para encontrar exactamente lo que necesitas.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        document
                          .getElementById("catalogo")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-red-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                    >
                      <Eye aria-hidden="true" className="w-4 h-4" />
                      Explorar catálogo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playClick();
                        if (!session) setAuthOpen(true);
                        else setPanel("perfil");
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                    >
                      <UserCircle2 aria-hidden="true" className="w-4 h-4" />
                      {session ? "Mi cuenta" : "Ingresar ahora"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:min-w-[320px]">
                  {[
                    { value: "1.2K", label: "Ventas" },
                    { value: `${products.length}`, label: "Productos" },
                    { value: "24/7", label: "Soporte" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center backdrop-blur-sm"
                    >
                      <p className="font-display text-xl text-white">{stat.value}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div
                  className="inline-flex items-center gap-2.5 pr-4 border-r border-white/10 group/camd cursor-default"
                  onMouseEnter={playHover}
                >
                  <div className="relative group/avatar">
                    {!mySupplier?.avatar_effect || mySupplier.avatar_effect === "none" ? (
                      <div className="absolute inset-0 rounded-full animate-fire-aura pointer-events-none scale-110" />
                    ) : null}

                    <div className="relative z-10 transition-transform duration-300 group-hover/camd:scale-110">
                      <AvatarEffect effect={normalizeEffect(mySupplier?.avatar_effect)} size="sm">
                        <div className="w-9 h-9 rounded-full bg-red-accent overflow-hidden shrink-0 shadow-lg shadow-red-600/20">
                          <img
                            src={
                              !supplierAvatarFailed && mySupplier?.avatar_url
                                ? getAvatarUrl(mySupplier.avatar_url)
                                : "/provider-avatars/provider-avatar-01.png"
                            }
                            alt="Avatar de CMD Streaming"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (!supplierAvatarFailed && mySupplier?.avatar_url) {
                                setSupplierAvatarFailed(true);
                              } else {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }
                            }}
                          />
                        </div>
                      </AvatarEffect>
                    </div>
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-white flex items-center gap-1 transition-colors group-hover/camd:text-red-accent">
                      {mySupplier?.display_name || (session ? displayName : "@camd")}
                      <BadgeCheck
                        className={cn(
                          "w-3.5 h-3.5",
                          isAdminActive ? "text-green-500 animate-pulse" : "text-red-accent",
                        )}
                      />
                    </p>
                    <p className="text-[10px] text-white/70 flex items-center gap-1">
                      {isAdminActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          Disponible ahora
                        </>
                      ) : (
                        <>
                          <MoonIcon className="w-2.5 h-2.5" /> Fuera de horario
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    playClick();
                    setCartOpen(true);
                  }}
                  onMouseEnter={playHover}
                  aria-label={`Abrir carrito${cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}` : ""}`}
                  className="relative inline-flex items-center gap-2 min-h-11 px-5 py-2.5 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  <ShoppingCart aria-hidden="true" className="w-4 h-4" />
                  Carrito
                  {cartCount > 0 && (
                    <span
                      aria-hidden="true"
                      className="ml-1 px-1.5 py-0.5 bg-white text-red-accent text-[10px] font-bold leading-none"
                    >
                      {cartCount}
                    </span>
                  )}
                </button>

                <IconBtn onClick={() => setPanel("tienda")} label="Tienda">
                  <Eye aria-hidden="true" className="w-4 h-4" />
                </IconBtn>
                <IconBtn onClick={() => setTutorialOpen(true)} label="Ayuda">
                  <Moon aria-hidden="true" className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  onClick={() => {
                    if (!session) setAuthOpen(true);
                    else setPanel("perfil");
                  }}
                  label="Mi Cuenta"
                >
                  <UserCircle2 aria-hidden="true" className="w-4 h-4" />
                </IconBtn>
                {isSupplier && (
                  <IconBtn
                    onClick={() => router.navigate({ to: "/proveedor" })}
                    label="Panel Proveedor"
                  >
                    <LayoutDashboard aria-hidden="true" className="w-4 h-4" />
                  </IconBtn>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Panel tabs (only when authenticated) */}
        {session && (
          <section className="mt-6">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="inline-flex gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none border border-white/10 p-1.5 bg-black/20 backdrop-blur-md rounded-lg">
                <PanelTabBtn
                  active={panel === "tienda"}
                  onClick={() => {
                    track("cta_click", {
                      eventName: "panel_tienda",
                      metadata: { location: "panel_tabs" },
                    });
                    setPanel("tienda");
                  }}
                  icon={<ShoppingBag className="w-4 h-4" />}
                  label="Tienda"
                />
                <PanelTabBtn
                  active={panel === "compras"}
                  onClick={() => {
                    track("cta_click", {
                      eventName: "panel_compras",
                      metadata: { location: "panel_tabs" },
                    });
                    setPanel("compras");
                  }}
                  icon={<Package className="w-4 h-4" />}
                  label="Mis Compras"
                />
                <PanelTabBtn
                  active={panel === "perfil"}
                  onClick={() => {
                    track("cta_click", {
                      eventName: "panel_perfil",
                      metadata: { location: "panel_tabs" },
                    });
                    setPanel("perfil");
                  }}
                  icon={<UserCircle2 className="w-4 h-4" />}
                  label="Mi Perfil"
                />
              </div>
            </div>
          </section>
        )}

        {panel === "tienda" && (
          <div className="tienda-main-content">
            {/* PLATAFORMAS (Grid superior Estilo Referencia) */}
            <section className="mt-8 relative">
              <div className="max-w-[1600px] mx-auto px-4">
                <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-red-accent">
                      Explora por plataformas
                    </p>
                    <h2 className="text-3xl font-bold text-white tracking-tight">
                      Encuentra lo que más te interesa
                    </h2>
                  </div>
                  <p className="text-white/50 text-sm">
                    Filtra rápido por tus categorías favoritas y ahorra tiempo.
                  </p>
                </div>

                <div className="grid grid-cols-4 min-[420px]:grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(18,minmax(0,1fr))] gap-2 sm:gap-3">
                  {categories
                    .filter((c) => c.id !== "todo")
                    .map((cat) => {
                      const isActive = activeCat === cat.id;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => {
                            playClick();
                            setActiveCat(cat.id);
                          }}
                          onMouseEnter={playHover}
                          style={
                            isActive
                              ? {
                                  borderColor: cat.accent,
                                  backgroundColor: `${cat.accent}1a`,
                                  boxShadow: `0 0 25px ${cat.accent}40`,
                                }
                              : undefined
                          }
                          className={`group relative flex aspect-[1/1.05] min-h-[4.75rem] flex-col items-center justify-center rounded-2xl border p-1 transition-all duration-300 hover:scale-[1.02] sm:aspect-square ${isActive ? "" : "border-white/10 bg-black/40 sm:backdrop-blur-md hover:bg-white/5"}`}
                        >
                          <div
                            style={{
                              color: "#fff",
                              backgroundColor: isActive ? cat.accent : `${cat.accent}24`,
                              boxShadow: isActive ? `0 0 18px ${cat.accent}80` : undefined,
                            }}
                            className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:brightness-125"
                          >
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <span
                            style={isActive ? { color: cat.accent } : undefined}
                            className={`mt-2 block px-1 text-[9px] font-bold uppercase tracking-tighter leading-none transition-colors ${isActive ? "" : "text-white/65 group-hover:text-white"}`}
                          >
                            {cat.label.split(" ")[0]}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </section>
            {/* Buscador y Filtros */}
            <section className="mt-8 border-t border-b border-white/5 bg-black/20 sm:backdrop-blur-sm">
              <div className="max-w-[1600px] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-full sm:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    ref={searchRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-accent/50 focus:ring-1 focus:ring-red-accent/20 transition-all"
                  />
                </div>

                <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
                  <div className="relative group/sort flex-1 sm:flex-initial">
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value as SortKey)}
                      className="appearance-none w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-6 pr-10 text-xs font-bold text-white uppercase tracking-wider focus:outline-none transition-all cursor-pointer"
                    >
                      <option value="destacado">Todas las categorías</option>
                      <option value="precio-asc">Precio: Bajo a Alto</option>
                      <option value="precio-desc">Precio: Alto a Bajo</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
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
                    className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10 sm:px-6"
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden min-[420px]:inline">Limpiar filtros</span>
                    <span className="inline min-[420px]:hidden">Limpiar</span>
                  </button>
                </div>
              </div>
            </section>

            {/* El grid superior reemplaza la barra antigua */}
          </div>
        )}

        {panel === "tienda" && (
          <section id="catalogo" className="mt-6 pb-24 relative z-10">
            <div className="max-w-[1600px] mx-auto px-4">
              <div className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-red-accent">
                    Catálogo
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest text-sm">
                    {activeCat === "todo" ? "Todos los productos" : activeCat}
                    <span className="text-red-accent font-black">#</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 sm:self-auto">
                  <span className="h-2 w-2 rounded-full bg-red-accent" />
                  {visible.length} productos disponibles
                </div>
              </div>

              {visible.length === 0 ? (
                <div className="border border-white/10 p-10 sm:p-16 grid place-items-center text-center rounded-2xl">
                  <div className="w-14 h-14 border border-white/12 grid place-items-center mb-5">
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
                    className="px-5 py-2.5 border border-white/20 text-white text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-background transition"
                  >
                    Ver todo el catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 lg:gap-8">
                  {visible.map((p) => (
                    <article
                      key={p.id}
                      className="product-card group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(220,38,38,0.1)] sm:rounded-[1.5rem] sm:backdrop-blur-xl"
                    >
                      {/* Media Section - Reduced aspect ratio and margin */}
                      <div className="relative aspect-video overflow-hidden bg-white/[0.03] m-1 rounded-lg sm:rounded-xl group/img">
                        {p.image && !p.image.includes("/placeholder.svg") ? (
                          <img
                            src={p.image}
                            alt={`Portada de ${p.name}`}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none sm:group-hover/img:scale-110"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-white/[0.05] to-transparent flex items-center justify-center">
                            <Package className="w-6 sm:w-10 h-6 sm:h-10 text-white/10" />
                          </div>
                        )}

                        {/* Floating Badges */}
                        <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 pointer-events-none">
                          <span className="px-1.5 sm:px-2 py-0.5 bg-red-accent/90 backdrop-blur-md text-[6px] sm:text-[9px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-xl">
                            Premium
                          </span>
                        </div>

                        {/* Detail Overlay Trigger */}
                        <button
                          type="button"
                          onClick={() => {
                            playClick();
                            setSelected(p);
                          }}
                          onMouseEnter={playHover}
                          className="absolute inset-0 grid place-items-center bg-black/25 opacity-100 transition-opacity duration-300 sm:bg-black/40 sm:opacity-0 sm:group-hover/img:opacity-100 sm:backdrop-blur-[2px]"
                        >
                          <div className="px-3 sm:px-4 py-1 sm:py-1.5 bg-white text-black text-[6px] sm:text-[9px] font-black uppercase tracking-[0.1em] rounded-full transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-500">
                            Ver detalles
                          </div>
                        </button>
                      </div>

                      {/* Content Section - Reduced paddings and margins */}
                      <div className="px-2 sm:px-4 pb-2 sm:pb-4 pt-1 flex flex-col flex-1">
                        {/* Title & Meta - Compact spacing */}
                        <div className="mb-2 sm:mb-3">
                          <h3 className="mb-0.5 text-xs font-display font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-red-accent line-clamp-1 sm:mb-1 sm:text-base lg:text-lg">
                            {p.name}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] text-white/40 font-medium uppercase tracking-wider">
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

                        {/* Interaction Area */}
                        <div className="mt-auto space-y-2 sm:space-y-3">
                          {/* Price & Quantity - Unified row for desktop */}
                          <div className="flex flex-row items-center justify-between gap-2">
                            <div className="flex flex-col">
                              <span className="text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-[0.1em] mb-0">
                                Precio
                              </span>
                              <span className="text-xs sm:text-lg lg:text-xl font-display font-bold text-white leading-none">
                                S/ {p.price.toFixed(2)}
                              </span>
                            </div>

                            <div className="flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.03] px-1 shadow-inner sm:h-9 sm:rounded-xl">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = e.currentTarget
                                    .nextElementSibling as HTMLInputElement;
                                  const val = parseInt(input.value) || 1;
                                  if (val > 1) {
                                    input.value = (val - 1).toString();
                                    playClick();
                                  }
                                }}
                                className="flex h-full w-8 items-center justify-center text-white/50 transition-colors hover:text-white sm:w-7"
                              >
                                <span className="text-sm sm:text-lg leading-none font-light">
                                  -
                                </span>
                              </button>
                              <input
                                type="number"
                                defaultValue="1"
                                min="1"
                                max={getProductStock(p.id, stockLevels).count ?? 99}
                                className="w-7 border-none bg-transparent text-center text-xs font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none sm:w-7"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const input = e.currentTarget
                                    .previousElementSibling as HTMLInputElement;
                                  const val = parseInt(input.value) || 1;
                                  const max = getProductStock(p.id, stockLevels).count ?? 99;
                                  if (val < max) {
                                    input.value = (val + 1).toString();
                                    playClick();
                                  }
                                }}
                                className="flex h-full w-8 items-center justify-center text-white/50 transition-colors hover:text-white sm:w-7"
                              >
                                <span className="text-sm sm:text-lg leading-none font-light">
                                  +
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Actions - More compact buttons */}
                          <div className="flex gap-1 sm:gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                const input = e.currentTarget
                                  .closest("article")
                                  ?.querySelector('input[type="number"]') as HTMLInputElement;
                                const qty = parseInt(input?.value) || 1;
                                handleBuyNow(p, qty);
                              }}
                              onMouseEnter={playHover}
                              className="group/btn flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-red-accent py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-[0_4px_10px_-4px_rgba(220,38,38,0.4)] transition-all hover:brightness-125 sm:gap-2 sm:rounded-xl sm:py-2.5"
                            >
                              <MessageCircle className="w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:scale-110 transition-transform" />
                              <span className="hidden min-[360px]:inline">WhatsApp</span>
                              <span className="inline min-[360px]:hidden">Chat</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                playClick();
                                const input = e.currentTarget
                                  .closest("article")
                                  ?.querySelector('input[type="number"]') as HTMLInputElement;
                                const qty = parseInt(input?.value) || 1;
                                for (let i = 0; i < qty; i++) {
                                  handleAdd(p);
                                }
                              }}
                              onMouseEnter={playHover}
                              className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white transition-all hover:border-white/20 hover:bg-white/[0.08] sm:rounded-xl"
                              aria-label="Agregar al carrito"
                            >
                              <ShoppingCart className="w-3 sm:w-4 h-3 sm:h-4" />
                            </button>
                          </div>

                          {/* Stock Badge - Compacted */}
                          {(() => {
                            const stock = getProductStock(p.id, stockLevels);
                            return (
                              <div className="flex items-center justify-center pt-0.5">
                                <div
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[6px] sm:text-[8px] font-black uppercase tracking-[0.05em] transition-colors ${
                                    stock.available
                                      ? "bg-green-500/5 border-green-500/20 text-green-400"
                                      : "bg-red-500/5 border-red-500/20 text-red-400"
                                  }`}
                                >
                                  <div
                                    className={`w-1 h-1 rounded-full ${stock.available ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                                  />
                                  {stock.available ? (
                                    stock.count != null ? (
                                      <>
                                        <span className="hidden min-[400px]:inline">
                                          {stock.count} en stock
                                        </span>
                                        <span className="inline min-[400px]:hidden">
                                          {stock.count} disp.
                                        </span>
                                      </>
                                    ) : (
                                      <>
                                        <span className="hidden min-[400px]:inline">
                                          Disponible
                                        </span>
                                        <span className="inline min-[400px]:hidden">Disp.</span>
                                      </>
                                    )
                                  ) : (
                                    "Agotado"
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
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
          onFocusSearch={() => {
            setPanel("tienda");
            requestAnimationFrame(() => searchRef.current?.focus());
          }}
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
          isBuying={isOrderSubmitting}
        />

        {/* Modal de Credenciales para el Usuario */}
        {selectedDelivery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => {
                setSelectedDelivery(null);
                setShowPass(false);
              }}
            />
            <div className="relative w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden animate-scale-in">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
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
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
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
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                        />
                        <button
                          onClick={() => {
                            void copyText(selectedDelivery.email ?? "");
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
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
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            onClick={() => setShowPass(!showPass)}
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
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
                            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
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
                        className="w-full bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary font-bold flex items-center justify-between hover:bg-primary/20 transition-all"
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
                      <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 whitespace-pre-line leading-relaxed italic">
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

function PanelTabBtn({
  active,
  onClick,
  icon,
  label,
  accent = "text-sky-300",
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  accent?: string;
}) {
  const { playHover, playClick } = useFuturisticSound();
  return (
    <button
      onClick={() => {
        playClick();
        onClick();
      }}
      onMouseEnter={playHover}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-2 px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] transition-all ${
        active
          ? "bg-red-accent text-white shadow-lg shadow-red-600/20 rounded-md"
          : "text-white/70 hover:text-white hover:bg-white/[0.04]"
      }`}
    >
      <span className={cn("transition-colors", active ? "text-white" : accent)}>{icon}</span>
      {label}
    </button>
  );
}

function IconBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  const { playHover, playClick } = useFuturisticSound();
  const accentByLabel: Record<string, string> = {
    Tienda: "text-cyan-300",
    Ayuda: "text-amber-300",
    "Mi Cuenta": "text-violet-300",
    "Panel Proveedor": "text-amber-300",
  };

  return (
    <button
      type="button"
      onClick={() => {
        playClick();
        onClick?.();
      }}
      onMouseEnter={playHover}
      aria-label={label}
      className="group w-11 h-11 border border-white/12 grid place-items-center text-white/60 hover:border-white/35 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-accent"
    >
      <span
        className={cn(
          "transition-colors group-hover:text-white",
          accentByLabel[label] ?? "text-sky-300",
        )}
      >
        {children}
      </span>
    </button>
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
          <div className="rounded-2xl glass-card p-10 grid place-items-center">
            <Loader2 className="w-6 h-6 text-white/78 animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-white/15 p-10 sm:p-16 grid place-items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center mb-4">
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
            <div className="hidden sm:block rounded-2xl glass-card overflow-hidden">
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
        <div className="rounded-2xl glass-card p-5 sm:p-6 mb-4">
          <AvatarUploader
            userId={userId}
            fallbackInitials={initials}
            onUploaded={() => {
              onAvatarUpdate?.();
            }}
          />
        </div>
        <form onSubmit={handleSave} className="rounded-2xl glass-card p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-xs text-white/78 uppercase tracking-wider">Correo</label>
            <div className="mt-1.5 relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" />
              <input
                type="email"
                value={email}
                disabled
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/78 text-sm cursor-not-allowed"
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
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
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
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
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
