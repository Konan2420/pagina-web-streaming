import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tv, Plus, Tag, Globe, Settings2, Trash2, Edit2 } from "lucide-react";
import { getServicios, addServicio, deleteServicio, updateServicio } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

const serviciosQueryOptions = queryOptions({
  queryKey: ["admin-servicios-full"],
  queryFn: () => getServicios(),
});

export const Route = createFileRoute("/_authenticated/admin/servicios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(serviciosQueryOptions),
  component: ServicesManagement,
});

function ServicesManagement() {
  const { data: servicios } = useSuspenseQuery(serviciosQueryOptions);
  const { isAdmin } = Route.useRouteContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Tables<"servicios_streaming"> | null>(null);

  const queryClient = useQueryClient();
  const addServicioMutation = useServerFn(addServicio);
  const updateServicioMutation = useServerFn(updateServicio);
  const deleteServicioMutation = useServerFn(deleteServicio);

  const openCreateModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Tables<"servicios_streaming">) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar el servicio "${name}"? Se eliminará también el stock asociado.`,
      )
    )
      return;
    try {
      await deleteServicioMutation({ data: { id } });
      toast.success("Servicio eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-servicios-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-servicios-list"] });
    } catch (err) {
      toast.error(
        "Error al eliminar: " + (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  const handleSaveServicio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      nombre: formData.get("nombre") as string,
      slug: (formData.get("nombre") as string).toLowerCase().replace(/\s+/g, "-"),
      categoria: formData.get("categoria") as string,
      icono: (formData.get("icono") as string) || undefined,
    };

    try {
      if (editingService) {
        await updateServicioMutation({ data: { ...data, id: editingService.id } });
        toast.success("Servicio actualizado correctamente");
      } else {
        await addServicioMutation({ data });
        toast.success("Servicio creado correctamente");
      }
      closeModal();
      queryClient.invalidateQueries({ queryKey: ["admin-servicios-full"] });
      queryClient.invalidateQueries({ queryKey: ["admin-servicios-list"] });
    } catch (err) {
      toast.error(
        "Error al guardar el servicio: " +
          (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  return (
    <AdminLayout title="Servicios" subtitle="Gestión de plataformas y categorías">
      {isAdmin && (
        <div className="flex justify-end mb-6">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo Servicio
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {servicios.length === 0 ? (
          <div className="col-span-full py-12 text-center text-white/30 italic glass-card rounded-2xl border border-white/5">
            Aún no has creado ningún servicio.
          </div>
        ) : (
          servicios.map((s) => (
            <div
              key={s.id}
              className="glass-card rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center text-primary group-hover:scale-110 transition-transform">
                  <Tv className="w-6 h-6" />
                </div>
                {isAdmin && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEditModal(s)}
                      className="p-2 text-white/20 hover:text-white transition-colors"
                      aria-label={`Editar ${s.nombre}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id, s.nombre)}
                      className="p-2 text-white/20 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-display text-white uppercase tracking-tight mb-1">
                {s.nombre}
              </h3>
              <p className="text-xs text-white/40 mb-4 flex items-center gap-1.5 font-mono">
                <Globe className="w-3 h-3" />/{s.slug}
              </p>

              <div className="flex items-center gap-2 mb-6">
                <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <Tag className="w-3 h-3 text-primary" />
                  {s.categoria}
                </span>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/30 italic">
                  Creado el {new Date(s.created_at).toLocaleDateString()}
                </span>
                <Link
                  to="/admin/stock"
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  Ver stock <Settings2 className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo Servicio */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-ink border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-display text-white uppercase tracking-tight mb-6">
              {editingService ? "Editar Servicio" : "Nuevo Servicio"}
            </h2>
            <form
              key={editingService?.id ?? "new"}
              onSubmit={handleSaveServicio}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Nombre de la Plataforma
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  defaultValue={editingService?.nombre ?? ""}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="Ej: Netflix, HBO Max, etc."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Categoría
                </label>
                <select
                  name="categoria"
                  required
                  defaultValue={editingService?.categoria ?? "streaming"}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                >
                  <option value="streaming" className="bg-ink">
                    Streaming
                  </option>
                  <option value="musica" className="bg-ink">
                    Música
                  </option>
                  <option value="ia" className="bg-ink">
                    IA & Herramientas
                  </option>
                  <option value="juegos" className="bg-ink">
                    Juegos
                  </option>
                  <option value="redes" className="bg-ink">
                    Redes Sociales
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Icono Lucide (opcional)
                </label>
                <input
                  name="icono"
                  type="text"
                  defaultValue={editingService?.icono ?? ""}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                  placeholder="tv, play, zap, etc."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary text-white px-4 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  {editingService ? "Guardar cambios" : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
