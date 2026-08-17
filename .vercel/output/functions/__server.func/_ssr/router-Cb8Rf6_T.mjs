import { i as __toESM } from "../_runtime.mjs";
import { n as platformPages } from "./platform-pages-D-sJNagi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { L as redirect, _ as createRootRouteWithContext, g as createFileRoute, h as lazyRouteComponent, l as Scripts, m as Outlet, p as createRouter, u as HeadContent, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as Route$20 } from "../_slug-mXZpWn83.mjs";
import { t as supabase } from "./client-BoZLFmz6.mjs";
import { i as usePageView, n as setConsent, t as getConsent } from "./useAnalytics-CwCxI5iY.mjs";
import { H as LoaderCircle, M as Package, a as User, bt as CircleAlert, dt as Cookie, ot as ExternalLink, pt as Clock, q as Key, r as X, w as Search, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { a as objectType, i as numberType, o as stringType } from "../_libs/zod.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { a as QueryClientProvider, n as queryOptions, o as useQueryClient, r as useSuspenseQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Route$21 } from "./admin-BIPaWa1t.mjs";
import { t as AdminLayout } from "./AdminLayout-C8SR68fz.mjs";
import { t as dashboardQueryOptions } from "./analytics-BWcQsCys.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$22 } from "./inventario-CPXMDNNq.mjs";
import { n as usersQueryOptions, t as manualOrdersQueryOptions } from "./pedidos-manuales-b1f6GIyF.mjs";
import { t as productsQueryOptions } from "./productos-DJQT6lAe.mjs";
import { n as Route$23 } from "./tienda-D4Vlr0J7.mjs";
import { t as Route$24 } from "./servicios-CF2AXbYL.mjs";
import { t as Route$25 } from "./usuarios-B0hnKLU-.mjs";
import { t as ventasQueryOptions } from "./ventas-BBSdqlQe.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-Cb8Rf6_T.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-DpTrRauP.css";
/** Consent banner for analytics tracking. Shown until user makes a choice. */
function ConsentBanner() {
	const [visible, setVisible] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (getConsent() === null) setVisible(true);
	}, []);
	if (!visible) return null;
	const decide = (v) => {
		setConsent(v);
		setVisible(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		role: "dialog",
		"aria-live": "polite",
		"aria-label": "Consentimiento de analítica",
		className: "fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] max-w-md rounded-2xl glass-card border border-white/10 bg-background/90 p-4 sm:p-5 animate-fade-up",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "w-9 h-9 rounded-full grid place-items-center gradient-violet shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cookie, {
					className: "w-4 h-4 text-white",
					"aria-hidden": "true"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-semibold text-white",
						children: "Tu privacidad"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-xs text-white/70 leading-relaxed",
						children: "Usamos analítica interna para entender cómo mejoras tu experiencia con CMD Streaming. No compartimos datos con terceros. Puedes cambiar tu decisión en cualquier momento."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => decide("granted"),
							className: "inline-flex items-center justify-center px-4 py-2 rounded-full gradient-violet text-white text-xs font-semibold hover:scale-[1.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70",
							children: "Aceptar"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => decide("denied"),
							className: "inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/15 bg-white/[0.03] text-white text-xs font-medium hover:border-white/30 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70",
							children: "Rechazar"
						})]
					})
				]
			})]
		})
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		console.error("[CMD Streaming] Error de ruta:", error);
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$19 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{
				name: "author",
				content: "CMD Streaming"
			},
			{
				property: "og:site_name",
				content: "CMD Streaming"
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.png",
				type: "image/png"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "es",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$19.useRouteContext();
	usePageView();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "top-center",
				richColors: true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConsentBanner, {})
		]
	});
}
var $$splitComponentImporter$15 = () => import("./routes-BeDUXsUN.mjs");
var Route$18 = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "CMD Streaming — Cine, series y TV en vivo en 4K" },
			{
				name: "description",
				content: "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia."
			},
			{
				property: "og:title",
				content: "CMD Streaming — Cine, series y TV en vivo en 4K"
			},
			{
				property: "og:description",
				content: "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:url",
				content: "https://cmdstreaming.pe/"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://cmdstreaming.pe/"
		}]
	}),
	component: lazyRouteComponent($$splitComponentImporter$15, "component")
});
var $$splitComponentImporter$14 = () => import("./route-Di7iQBCH.mjs");
var Route$17 = createFileRoute("/_authenticated")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		if (error || !data.user) throw redirect({ to: "/tienda" });
		return { user: data.user };
	},
	component: lazyRouteComponent($$splitComponentImporter$14, "component")
});
var BASE_URL = "https://cmdstreaming.pe";
var Route$16 = createFileRoute("/sitemap.xml")({ server: { handlers: { GET: async () => {
	const xml = [
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
		...[
			{
				path: "/",
				changefreq: "weekly",
				priority: "1.0"
			},
			{
				path: "/tienda",
				changefreq: "daily",
				priority: "0.9"
			},
			{
				path: "/plataformas",
				changefreq: "weekly",
				priority: "0.8"
			},
			...platformPages.map((p) => ({
				path: `/plataformas/${p.slug}`,
				changefreq: "weekly",
				priority: "0.7"
			}))
		].map((e) => [
			`  <url>`,
			`    <loc>${BASE_URL}${e.path}</loc>`,
			e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
			e.priority ? `    <priority>${e.priority}</priority>` : null,
			`  </url>`
		].filter(Boolean).join("\n")),
		`</urlset>`
	].join("\n");
	return new Response(xml, { headers: {
		"Content-Type": "application/xml",
		"Cache-Control": "public, max-age=3600"
	} });
} } } });
var $$splitComponentImporter$13 = () => import("./route-CIk8GCv4.mjs");
var Route$15 = createFileRoute("/_authenticated/admin")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		const user = data.user;
		if (!user) throw redirect({ to: "/tienda" });
		if (error) throw redirect({ to: "/tienda" });
		const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
			_user_id: user.id,
			_role: "admin"
		});
		if (roleError || !isAdmin) throw redirect({ to: "/tienda" });
		return { isAdmin: true };
	},
	component: lazyRouteComponent($$splitComponentImporter$13, "component")
});
var $$splitComponentImporter$12 = () => import("./proveedor-Cakrsxur.mjs");
var Route$14 = createFileRoute("/_authenticated/proveedor")({
	ssr: false,
	beforeLoad: async () => {
		const { data, error } = await supabase.auth.getUser();
		const user = data.user;
		if (error || !user) throw redirect({ to: "/tienda" });
		const [{ data: isSupplier, error: supplierError }, { data: isAdmin, error: adminError }] = await Promise.all([supabase.rpc("has_role", {
			_user_id: user.id,
			_role: "proveedor"
		}), supabase.rpc("has_role", {
			_user_id: user.id,
			_role: "admin"
		})]);
		if (supplierError || adminError || !isSupplier && !isAdmin) throw redirect({ to: "/tienda" });
		return {
			isSupplier,
			isAdmin
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$12, "component")
});
var $$splitComponentImporter$11 = () => import("./plataformas-DlwJnf5N.mjs");
var Route$13 = createFileRoute("/plataformas/")({
	head: () => ({
		meta: [
			{ title: "Plataformas de streaming y precios — CMD Streaming" },
			{
				name: "description",
				content: "Precios y detalles de cada plataforma: Netflix, Disney+, HBO Max, Prime Video, Spotify y combos. Activación el mismo día y sin permanencia."
			},
			{
				property: "og:title",
				content: "Plataformas de streaming y precios — CMD Streaming"
			},
			{
				property: "og:description",
				content: "Compara plataformas, precios y qué incluye cada plan de CMD Streaming."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:url",
				content: "https://cmdstreaming.pe/plataformas"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://cmdstreaming.pe/plataformas"
		}],
		scripts: [{
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "ItemList",
				name: "Plataformas de streaming disponibles",
				itemListElement: platformPages.map((p, i) => ({
					"@type": "ListItem",
					position: i + 1,
					name: p.name,
					url: `/plataformas/${p.slug}`
				}))
			})
		}]
	}),
	component: lazyRouteComponent($$splitComponentImporter$11, "component")
});
var $$splitNotFoundComponentImporter = () => import("./analytics-DfoKY0ES.mjs");
var $$splitErrorComponentImporter = () => import("./analytics-D7tA51ap.mjs");
var $$splitComponentImporter$10 = () => import("./analytics-sGsoQDBn.mjs");
var Route$12 = createFileRoute("/_authenticated/admin/analytics")({
	head: () => ({ meta: [
		{ title: "Analytics — CMD Streaming" },
		{
			name: "description",
			content: "Panel de analítica interna de CMD Streaming."
		},
		{
			property: "og:title",
			content: "Analytics — CMD Streaming"
		},
		{
			property: "og:description",
			content: "Panel de analítica interna."
		},
		{
			property: "og:type",
			content: "website"
		},
		{
			name: "twitter:card",
			content: "summary"
		},
		{
			name: "robots",
			content: "noindex, nofollow"
		}
	] }),
	loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$10, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
	notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent")
});
var $$splitComponentImporter$9 = () => import("./inventario-0t5-77Ya.mjs");
var Route$11 = createFileRoute("/_authenticated/admin/inventario")({ component: lazyRouteComponent($$splitComponentImporter$9, "component") });
var $$splitComponentImporter$8 = () => import("./payouts-BUItZ91c.mjs");
var Route$10 = createFileRoute("/_authenticated/admin/payouts")({
	component: lazyRouteComponent($$splitComponentImporter$8, "component"),
	head: () => ({ meta: [{ title: "Payouts Floid | CMD Streaming Admin" }, {
		name: "description",
		content: "Envía y monitorea dispersiones de dinero a bancos peruanos y Yape con Floid."
	}] })
});
var pedidosQueryOptions = queryOptions({
	queryKey: ["admin-pedidos-list"],
	queryFn: async () => {
		const { data: orders, error: ordersError } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
		if (ordersError) throw ordersError;
		const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
		let profilesMap = {};
		if (userIds.length > 0) {
			const { data: profiles } = await supabase.from("profiles").select("id, nombre_completo, whatsapp").in("id", userIds);
			profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
		}
		const { data: delivered, error: deliveredError } = await supabase.from("delivered_accounts").select("order_id, user_id, email, password, access_link, notes");
		if (deliveredError) console.error("Error fetching delivered accounts:", deliveredError);
		const deliveredMap = Object.fromEntries((delivered || []).map((delivery) => [delivery.order_id, delivery]));
		return orders.map((order) => ({
			...order,
			profile: profilesMap[order.user_id] ?? null,
			delivery: deliveredMap[order.id] ?? null
		}));
	}
});
var Route$9 = createFileRoute("/_authenticated/admin/pedidos")({
	loader: ({ context }) => context.queryClient.ensureQueryData(pedidosQueryOptions),
	component: PedidosManagement
});
function PedidosManagement() {
	const { data: pedidos } = useSuspenseQuery(pedidosQueryOptions);
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("all");
	const [selectedPedido, setSelectedPedido] = (0, import_react.useState)(null);
	const queryClient = useQueryClient();
	const filteredPedidos = pedidos.filter((p) => {
		const matchesSearch = (p.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) || (p.profile?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase());
		if (filterStatus === "all") return matchesSearch;
		if (filterStatus === "pending") return matchesSearch && (p.estado === "pendiente" || p.estado === "pending_delivery");
		if (filterStatus === "delivered") return matchesSearch && (p.estado === "entregado" || p.estado === "delivered");
		return matchesSearch;
	});
	const deliverMutation = useMutation({
		mutationFn: async (deliveryData) => {
			const { order_id, user_id, email, password, access_link, notes } = deliveryData;
			const { error: deliveryError } = await supabase.from("delivered_accounts").insert({
				order_id,
				user_id,
				email,
				password,
				access_link,
				notes
			});
			if (deliveryError) throw deliveryError;
			const { error: orderError } = await supabase.from("orders").update({ estado: "delivered" }).eq("id", order_id);
			if (orderError) throw orderError;
		},
		onSuccess: () => {
			toast.success("Cuenta asignada y pedido marcado como entregado");
			queryClient.invalidateQueries({ queryKey: ["admin-pedidos-list"] });
			setSelectedPedido(null);
		},
		onError: (error) => {
			toast.error(`Error: ${error instanceof Error ? error.message : "Desconocido"}`);
		}
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Pedidos y Entregas",
		subtitle: "Gestiona la entrega de credenciales a los clientes",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row items-center justify-between gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full lg:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar por cliente o producto...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full lg:w-auto",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilterStatus("all"),
							className: `flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:text-white"}`,
							children: "Todos"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilterStatus("pending"),
							className: `flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "pending" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "text-white/60 hover:text-white"}`,
							children: "Pendientes"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setFilterStatus("delivered"),
							className: `flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "delivered" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-white/60 hover:text-white"}`,
							children: "Entregados"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4",
				children: filteredPedidos.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5",
					children: "No hay pedidos que coincidan con los filtros."
				}) : filteredPedidos.map((pedido) => {
					const isDelivered = pedido.estado === "delivered" || pedido.estado === "entregado" || !!pedido.delivery;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group relative overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute top-0 right-0 p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isDelivered ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`,
								children: isDelivered ? "Entregado" : "Pendiente"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col md:flex-row md:items-center gap-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 md:w-64 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-5 h-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold text-white",
										children: pedido.profile?.nombre_completo || "Usuario Desconocido"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-white/40 font-mono",
										children: pedido.profile?.whatsapp || "Sin contacto"
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 flex items-center gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-white/80",
										children: pedido.producto_nombre
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3 mt-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-mono text-primary font-bold",
											children: ["S/ ", Number(pedido.precio ?? 0).toFixed(2)]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[10px] text-white/30 flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3 h-3" }), new Date(pedido.created_at).toLocaleString()]
										})]
									})] })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-3 md:w-40 justify-end shrink-0",
									children: !isDelivered ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setSelectedPedido(pedido),
										className: "w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "w-3.5 h-3.5" }), "Asignar Cuenta"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setSelectedPedido(pedido),
										className: "w-full py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3.5 h-3.5" }), "Ver Entrega"]
									})
								})
							]
						})]
					}, pedido.id);
				})
			}),
			selectedPedido && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/80 backdrop-blur-sm",
					onClick: () => setSelectedPedido(null)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-xl bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden animate-scale-in",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-lg font-bold text-white",
							children: selectedPedido.delivery ? "Detalles de Entrega" : "Asignar Credenciales"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-white/40 mt-1",
							children: [
								"Pedido #",
								selectedPedido.id.slice(0, 8),
								" • ",
								selectedPedido.producto_nombre
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setSelectedPedido(null),
							className: "w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "p-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: (e) => {
								e.preventDefault();
								if (selectedPedido.delivery) return;
								const formData = new FormData(e.currentTarget);
								deliverMutation.mutate({
									order_id: selectedPedido.id,
									user_id: selectedPedido.user_id,
									email: String(formData.get("email") ?? ""),
									password: String(formData.get("password") ?? ""),
									access_link: String(formData.get("access_link") ?? ""),
									notes: String(formData.get("notes") ?? "")
								});
							},
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Email / Usuario"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "email",
											defaultValue: selectedPedido.delivery?.email || "",
											readOnly: !!selectedPedido.delivery,
											className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50",
											placeholder: "ejemplo@correo.com"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Contraseña"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											name: "password",
											defaultValue: selectedPedido.delivery?.password || "",
											readOnly: !!selectedPedido.delivery,
											className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50",
											placeholder: "••••••••"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
										children: "Link de Acceso (Opcional)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "access_link",
										defaultValue: selectedPedido.delivery?.access_link || "",
										readOnly: !!selectedPedido.delivery,
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50",
										placeholder: "https://..."
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
										children: "Notas / Instrucciones (PIN, Perfil, etc.)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										name: "notes",
										defaultValue: selectedPedido.delivery?.notes || "",
										readOnly: !!selectedPedido.delivery,
										rows: 3,
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none disabled:opacity-50",
										placeholder: "Escribe aquí instrucciones adicionales para el cliente..."
									})]
								}),
								!selectedPedido.delivery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-4 flex flex-col gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-4 h-4 text-blue-400 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-blue-300 leading-relaxed",
											children: "Al asignar la cuenta, el estado del pedido cambiará a \"Entregado\" y el cliente podrá ver estas credenciales inmediatamente en su panel."
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: deliverMutation.isPending,
										className: "w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
										children: deliverMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }), "Procesando..."] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4" }), "Confirmar Entrega"] })
									})]
								})
							]
						})
					})]
				})]
			})
		]
	});
}
var $$splitComponentImporter$7 = () => import("./pedidos-manuales-DniUOczd.mjs");
var Route$8 = createFileRoute("/_authenticated/admin/pedidos-manuales")({
	loader: ({ context }) => {
		context.queryClient.ensureQueryData(manualOrdersQueryOptions);
		context.queryClient.ensureQueryData(usersQueryOptions);
	},
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("./productos-DVRDObM2.mjs");
var Route$7 = createFileRoute("/_authenticated/admin/productos")({
	loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./proveedores-Oov4NcV5.mjs");
var Route$6 = createFileRoute("/_authenticated/admin/proveedores")({ component: lazyRouteComponent($$splitComponentImporter$5, "component") });
var $$splitComponentImporter$4 = () => import("./stock-Bwl6lBfQ.mjs");
var Route$5 = createFileRoute("/_authenticated/admin/stock")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
var $$splitComponentImporter$3 = () => import("./ventas-CAhaNdiY.mjs");
var Route$4 = createFileRoute("/_authenticated/admin/ventas")({
	loader: ({ context }) => context.queryClient.ensureQueryData(ventasQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("./proveedor-XhlPDVfI.mjs");
var Route$3 = createFileRoute("/_authenticated/proveedor/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./perfil-DFORxE2n.mjs");
var Route$2 = createFileRoute("/_authenticated/proveedor/perfil")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
var $$splitComponentImporter = () => import("./ventas-DAGOqNDM.mjs");
var Route$1 = createFileRoute("/_authenticated/proveedor/ventas")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var webhookSchema = objectType({
	event: stringType(),
	payout_caseid: stringType().min(1).max(100),
	status: stringType().max(30),
	entity: stringType().max(30).optional(),
	data: objectType({
		amount: numberType().optional(),
		currency: stringType().optional(),
		beneficiary_name: stringType().optional(),
		beneficiary_account: stringType().optional(),
		transaction_id: stringType().optional(),
		message: stringType().optional(),
		updated_at: stringType().optional()
	}).optional()
});
var Route = createFileRoute("/api/public/webhooks/floid")({ server: { handlers: { POST: async ({ request }) => {
	const secret = process.env["FLOID_WEBHOOK_SECRET"];
	const token = new URL(request.url).searchParams.get("token");
	if (!secret || token !== secret) return new Response("Invalid token", { status: 401 });
	let payload;
	try {
		payload = webhookSchema.parse(await request.json());
	} catch {
		return new Response("Invalid payload", { status: 400 });
	}
	if (payload.event !== "payout.update") return new Response("ok");
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("payouts").update({
		status: payload.status,
		message: payload.data?.message ?? null,
		transaction_id: payload.data?.transaction_id ?? null,
		raw_response: payload
	}).eq("payout_caseid", payload.payout_caseid);
	if (error) {
		console.error("Floid webhook update failed:", error.message);
		return new Response("Update failed", { status: 500 });
	}
	return new Response("ok");
} } } });
var IndexRoute = Route$18.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$19
});
var AuthenticatedRouteRoute = Route$17.update({
	id: "/_authenticated",
	getParentRoute: () => Route$19
});
var SitemapDotxmlRoute = Route$16.update({
	id: "/sitemap.xml",
	path: "/sitemap.xml",
	getParentRoute: () => Route$19
});
var TiendaRoute = Route$23.update({
	id: "/tienda",
	path: "/tienda",
	getParentRoute: () => Route$19
});
var AuthenticatedAdminRouteRoute = Route$15.update({
	id: "/admin",
	path: "/admin",
	getParentRoute: () => AuthenticatedRouteRoute
});
var AuthenticatedProveedorRoute = Route$14.update({
	id: "/proveedor",
	path: "/proveedor",
	getParentRoute: () => AuthenticatedRouteRoute
});
var PlataformasIndexRoute = Route$13.update({
	id: "/plataformas/",
	path: "/plataformas/",
	getParentRoute: () => Route$19
});
var PlataformasSlugRoute = Route$20.update({
	id: "/plataformas/$slug",
	path: "/plataformas/$slug",
	getParentRoute: () => Route$19
});
var AuthenticatedAdminIndexRoute = Route$21.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminAnalyticsRoute = Route$12.update({
	id: "/analytics",
	path: "/analytics",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminInventarioRoute = Route$11.update({
	id: "/inventario",
	path: "/inventario",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminPayoutsRoute = Route$10.update({
	id: "/payouts",
	path: "/payouts",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminPedidosRoute = Route$9.update({
	id: "/pedidos",
	path: "/pedidos",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminPedidosManualesRoute = Route$8.update({
	id: "/pedidos-manuales",
	path: "/pedidos-manuales",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminProductosRoute = Route$7.update({
	id: "/productos",
	path: "/productos",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminProveedoresRoute = Route$6.update({
	id: "/proveedores",
	path: "/proveedores",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminServiciosRoute = Route$24.update({
	id: "/servicios",
	path: "/servicios",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminStockRoute = Route$5.update({
	id: "/stock",
	path: "/stock",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminUsuariosRoute = Route$25.update({
	id: "/usuarios",
	path: "/usuarios",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedAdminVentasRoute = Route$4.update({
	id: "/ventas",
	path: "/ventas",
	getParentRoute: () => AuthenticatedAdminRouteRoute
});
var AuthenticatedProveedorIndexRoute = Route$3.update({
	id: "/",
	path: "/",
	getParentRoute: () => AuthenticatedProveedorRoute
});
var AuthenticatedProveedorInventarioRoute = Route$22.update({
	id: "/inventario",
	path: "/inventario",
	getParentRoute: () => AuthenticatedProveedorRoute
});
var AuthenticatedProveedorPerfilRoute = Route$2.update({
	id: "/perfil",
	path: "/perfil",
	getParentRoute: () => AuthenticatedProveedorRoute
});
var AuthenticatedProveedorVentasRoute = Route$1.update({
	id: "/ventas",
	path: "/ventas",
	getParentRoute: () => AuthenticatedProveedorRoute
});
var ApiPublicWebhooksFloidRoute = Route.update({
	id: "/api/public/webhooks/floid",
	path: "/api/public/webhooks/floid",
	getParentRoute: () => Route$19
});
var AuthenticatedAdminRouteRouteChildren = {
	AuthenticatedAdminAnalyticsRoute,
	AuthenticatedAdminInventarioRoute,
	AuthenticatedAdminPayoutsRoute,
	AuthenticatedAdminPedidosRoute,
	AuthenticatedAdminPedidosManualesRoute,
	AuthenticatedAdminProductosRoute,
	AuthenticatedAdminProveedoresRoute,
	AuthenticatedAdminServiciosRoute,
	AuthenticatedAdminStockRoute,
	AuthenticatedAdminUsuariosRoute,
	AuthenticatedAdminVentasRoute,
	AuthenticatedAdminIndexRoute
};
var AuthenticatedAdminRouteRouteWithChildren = AuthenticatedAdminRouteRoute._addFileChildren(AuthenticatedAdminRouteRouteChildren);
var AuthenticatedProveedorRouteChildren = {
	AuthenticatedProveedorInventarioRoute,
	AuthenticatedProveedorPerfilRoute,
	AuthenticatedProveedorVentasRoute,
	AuthenticatedProveedorIndexRoute
};
var AuthenticatedRouteRouteChildren = {
	AuthenticatedAdminRouteRoute: AuthenticatedAdminRouteRouteWithChildren,
	AuthenticatedProveedorRoute: AuthenticatedProveedorRoute._addFileChildren(AuthenticatedProveedorRouteChildren)
};
var rootRouteChildren = {
	IndexRoute,
	AuthenticatedRouteRoute: AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren),
	SitemapDotxmlRoute,
	TiendaRoute,
	PlataformasSlugRoute,
	PlataformasIndexRoute,
	ApiPublicWebhooksFloidRoute
};
var routeTree = Route$19._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
