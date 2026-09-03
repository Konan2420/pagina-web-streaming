import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Tv, Plus, Tag, Globe, Settings2, Trash2, Edit2, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { getServicios, addServicio, deleteServicio, updateServicio } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import {
  platformIcons,
  PlatformIconMark,
  type PlatformIconDefinition,
} from "@/lib/platformIcons";

const serviciosQueryOptions = queryOptions({
  queryKey: ["admin-servicios-full"],
  queryFn: () => getServicios(),
});

function toServiceSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function BuiltInIconCard({
  icon,
  service,
  isAdmin,
  onEdit,
}: {
  icon: PlatformIconDefinition;
  service?: Tables<"servicios_streaming">;
  isAdmin: boolean;
  onEdit: () => void;
}) {
  const hasCustomImage = Boolean(service?.icon_url);

  return (
    <div className="glass-card group rounded-2xl border border-white/5 p-5 transition-all hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        {hasCustomImage ? (
          <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/25 bg-primary/10">
            <img src={service!.icon_url!} alt="" className="h-full w-full object-contain p-2" />
          </div>
        ) : (
          <PlatformIconMark iconId={icon.id} className="h-12 w-12 shrink-0 border border-white/15" iconClassName="h-6 w-6" />
        )}
        {isAdmin && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-2 text-[10px] font-bold text-white/65 transition hover:border-primary/50 hover:bg-primary/10 hover:text-white"
          >
            <Edit2 className="h-3.5 w-3.5" aria-hidden="true" />
            Cambiar
          </button>
        )}
      </div>
      <h3 className="mt-4 truncate text-base font-bold text-white">{icon.name}</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-bold uppercase tracking-wide text-white/55">
          {icon.categoryId}
        </span>
        <span
          className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${
            hasCustomImage
              ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
              : "border-primary/25 bg-primary/10 text-primary"
          }`}
        >
          {hasCustomImage ? "Imagen personalizada" : "Predefinido"}
        </span>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/admin/servicios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(serviciosQueryOptions),
  component: ServicesManagement,
});

function ServicesManagement() {
  const { data: servicios } = useSuspenseQuery(serviciosQueryOptions);
  const { isAdmin } = Route.useRouteContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Tables<"servicios_streaming"> | null>(null);
  const [editingPreset, setEditingPreset] = useState<PlatformIconDefinition | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);

  const queryClient = useQueryClient();
  const addServicioMutation = useServerFn(addServicio);
  const updateServicioMutation = useServerFn(updateServicio);
  const deleteServicioMutation = useServerFn(deleteServicio);

  const openCreateModal = () => {
    setEditingService(null);
    setEditingPreset(null);
    setIconPreview(null);
    setIsModalOpen(true);
  };

  const openEditModal = (service: Tables<"servicios_streaming">) => {
    setEditingService(service);
    setEditingPreset(null);
    setIconPreview(service.icon_url);
    setIsModalOpen(true);
  };

  const openPresetEditModal = (
    preset: PlatformIconDefinition,
    service: Tables<"servicios_streaming"> | undefined,
  ) => {
    setEditingService(service ?? null);
    setEditingPreset(preset);
    setIconPreview(service?.icon_url ?? null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingService(null);
    setEditingPreset(null);
    setIconPreview(null);
  };

  const handleIconUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Usa una imagen PNG, JPG o WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El ícono no puede superar 2 MB.');
      event.target.value = '';
      return;
    }

    setIsUploadingIcon(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error('Tu sesión de administrador no es válida.');

      const extension = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
      const path = `${authData.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('platform-icons')
        .upload(path, file, { contentType: file.type, cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage.from('platform-icons').getPublicUrl(path);
      if (!publicUrlData.publicUrl) throw new Error('No se pudo generar la URL del ícono.');

      setIconPreview(publicUrlData.publicUrl);
      toast.success('Ícono cargado. Guarda la plataforma para publicarlo.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(`No se pudo cargar el ícono: ${message}`);
    } finally {
      setIsUploadingIcon(false);
      event.target.value = '';
    }
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
      queryClient.invalidateQueries({ queryKey: ["public-managed-platforms"] });
    } catch (err) {
      toast.error(
        "Error al eliminar: " + (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  const handleSaveServicio = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const preset = editingPreset;
    const data = {
      nombre: preset?.name ?? (formData.get("nombre") as string),
      slug: toServiceSlug(preset?.name ?? (formData.get("nombre") as string)),
      categoria: preset?.categoryId ?? (formData.get("categoria") as string),
      icono: (formData.get("icono") as string) || undefined,
      icon_url: iconPreview,
      display_order: Number(formData.get("display_order") || 0),
      is_visible: preset ? true : formData.get("is_visible") === "on",
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
      queryClient.invalidateQueries({ queryKey: ["public-managed-platforms"] });
    } catch (err) {
      toast.error(
        "Error al guardar el servicio: " +
          (err instanceof Error ? err.message : "Error desconocido"),
      );
    }
  };

  const builtInServicesBySlug = new Map(servicios.map((service) => [service.slug, service]));
  const builtInSlugs = new Set(platformIcons.map((icon) => toServiceSlug(icon.name)));
  const customServicios = servicios.filter((service) => !builtInSlugs.has(service.slug));

  return (
    <AdminLayout
      title="Íconos y plataformas"
      subtitle="Crea un ícono una sola vez y vincula sus productos desde el catálogo"
    >
      {isAdmin && (
        <div className="flex justify-end mb-6">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nuevo ícono
          </button>
        </div>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white">Íconos predefinidos</h2>
            <p className="mt-1 text-xs text-white/45">
              Cambia su imagen sin alterar el nombre, categoría ni los productos asociados.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold text-white/50">
            {platformIcons.length} disponibles
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {platformIcons.map((icon) => (
            <BuiltInIconCard
              key={icon.id}
              icon={icon}
              service={builtInServicesBySlug.get(toServiceSlug(icon.name))}
              isAdmin={isAdmin}
              onEdit={() => openPresetEditModal(icon, builtInServicesBySlug.get(toServiceSlug(icon.name)))}
            />
          ))}
        </div>
      </section>

      {customServicios.length > 0 && (
        <h2 className="mb-4 mt-10 text-lg font-bold text-white">Plataformas personalizadas</h2>
      )}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {customServicios.length === 0 ? null : (
          customServicios.map((s) => (
            <div
              key={s.id}
              className="glass-card rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center overflow-hidden text-primary group-hover:scale-110 transition-transform">
                  {s.icon_url ? (
                    <img src={s.icon_url} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <span className="text-sm font-black uppercase">{s.nombre.slice(0, 2)}</span>
                  )}
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
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wider ${
                    s.is_visible
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/5 text-white/35"
                  }`}
                >
                  {s.is_visible ? "Visible" : "Oculto"}
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
                  Asignar productos <Settings2 className="w-3 h-3" />
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
          <div className="relative w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-ink p-5 shadow-2xl sm:p-6">
            <h2 className="text-2xl font-display text-white uppercase tracking-tight mb-6">
              {editingPreset
                ? `Cambiar imagen · ${editingPreset.name}`
                : editingService
                  ? "Editar ícono"
                  : "Nuevo ícono"}
            </h2>
            <form
              key={editingService?.id ?? editingPreset?.id ?? "new"}
              onSubmit={handleSaveServicio}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Nombre de la plataforma
                </label>
                <input
                  name="nombre"
                  type="text"
                  required
                  readOnly={Boolean(editingPreset)}
                  defaultValue={editingPreset?.name ?? editingService?.nombre ?? ""}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all read-only:cursor-default read-only:text-white/60"
                  placeholder="Ej: Netflix, HBO Max, etc."
                />
                {editingPreset && (
                  <p className="mt-1.5 text-[10px] text-white/35">
                    El nombre se mantiene para que el ícono continúe vinculado a sus productos.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Categoría
                </label>
                <select
                  name="categoria"
                  required
                  disabled={Boolean(editingPreset)}
                  defaultValue={editingPreset?.categoryId ?? editingService?.categoria ?? "streaming"}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:text-white/50"
                >
                  <option value="streaming" className="bg-ink">
                    Streaming
                  </option>
                  <option value="music" className="bg-ink">
                    Música
                  </option>
                  <option value="ia" className="bg-ink">
                    IA & Herramientas
                  </option>
                  <option value="videojuegos" className="bg-ink">
                    Juegos
                  </option>
                  <option value="apps" className="bg-ink">
                    Aplicaciones
                  </option>
                  <option value="licencias" className="bg-ink">
                    Licencias
                  </option>
                  <option value="recargas" className="bg-ink">
                    Recargas
                  </option>
                  <option value="giftcards" className="bg-ink">
                    Giftcards
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Imagen del ícono
                </label>
                <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.025] p-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-primary/20 bg-primary/10">
                    {iconPreview ? (
                      <img src={iconPreview} alt="Vista previa del ícono" className="h-full w-full object-contain p-2" />
                    ) : editingPreset ? (
                      <PlatformIconMark iconId={editingPreset.id} className="h-full w-full rounded-none border-0 shadow-none" iconClassName="h-6 w-6" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-primary/60" aria-hidden="true" />
                    )}
                  </div>
                  <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.05] px-3 text-xs font-bold text-white transition hover:border-primary/50 hover:bg-primary/10">
                    {isUploadingIcon ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {isUploadingIcon ? 'Cargando imagen…' : iconPreview ? 'Cambiar imagen' : 'Subir imagen'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleIconUpload}
                      disabled={isUploadingIcon}
                      className="sr-only"
                    />
                  </label>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-white/35">
                  PNG, JPG o WebP · máximo 2 MB. Se ajusta automáticamente dentro del círculo del ícono.
                  {editingPreset && " Al guardar, sustituirá el ícono predefinido en la tienda."}
                </p>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                    Orden de aparición
                  </label>
                  <input
                    name="display_order"
                    type="number"
                    min="0"
                    defaultValue={editingService?.display_order ?? 0}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <label className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/75">
                  <input
                    name="is_visible"
                    type="checkbox"
                    disabled={Boolean(editingPreset)}
                    defaultChecked={editingPreset ? true : editingService ? editingService.is_visible : true}
                    className="h-4 w-4 accent-[var(--color-primary,#3b82f6)]"
                  />
                  Visible
                </label>
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
                  {editingPreset ? "Guardar imagen" : editingService ? "Guardar cambios" : "Crear Servicio"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
