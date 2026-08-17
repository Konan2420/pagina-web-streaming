import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6LzJFyz.mjs";
import { C as Send, E as RefreshCw, H as LoaderCircle, Ot as Banknote, y as ShieldAlert } from "../_libs/lucide-react.mjs";
import { a as objectType, i as numberType, n as booleanType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { i as useQuery, o as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { t as AdminLayout } from "./AdminLayout-C8SR68fz.mjs";
import { FLOID_ENTITIES, floidLimitsFor } from "./floid-entities-CYSl5pKy.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/payouts-BUItZ91c.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var payoutInput = objectType({
	currency: enumType(["PEN", "USD"]),
	amount: numberType().positive().max(3e4),
	entity: stringType().min(2).max(20),
	account: stringType().trim().min(6).max(30),
	name: stringType().trim().min(2).max(120),
	document_type: stringType().trim().max(10).optional(),
	document: stringType().trim().max(20).optional(),
	first_name: stringType().trim().max(60).optional(),
	father_lastname: stringType().trim().max(60).optional(),
	mother_lastname: stringType().trim().max(60).optional(),
	order_id: stringType().trim().max(60).optional(),
	sandbox: booleanType()
});
var getFloidConfigStatus = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("8f4aa8d017d3f16a4a99966689a8f5f339232494cbfcb030fc4b40e6479a5d92"));
var listPayouts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("bc05f26a986c8fc9d3e050e7f65ae472ee2d308c71a91a9813b8e378be404166"));
var createPayout = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => payoutInput.parse(d)).handler(createSsrRpc("fea5ac328a3286f847283ef761cd472d0ecfa05ca17e35f875239e09664efcae"));
var refreshPayoutStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("c76e1119215b91987b73dd2ac9d3f3daa21c47a539e47485e5ade3d141a1824d"));
var statusStyles = {
	SUCCESSFUL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
	PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
	PROCESSING: "bg-sky-500/15 text-sky-400 border-sky-500/30",
	ERROR: "bg-primary/15 text-primary border-primary/30"
};
function PayoutsAdmin() {
	const queryClient = useQueryClient();
	const fetchPayouts = useServerFn(listPayouts);
	const fetchConfig = useServerFn(getFloidConfigStatus);
	const submitPayout = useServerFn(createPayout);
	const refreshStatus = useServerFn(refreshPayoutStatus);
	const [submitting, setSubmitting] = (0, import_react.useState)(false);
	const [refreshingId, setRefreshingId] = (0, import_react.useState)(null);
	const [entity, setEntity] = (0, import_react.useState)("BCP");
	const [currency, setCurrency] = (0, import_react.useState)("PEN");
	const [sandbox, setSandbox] = (0, import_react.useState)(true);
	const config = useQuery({
		queryKey: ["floid-config"],
		queryFn: () => fetchConfig({})
	});
	const payouts = useQuery({
		queryKey: ["floid-payouts"],
		queryFn: () => fetchPayouts({})
	});
	const limits = floidLimitsFor(entity, currency);
	const isYape = entity === "YAPE";
	async function handleSubmit(e) {
		e.preventDefault();
		const form = new FormData(e.currentTarget);
		setSubmitting(true);
		try {
			const result = await submitPayout({ data: {
				currency,
				amount: Number(form.get("amount")),
				entity,
				account: String(form.get("account") ?? "").trim(),
				name: String(form.get("name") ?? "").trim(),
				document_type: String(form.get("document") ?? "").trim() ? "DNI" : void 0,
				document: String(form.get("document") ?? "").trim() || void 0,
				first_name: String(form.get("first_name") ?? "").trim() || void 0,
				father_lastname: String(form.get("father_lastname") ?? "").trim() || void 0,
				mother_lastname: String(form.get("mother_lastname") ?? "").trim() || void 0,
				order_id: String(form.get("order_id") ?? "").trim() || void 0,
				sandbox
			} });
			if (result.ok) {
				toast.success(`Payout ${result.status}: ${result.message ?? "enviado"}`);
				e.target.reset();
			} else toast.error(result.message ?? "Floid rechazó el payout");
			queryClient.invalidateQueries({ queryKey: ["floid-payouts"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Error al enviar el payout");
		} finally {
			setSubmitting(false);
		}
	}
	async function handleRefresh(id) {
		setRefreshingId(id);
		try {
			const res = await refreshStatus({ data: { id } });
			toast.success(`Estado: ${res.status}`);
			queryClient.invalidateQueries({ queryKey: ["floid-payouts"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo consultar el estado");
		} finally {
			setRefreshingId(null);
		}
	}
	const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/60";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Payouts",
		subtitle: "Dispersiones a bancos peruanos y Yape vía Floid",
		children: [config.data && !config.data.configured && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mb-6 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "mt-0.5 h-5 w-5 shrink-0 text-amber-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-sm text-amber-200/90",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-semibold text-amber-300",
					children: "Falta el token de Floid"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Puedes registrar payouts en la interfaz, pero no se enviarán hasta guardar el token Bearer que te entregue Floid." })]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "space-y-4 rounded-2xl border border-white/5 bg-ink/40 p-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-white",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "h-5 w-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg uppercase tracking-tight",
							children: "Nuevo payout"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium text-white/50",
								children: "Entidad"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: entity,
								onChange: (e) => setEntity(e.target.value),
								className: inputClass,
								children: FLOID_ENTITIES.map((ent) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: ent.code,
									className: "bg-ink",
									children: ent.label
								}, ent.code))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium text-white/50",
								children: "Moneda"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: currency,
								onChange: (e) => setCurrency(e.target.value),
								disabled: isYape,
								className: inputClass,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "PEN",
									className: "bg-ink",
									children: "PEN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "USD",
									className: "bg-ink",
									children: "USD"
								})]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-white/50",
							children: isYape ? "Número de celular" : "CCI (20 dígitos)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "account",
							required: true,
							maxLength: 30,
							className: inputClass,
							placeholder: isYape ? "987654321" : "00210011700199141190"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-white/50",
							children: "Nombre del beneficiario"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "name",
							required: true,
							maxLength: 120,
							className: inputClass,
							placeholder: "Andres Poblete"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-white/50",
									children: "DNI (opcional)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "document",
									maxLength: 20,
									className: inputClass,
									placeholder: "12345678"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-white/50",
									children: "Nombres"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "first_name",
									maxLength: 60,
									className: inputClass,
									placeholder: "Juan Ignacio"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-white/50",
									children: "Apellido paterno"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "father_lastname",
									maxLength: 60,
									className: inputClass,
									placeholder: "Pérez"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-medium text-white/50",
									children: "Apellido materno"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									name: "mother_lastname",
									maxLength: 60,
									className: inputClass,
									placeholder: "García"
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs font-medium text-white/50",
								children: [
									"Monto (",
									limits.min,
									"–",
									limits.max,
									")"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "amount",
								type: "number",
								step: "0.01",
								min: limits.min,
								max: limits.max,
								required: true,
								className: inputClass,
								placeholder: "100.50"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium text-white/50",
								children: "Referencia (opcional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "order_id",
								maxLength: 60,
								className: inputClass,
								placeholder: "ORD-12345"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: sandbox,
							onChange: (e) => setSandbox(e.target.checked),
							className: "h-4 w-4 accent-[var(--color-primary,#DC2626)]"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm text-white/70",
							children: ["Modo sandbox ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-white/40",
								children: "(no mueve dinero real)"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: submitting,
						className: "flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50",
						children: [submitting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "h-4 w-4" }), "Enviar payout"]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border border-white/5 bg-ink/40 p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-4 flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg uppercase tracking-tight text-white",
						children: "Historial"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => queryClient.invalidateQueries({ queryKey: ["floid-payouts"] }),
						className: "flex items-center gap-2 text-xs text-white/50 transition-colors hover:text-primary",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-3.5 w-3.5" }), " Actualizar"]
					})]
				}), payouts.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-10 text-center text-sm text-white/40",
					children: "Cargando payouts…"
				}) : (payouts.data?.length ?? 0) === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "py-10 text-center text-sm text-white/40",
					children: "Aún no hay payouts registrados."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-left text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "text-xs uppercase tracking-wide text-white/40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3",
									children: "Beneficiario"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3",
									children: "Entidad"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3",
									children: "Monto"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3",
									children: "Estado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { className: "pb-3" })
							] })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-white/5",
							children: payouts.data?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-white/80",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-white",
											children: p.beneficiary_name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-white/40",
											children: p.account
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3",
										children: [p.entity, p.sandbox && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "ml-2 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] uppercase text-white/50",
											children: "sandbox"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3 whitespace-nowrap",
										children: [
											p.currency,
											" ",
											Number(p.amount).toFixed(2)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: `rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusStyles[p.status] ?? "border-white/10 bg-white/5 text-white/60"}`,
											children: p.status
										}), p.error_message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 max-w-[220px] text-[11px] text-primary/80",
											children: p.error_message
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-3 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleRefresh(p.id),
											disabled: !p.payout_caseid || refreshingId === p.id,
											className: "rounded-lg border border-white/10 p-2 text-white/50 transition-colors hover:text-primary disabled:opacity-30",
											"aria-label": "Consultar estado",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-3.5 w-3.5 ${refreshingId === p.id ? "animate-spin" : ""}` })
										})
									})
								]
							}, p.id))
						})]
					})
				})]
			})]
		})]
	});
}
//#endregion
export { PayoutsAdmin as component };
