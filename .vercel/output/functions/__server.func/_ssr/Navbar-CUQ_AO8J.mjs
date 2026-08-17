import { i as __toESM } from "../_runtime.mjs";
import { n as platformPages } from "./platform-pages-D-sJNagi.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { r as useAnalytics } from "./useAnalytics-CwCxI5iY.mjs";
import { t as useIsAdmin } from "./useIsAdmin-Cl5SWJ_w.mjs";
import { R as Menu, _ as Shield, a as User, r as X } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Navbar-CUQ_AO8J.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var navLinks = [
	{
		label: "Inicio",
		href: "#inicio",
		active: true
	},
	{
		label: "Películas",
		href: "#peliculas"
	},
	{
		label: "Series",
		href: "#series"
	},
	{
		label: "Canales TV",
		href: "#canales"
	},
	{
		label: "Dispositivos",
		href: "#dispositivos"
	},
	{
		label: "Testimonios",
		href: "#testimonios"
	},
	{
		label: "Planes",
		href: "#planes"
	},
	{
		label: "FAQ",
		href: "#faq"
	},
	{
		label: "Contacto",
		href: "#contacto"
	}
];
var LEGAL = [
	"Términos y condiciones",
	"Política de privacidad",
	"Reembolsos"
];
/** Landing footer with brand, navigation and legal links. */
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "border-t border-white/10 bg-white/[0.02]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2.5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/favicon.png",
						alt: "CMD Streaming",
						className: "h-10 w-10 rounded-xl object-contain opacity-90 transition-opacity hover:opacity-100"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 text-sm text-white/70 max-w-xs",
					children: "Entretenimiento premium sin complicaciones: cine, series, deportes y TV en vivo en todos tus dispositivos."
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Navegación del pie",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[11px] uppercase tracking-[0.28em] text-white/55",
						children: "Navegación"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "mt-4 space-y-2.5",
						children: navLinks.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: l.href,
							className: "text-sm text-white/75 hover:text-white transition-colors",
							children: l.label
						}) }, l.label))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "Plataformas",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-[11px] uppercase tracking-[0.28em] text-white/55",
						children: "Plataformas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-2.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/plataformas",
								className: "text-sm text-white/75 hover:text-white transition-colors",
								children: "Todas las plataformas"
							}) }),
							platformPages.slice(0, 4).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/plataformas/$slug",
								params: { slug: p.slug },
								className: "text-sm text-white/75 hover:text-white transition-colors",
								children: p.name
							}) }, p.slug)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/tienda",
								className: "text-sm text-white/75 hover:text-white transition-colors",
								children: "Tienda"
							}) })
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[11px] uppercase tracking-[0.28em] text-white/55",
					children: "Legal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-2.5",
					children: LEGAL.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "text-sm text-white/75",
						children: l
					}, l))
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-[11px] uppercase tracking-[0.28em] text-white/55",
					children: "Soporte"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-white/75",
					children: "Atención 24/7 por WhatsApp. Respondemos en minutos, todos los días del año."
				})] })
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-t border-white/10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-white/60",
					children: "© 2026 CMD Streaming. Todos los derechos reservados."
				})
			})
		})]
	});
}
/** Sticky top navigation for the landing page. */
function Navbar({ onOpenAuth }) {
	const [scrolled, setScrolled] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const track = useAnalytics();
	const { isAuthorized } = useIsAdmin();
	(0, import_react.useEffect)(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!menuOpen) return;
		const onKey = (e) => {
			if (e.key === "Escape") setMenuOpen(false);
		};
		const mql = window.matchMedia("(min-width: 1024px)");
		const onChange = () => mql.matches && setMenuOpen(false);
		window.addEventListener("keydown", onKey);
		mql.addEventListener("change", onChange);
		return () => {
			window.removeEventListener("keydown", onKey);
			mql.removeEventListener("change", onChange);
		};
	}, [menuOpen]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/95 sm:bg-background/80 border-b border-white/5 sm:backdrop-blur-xl" : "bg-transparent"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
			"aria-label": "Navegación principal",
			className: "max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-5 lg:px-8 py-3 sm:py-3.5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: "#inicio",
					"aria-label": "CMD Streaming - Inicio",
					className: "group flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/favicon.png",
						alt: "CMD Streaming",
						className: "h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain transition-transform group-hover:scale-105"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "hidden lg:flex items-center gap-7 text-sm text-white/80",
					children: navLinks.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: l.href,
						"aria-current": l.active ? "page" : void 0,
						className: `relative py-1 rounded-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${l.active ? "text-white" : ""}`,
						children: [l.label, l.active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							className: "absolute -bottom-1 left-0 right-0 h-[2px] rounded-full gradient-violet"
						})]
					}) }, l.label))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						isAuthorized && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/admin",
							className: "hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary text-primary text-sm hover:bg-primary/10 transition-all",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-4 h-4" }), "Panel Admin"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								track("cta_click", {
									eventName: "navbar_login",
									metadata: { location: "navbar" }
								});
								onOpenAuth?.("login");
							},
							className: "hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet/50 text-white text-sm hover:border-violet hover:bg-violet/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
								"aria-hidden": "true",
								className: "w-4 h-4"
							}), "Iniciar Sesión"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								track("cta_click", {
									eventName: "navbar_signup",
									metadata: { location: "navbar" }
								});
								onOpenAuth?.("signup");
							},
							className: "hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-violet text-white text-sm font-semibold hover:scale-[1.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							children: "Crear cuenta"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMenuOpen(!menuOpen),
							className: "lg:hidden inline-flex items-center justify-center min-w-11 min-h-11 p-2 rounded-lg text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
							"aria-label": menuOpen ? "Cerrar menú" : "Abrir menú",
							"aria-expanded": menuOpen,
							"aria-controls": "mobile-menu",
							children: menuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
								"aria-hidden": "true",
								className: "w-6 h-6"
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
								"aria-hidden": "true",
								className: "w-6 h-6"
							})
						})
					]
				})
			]
		}), menuOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			id: "mobile-menu",
			className: "lg:hidden border-t border-white/5 bg-background/95 pb-safe",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "px-6 py-4 flex flex-col gap-1",
				children: [navLinks.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					href: l.href,
					onClick: () => setMenuOpen(false),
					"aria-current": l.active ? "page" : void 0,
					className: `block py-3 text-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 ${l.active ? "text-white" : "text-white/80"} hover:text-white`,
					children: l.label
				}) }, l.label)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "pt-2 flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							setMenuOpen(false);
							track("cta_click", {
								eventName: "navbar_login_mobile",
								metadata: { location: "navbar_mobile" }
							});
							onOpenAuth?.("login");
						},
						className: "inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet/50 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, {
							"aria-hidden": "true",
							className: "w-4 h-4"
						}), " Iniciar sesión"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							setMenuOpen(false);
							track("cta_click", {
								eventName: "navbar_signup_mobile",
								metadata: { location: "navbar_mobile" }
							});
							onOpenAuth?.("signup");
						},
						className: "inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-violet text-white text-sm font-semibold",
						children: "Crear cuenta"
					})]
				})]
			})
		})]
	});
}
//#endregion
export { Navbar as n, Footer as t };
