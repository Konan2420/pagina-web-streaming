import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent, type ReactNode } from "react";
import { Boxes, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import {
  deleteProviderProduct,
  getProviderProducts,
  saveProviderProduct,
  setProviderProductAvailability,
} from "@/lib/supplier.functions";

type ProviderProduct = Awaited<ReturnType<typeof getProviderProducts>>[number];

export const Route = createFileRoute("/_authenticated/proveedor/productos")({
  component: ProviderProducts,
});

function ProviderProducts() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<ProviderProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [availabilityId, setAvailabilityId] = useState<string | null>(null);
  const saveProduct = useServerFn(saveProviderProduct);
  const removeProduct = useServerFn(deleteProviderProduct);
  const setAvailability = useServerFn(setProviderProductAvailability);
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["provider-products"],
    queryFn: () => getProviderProducts(),
  });
  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm normal-case tracking-normal text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: ProviderProduct) => {
    setEditing(product);
    setFormOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    const form = new FormData(event.currentTarget);
    const imageUrl = String(form.get("image_url") ?? "").trim();
    const iconId = String(form.get("icon_id") ?? "").trim();
    const serviceId = String(form.get("service_id") ?? "").trim();

    setSaving(true);
    try {
      await saveProduct({
        data: {
          ...(editing ? { id: editing.id } : {}),
          name: String(form.get("name") ?? ""),
          price: Number(form.get("price") ?? 0),
          category: String(form.get("category") ?? "streaming"),
          duration_days: Number(form.get("duration_days") ?? 30),
          is_renewable: form.get("is_renewable") === "on",
          description: String(form.get("description") ?? ""),
          descripcion_larga: String(form.get("descripcion_larga") ?? ""),
          image_url: imageUrl || null,
          icon_id: iconId || null,
          service_id: serviceId || null,
        },
      });
      toast.success(
        editing
          ? "Cambios guardados como borrador para revisión."
          : "Producto creado como borrador para revisión.",
      );
      setFormOpen(false);
      setEditing(null);
      await queryClient.invalidateQueries({ queryKey: ["provider-products"] });
      await queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el producto.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: ProviderProduct) => {
    if (!window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
    setDeletingId(product.id);
    try {
      await removeProduct({ data: { id: product.id } });
      toast.success("Producto eliminado.");
      await queryClient.invalidateQueries({ queryKey: ["provider-products"] });
      await queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el producto.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAvailability = async (product: ProviderProduct) => {
    setAvailabilityId(product.id);
    try {
      await setAvailability({
        data: { id: product.id, is_catalog_available: !product.is_catalog_available },
      });
      toast.success(product.is_catalog_available ? "Producto marcado fuera de servicio." : "Producto habilitado para compra.");
      await queryClient.invalidateQueries({ queryKey: ["provider-products"] });
      await queryClient.invalidateQueries({ queryKey: ["public-products"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar la disponibilidad.");
    } finally {
      setAvailabilityId(null);
    }
  };

  return (
    <SupplierLayout
      title="Mis productos"
      subtitle="Crea y administra únicamente tus propios productos. Los cambios requieren aprobación antes de publicarse."
    >
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm text-white/50">{products.length} producto{products.length === 1 ? "" : "s"} propio{products.length === 1 ? "" : "s"}</p>
        <button onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="border-b border-white/8 text-[10px] font-black uppercase tracking-widest text-white/40">
              <tr><th className="px-5 py-4">Producto</th><th className="px-5 py-4">Categoría</th><th className="px-5 py-4">Precio</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {isLoading ? (
                Array.from({ length: 4 }, (_, index) => <tr key={index} className="animate-pulse"><td colSpan={5} className="h-16 px-5" /></tr>)
              ) : products.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-white/35"><Boxes className="mx-auto mb-3 h-6 w-6" />Aún no tienes productos.</td></tr>
              ) : products.map((product) => (
                <tr key={product.id} className="transition-colors hover:bg-white/[0.035]">
                  <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white/7"><img src={product.image_url || "/cmd-logo.png"} alt="" className="h-full w-full object-cover" /></div><span className="max-w-56 truncate font-semibold text-white">{product.name}</span></div></td>
                  <td className="px-5 py-4 text-white/55">{product.category || "General"}</td>
                  <td className="px-5 py-4 font-bold text-primary">S/ {Number(product.price).toFixed(2)}</td>
                  <td className="px-5 py-4"><span className={product.is_active ? product.is_catalog_available ? "rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-300" : "rounded-full bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-red-300" : "rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-200"}>{product.is_active ? product.is_catalog_available ? "Publicado" : "Fuera de servicio" : "Borrador"}</span></td>
                  <td className="px-5 py-4"><div className="flex justify-end gap-1"><button disabled={availabilityId === product.id} onClick={() => void handleAvailability(product)} className="rounded-lg p-2 text-white/50 transition hover:bg-white/7 hover:text-emerald-300 disabled:opacity-40" aria-label={product.is_catalog_available ? `Marcar ${product.name} fuera de servicio` : `Habilitar ${product.name} para compra`} title={product.is_catalog_available ? "Marcar fuera de servicio" : "Habilitar compra"}><Power className="h-4 w-4" /></button><button onClick={() => openEdit(product)} className="rounded-lg p-2 text-white/50 transition hover:bg-white/7 hover:text-white" aria-label={`Editar ${product.name}`}><Pencil className="h-4 w-4" /></button><button disabled={deletingId === product.id} onClick={() => void handleDelete(product)} className="rounded-lg p-2 text-white/50 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40" aria-label={`Eliminar ${product.name}`}><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <form onSubmit={handleSave} className="flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/8 p-5"><div><h2 className="font-display text-xl uppercase text-white">{editing ? "Editar producto" : "Nuevo producto"}</h2><p className="mt-1 text-xs text-white/45">Se guardará como borrador para aprobación.</p></div><button type="button" onClick={() => setFormOpen(false)} className="rounded-lg p-2 text-white/50 hover:bg-white/8 hover:text-white"><X className="h-5 w-5" /></button></header>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-5 sm:grid-cols-2">
              <Field label="Nombre" required><input name="name" required defaultValue={editing?.name} className={fieldClass} /></Field>
              <Field label="Precio (S/)" required><input name="price" required type="number" min="0" step="0.01" defaultValue={editing?.price} className={fieldClass} /></Field>
              <Field label="Categoría"><input name="category" defaultValue={editing?.category || "streaming"} className={fieldClass} /></Field>
              <Field label="Duración (días)" required><input name="duration_days" required type="number" min="1" defaultValue={editing?.duration_days ?? 30} className={fieldClass} /></Field>
              <Field label="URL de imagen"><input name="image_url" type="url" defaultValue={editing?.image_url || ""} className={fieldClass} /></Field>
              <Field label="ID de icono"><input name="icon_id" defaultValue={editing?.icon_id || ""} className={fieldClass} /></Field>
              <Field label="ID de plataforma"><input name="service_id" defaultValue={editing?.service_id || ""} className={fieldClass} /></Field>
              <label className="flex items-end gap-2 pb-2 text-sm text-white/70"><input name="is_renewable" type="checkbox" defaultChecked={editing?.is_renewable ?? true} className="h-4 w-4 accent-red-500" /> Producto renovable</label>
              <Field label="Descripción corta" className="sm:col-span-2"><input name="description" defaultValue={editing?.description || ""} className={fieldClass} /></Field>
              <Field label="Descripción detallada" className="sm:col-span-2"><textarea name="descripcion_larga" rows={4} defaultValue={editing?.descripcion_larga || ""} className={`${fieldClass} resize-y`} /></Field>
            </div>
            <footer className="flex justify-end gap-3 border-t border-white/8 p-5"><button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-white/12 px-4 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5">Cancelar</button><button disabled={saving} type="submit" className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white disabled:opacity-60">{saving ? "Guardando…" : "Guardar borrador"}</button></footer>
          </form>
        </div>
      )}
    </SupplierLayout>
  );
}

function Field({ label, children, className = "", required = false }: { label: string; children: ReactNode; className?: string; required?: boolean }) {
  return <label className={`grid gap-1.5 text-xs font-bold uppercase tracking-wide text-white/45 ${className}`}><span>{label}{required ? " *" : ""}</span>{children}</label>;
}
