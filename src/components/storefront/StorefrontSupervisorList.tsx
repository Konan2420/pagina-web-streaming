import { useMemo, useState } from "react";
import { Eye, Search, Store, UserRound } from "lucide-react";
import { getStorefrontTemplate } from "@/components/storefront/storefront-templates";

export type StorefrontSupervisorRow = {
  owner_id: string;
  owner_name: string;
  owner_role: "proveedor" | "distribuidor";
  logo_url: string | null;
  template_key: string;
  is_public: boolean;
  last_published_at: string | null;
  product_count: number;
  total_sales: number;
};

function formatDate(value: string | null) {
  if (!value) return "Sin publicaciones";
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function StorefrontSupervisorList({
  stores,
  loading,
  onOpen,
}: {
  stores: StorefrontSupervisorRow[];
  loading: boolean;
  onOpen: (ownerId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [templateKey, setTemplateKey] = useState("all");
  const templates = useMemo(
    () => [...new Set(stores.map((store) => store.template_key))].sort((a, b) => getStorefrontTemplate(a).name.localeCompare(getStorefrontTemplate(b).name, "es")),
    [stores],
  );
  const results = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("es");
    return stores.filter((store) => {
      const template = getStorefrontTemplate(store.template_key);
      return (
        (!term || [store.owner_name, store.owner_role, template.name].some((value) => value.toLocaleLowerCase("es").includes(term))) &&
        (status === "all" || (status === "active" ? store.is_public : !store.is_public)) &&
        (templateKey === "all" || store.template_key === templateKey)
      );
    });
  }, [query, status, stores, templateKey]);

  return (
    <section className="rounded-xl border border-border bg-card/45 p-4 sm:p-5">
      <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Supervisión</p>
          <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">Tiendas de la plataforma</h2>
          <p className="mt-1 text-sm text-white/55">Selecciona una tienda para revisar o publicar sus ajustes visuales.</p>
        </div>
        <p className="text-xs font-semibold text-white/45">{results.length} {results.length === 1 ? "tienda" : "tiendas"}</p>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_11rem_12rem]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por tienda, usuario o plantilla..." className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-red-accent/70" />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | "active" | "inactive")} className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-white outline-none focus:border-red-accent/70">
          <option value="all">Todos los estados</option><option value="active">Activas</option><option value="inactive">Inactivas</option>
        </select>
        <select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} className="h-10 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-white outline-none focus:border-red-accent/70">
          <option value="all">Todas las plantillas</option>
          {templates.map((key) => <option key={key} value={key}>{getStorefrontTemplate(key).name}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border/80">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="border-b border-border bg-background/75 text-[10px] uppercase tracking-wide text-white/45">
            <tr><th className="px-4 py-3">Tienda / usuario</th><th className="px-4 py-3">Rol</th><th className="px-4 py-3">Plantilla</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Última publicación</th><th className="px-4 py-3">Productos</th><th className="px-4 py-3">Ventas</th><th className="px-4 py-3 text-right">Acción</th></tr>
          </thead>
          <tbody className="divide-y divide-border/70">
            {loading ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-white/45">Cargando tiendas…</td></tr> : results.length === 0 ? <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-white/45">No se encontraron tiendas con estos filtros.</td></tr> : results.map((store) => {
              const template = getStorefrontTemplate(store.template_key);
              return <tr key={store.owner_id} className="transition-colors hover:bg-white/[0.025]">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-card"><>{store.logo_url ? <img src={store.logo_url} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-4 w-4 text-white/45" />}</></span><div><p className="font-semibold text-white">{store.owner_name}</p><p className="text-[11px] text-white/45">Tienda comercial</p></div></div></td>
                <td className="px-4 py-3 capitalize text-white/65">{store.owner_role}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1.5 text-white/75"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: template.accent }} />{template.name}</span></td>
                <td className="px-4 py-3"><span className={store.is_public ? "rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300" : "rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/50"}>{store.is_public ? "Activa" : "Inactiva"}</span></td>
                <td className="px-4 py-3 text-xs text-white/55">{formatDate(store.last_published_at)}</td><td className="px-4 py-3 font-semibold text-white">{store.product_count}</td><td className="px-4 py-3 font-semibold text-white">{store.total_sales}</td>
                <td className="px-4 py-3 text-right"><button type="button" onClick={() => onOpen(store.owner_id)} className="inline-flex h-11 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-bold text-white/80 transition hover:border-primary/60 hover:text-white sm:h-8"><Eye className="h-3.5 w-3.5" /> Gestionar</button></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
      {!loading && stores.length === 0 && <div className="mt-4 flex items-center gap-3 rounded-lg border border-dashed border-border p-4 text-sm text-white/50"><Store className="h-5 w-5 text-primary" />Aún no hay tiendas de proveedores o distribuidores para supervisar.</div>}
    </section>
  );
}
