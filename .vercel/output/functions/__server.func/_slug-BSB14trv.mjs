import { v as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "./_libs/@radix-ui/react-collection+[...].mjs";
import { Ct as Check, g as ShoppingBag } from "./_libs/lucide-react.mjs";
import { h as Route$17 } from "./_ssr/router-CZAAJbb_.mjs";
import { n as Navbar, t as Footer } from "./_ssr/Navbar-CDUa7r32.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-BSB14trv.js
var import_jsx_runtime = require_jsx_runtime();
function PlatformPage() {
	const page = Route$17.useLoaderData();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-background text-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navbar, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						"aria-label": "Ruta de navegación",
						className: "text-xs text-white/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/",
									className: "hover:text-white",
									children: "Inicio"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									"aria-hidden": "true",
									children: "/"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
									to: "/plataformas",
									className: "hover:text-white",
									children: "Plataformas"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									"aria-hidden": "true",
									children: "/"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
									className: "text-white/85",
									children: page.name
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mt-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-4xl sm:text-5xl",
								children: page.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-3 text-lg text-white/80",
								children: page.tagline
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 max-w-2xl text-white/72",
								children: page.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-6 text-2xl font-semibold text-red-accent",
								children: [
									"S/ ",
									page.price.toFixed(2),
									" ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-sm font-normal text-white/70",
										children: ["/ ", page.duracion]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/tienda",
								className: "mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-accent px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, {
									className: "size-4",
									"aria-hidden": "true"
								}), "Comprar en la tienda"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						"aria-labelledby": "incluye",
						className: "mt-14 border-t border-white/10 pt-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "incluye",
							className: "text-2xl",
							children: "Qué incluye"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "mt-5 grid gap-3 sm:grid-cols-2",
							children: page.includes.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start gap-3 text-sm text-white/78",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "mt-0.5 size-4 shrink-0 text-red-accent",
									"aria-hidden": "true"
								}), item]
							}, item))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						"aria-labelledby": "faq-plataforma",
						className: "mt-14 border-t border-white/10 pt-10",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "faq-plataforma",
							className: "text-2xl",
							children: "Preguntas frecuentes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dl", {
							className: "mt-5 space-y-6",
							children: page.faq.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-base font-semibold",
								children: f.q
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 max-w-2xl text-sm text-white/75",
								children: f.a
							})] }, f.q))
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})
		]
	});
}
//#endregion
export { PlatformPage as component };
