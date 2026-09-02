import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  AlertCircle,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  Loader2,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import {
  getAdminProducts,
  getServicios,
  upsertProduct,
  deleteProduct,
} from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { IconPicker } from "@/components/admin/IconPicker";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  getCatalogPricingSettings,
  saveCatalogPricingSettings,
} from "@/lib/catalog-detail.functions";

const productsQueryOptions = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => getAdminProducts(),
});

const servicesQueryOptions = queryOptions({
  queryKey: ["admin-servicios-list"],
  queryFn: () => getServicios(),
});

export const Route = createFileRoute("/_authenticated/admin/productos")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions),
      context.queryClient.ensureQueryData(servicesQueryOptions),
    ]),
  component: ProductsManagement,
});

function ProductsManagement() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const { data: services } = useSuspenseQuery(servicesQueryOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Tables<"products"> | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);
  const [showPricingSettings, setShowPricingSettings] = useState(false);
  const [markupPercent, setMarkupPercent] = useState("20");
  const [penPerUsd, setPenPerUsd] = useState("3.70");
  const [savingPricing, setSavingPricing] = useState(false);

  const queryClient = useQueryClient();
  const upsertMutation = useServerFn(upsertProduct);
  const deleteMutation = useServerFn(deleteProduct);
  const getPricingSettings = useServerFn(getCatalogPricingSettings);
  const savePricingSettings = useServerFn(saveCatalogPricingSettings);
  const pricingSettingsQuery = useQuery({
    queryKey: ["catalog-pricing-settings"],
    queryFn: () => getPricingSettings({}),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!pricingSettingsQuery.data) return;
    setMarkupPercent(String(pricingSettingsQuery.data.default_markup_percent));
    setPenPerUsd(String(pricingSettingsQuery.data.pen_per_usd));
  }, [pricingSettingsQuery.data]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("La imagen excede los 5MB");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no soportado (use JPG, PNG o WebP)");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedUrlError } = await supabase.storage
        .from("product-images")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year expiry

      if (signedUrlError || !signedData)
        throw signedUrlError || new Error("Failed to get signed URL");

      setImagePreview(signedData.signedUrl);
    } catch (err) {
      toast.error("Error al subir imagen: " + (err instanceof Error ? err.message : "Desconocido"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpsert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      id: editingProduct?.id,
      name: formData.get("name") as string,
      price: Number(formData.get("price")),
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      service_id: (formData.get("service_id") as string) || null,
      icon_id: selectedIconId,
      image_url: imagePreview || (formData.get("image_url") as string),
      is_active: formData.get("is_active") === "on",
      is_catalog_available: formData.get("is_catalog_available") === "on",
      is_renewable: formData.get("is_renewable") === "on",
      duration_days: Number(formData.get("duration_days")) || 30,
      descripcion_larga: formData.get("descripcion_larga") as string,
    };

    if (!data.name || data.price < 0 || data.duration_days < 1) {
      toast.error("Nombre, precio y duración válida son obligatorios");
      return;
    }

    try {
      await upsertMutation({ data });
      toast.success(data.id ? "Producto actualizado" : "Producto creado");
      setIsModalOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      setSelectedIconId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
    }
  };

  const openModal = (product: Tables<"products"> | null = null) => {
    setEditingProduct(product);
    setImagePreview(product?.image_url || null);
    setSelectedIconId(product?.icon_id || null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este producto?")) return;
    setIsDeletingId(id);
    try {
      await deleteMutation({ data: { id } });
      toast.success("Producto eliminado");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error("Error al eliminar");
    } finally {
      setIsDeletingId(null);
    }
  };

  const handleSavePricingSettings = async () => {
    const nextMarkup = Number(markupPercent);
    const nextPenPerUsd = Number(penPerUsd);
    if (!Number.isFinite(nextMarkup) || nextMarkup < 0 || !Number.isFinite(nextPenPerUsd) || nextPenPerUsd <= 0) {
      toast.error("Ingresa valores válidos para margen y tipo de cambio.");
      return;
    }
    setSavingPricing(true);
    try {
      await savePricingSettings({
        data: { defaultMarkupPercent: nextMarkup, penPerUsd: nextPenPerUsd },
      });
      await queryClient.invalidateQueries({ queryKey: ["catalog-pricing-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["catalog-purchase-context"] });
      toast.success("Configuración de precio sugerido actualizada.");
      setShowPricingSettings(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar la configuración.");
    } finally {
      setSavingPricing(false);
    }
  };

  const serviceNames = new Map(services.map((service) => [service.id, service.nombre]));

  return (
    <AdminLayout title="Productos" subtitle="Gestiona el catálogo de productos disponibles">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHelper(!showHelper)}
            className="p-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            title="Ayuda de edición"
          >
            <Info className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowPricingSettings(true)}
            className="p-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all"
            title="Configurar margen sugerido"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>

          <button
            onClick={() => openModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>
        </div>
      </div>

      {showHelper && (
        <div className="glass-card rounded-2xl border border-primary/20 p-5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <ImageIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Gestión de Contenido en Tiempo Real</h4>
              <p className="text-sm text-white/60 mt-1 leading-relaxed">
                Cada producto que edites o crees aquí se reflejará automáticamente en la{" "}
                <strong>Landing Page</strong> y el <strong>Panel de Usuario</strong>. Puedes cambiar
                precios, imágenes y categorías para organizar tu tienda dinámicamente.
              </p>
            </div>
            <button
              onClick={() => setShowHelper(false)}
              className="ml-auto p-1 hover:bg-white/5 rounded-lg text-white/40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showPricingSettings && (
        <div className="mb-8 rounded-2xl border border-sky-300/20 bg-sky-300/[0.04] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Precio sugerido de reventa</h3>
              <p className="mt-1 text-sm text-white/60">
                La PDP usa este margen sobre el costo privado solo para sugerir un precio a roles comerciales.
              </p>
            </div>
            <button onClick={() => setShowPricingSettings(false)} className="text-white/45 hover:text-white" aria-label="Cerrar configuración de precios"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-white/80">
              Margen estándar (%)
              <input value={markupPercent} onChange={(event) => setMarkupPercent(event.target.value)} type="number" min="0" step="0.1" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-background px-3 text-white outline-none focus:border-sky-300/50" />
            </label>
            <label className="text-sm font-medium text-white/80">
              Tipo de cambio PEN por USD
              <input value={penPerUsd} onChange={(event) => setPenPerUsd(event.target.value)} type="number" min="0.01" step="0.0001" className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-background px-3 text-white outline-none focus:border-sky-300/50" />
            </label>
          </div>
          <div className="mt-5 flex justify-end">
            <button onClick={() => void handleSavePricingSettings()} disabled={savingPricing || pricingSettingsQuery.isLoading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
              {savingPricing && <Loader2 className="h-4 w-4 animate-spin" />} Guardar configuración
            </button>
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-white/40 border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/30 italic">
                    No hay productos aún.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-white/20" />
                          )}
                        </div>
                        <span className="font-semibold text-white">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/50">
                      <span className="block">{product.category || "General"}</span>
                      <span className="mt-1 block text-[10px] text-white/30">
                        {product.service_id
                          ? serviceNames.get(product.service_id) || "Ícono eliminado"
                          : "Sin ícono asociado"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-primary">
                      S/ {product.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={async () => {
                          try {
                            await upsertMutation({
                              data: { ...product, is_active: !product.is_active },
                            });
                            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
                            toast.success(
                              `Producto ${!product.is_active ? "activado" : "desactivado"}`,
                            );
                          } catch (err) {
                            toast.error("Error al cambiar estado");
                          }
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                          product.is_active
                            ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                            : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                        }`}
                      >
                        {product.is_active ? "Activo" : "Inactivo"}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(product)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          disabled={isDeletingId === product.id}
                          onClick={() => handleDelete(product.id)}
                          className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-card flex w-full max-w-lg max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-white/10 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex shrink-0 items-center justify-between border-b border-white/5 p-5 sm:p-6">
              <h3 className="text-xl font-display text-white uppercase tracking-tight">
                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleUpsert}
              className="min-h-0 flex-1 overflow-y-auto space-y-4 p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Nombre
                  </label>
                  <input
                    name="name"
                    defaultValue={editingProduct?.name}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Precio (S/)
                  </label>
                  <input
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={editingProduct?.price}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Duración (días)
                  </label>
                  <input
                    name="duration_days"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={editingProduct?.duration_days ?? 30}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <p className="text-[10px] leading-relaxed text-white/35">
                    Ej.: 30, 90, 180 o 365 días.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Categoría
                  </label>
                  <select
                    name="category"
                    defaultValue={editingProduct?.category || "Streaming"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="streaming" className="bg-[#121212]">
                      Streaming
                    </option>
                    <option value="combos" className="bg-[#121212]">
                      Combos Premium
                    </option>
                    <option value="ia" className="bg-[#121212]">
                      IA & Herramientas
                    </option>
                    <option value="apps" className="bg-[#121212]">
                      Aplicaciones
                    </option>
                    <option value="licencias" className="bg-[#121212]">
                      Licencias
                    </option>
                    <option value="cursos" className="bg-[#121212]">
                      Cursos
                    </option>
                    <option value="recargas" className="bg-[#121212]">
                      Recargas
                    </option>
                    <option value="videojuegos" className="bg-[#121212]">
                      Videojuegos
                    </option>
                    <option value="giftcards" className="bg-[#121212]">
                      Tarjetas de Regalo
                    </option>
                    <option value="invitaciones" className="bg-[#121212]">
                      Invitaciones
                    </option>
                    <option value="redes" className="bg-[#121212]">
                      Redes Sociales
                    </option>
                    <option value="music" className="bg-[#121212]">
                      Música
                    </option>
                    <option value="adult" className="bg-[#121212]">
                      Adultos
                    </option>
                    <option value="iptv" className="bg-[#121212]">
                      IPTV
                    </option>
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Ícono / Plataforma de la tienda
                  </label>
                  <select
                    name="service_id"
                    defaultValue={editingProduct?.service_id || ""}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="" className="bg-[#121212]">
                      Sin asociar a un ícono
                    </option>
                    {services.map((service) => (
                      <option key={service.id} value={service.id} className="bg-[#121212]">
                        {service.nombre} · {service.categoria}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] leading-relaxed text-white/35">
                    Los productos asociados aparecerán al pulsar este ícono en la tienda.
                  </p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Ícono e imagen del producto
                  </label>
                  <IconPicker value={selectedIconId} onSelect={setSelectedIconId} />
                  <p className="pt-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
                    Imagen de portada (opcional)
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-white/10" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <label className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-lg border border-white/10 transition-all cursor-pointer">
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                          {imagePreview ? "Cambiar Imagen" : "Subir Imagen"}
                        </label>
                      </div>
                      <input
                        name="image_url"
                        placeholder="O pega una URL"
                        value={imagePreview || ""}
                        onChange={(e) => setImagePreview(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Descripción corta (Card)
                  </label>
                  <input
                    name="description"
                    defaultValue={editingProduct?.description ?? ""}
                    placeholder="Ej: NETFLIX PREMIUM — PERFIL X 30 DÍAS"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">
                    Descripción Larga (Detalles)
                  </label>
                  <textarea
                    name="descripcion_larga"
                    defaultValue={editingProduct?.descripcion_larga ?? ""}
                    rows={3}
                    placeholder="Instrucciones detalladas del producto..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-2 sm:col-span-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_catalog_available"
                      name="is_catalog_available"
                      defaultChecked={
                        editingProduct ? editingProduct.is_catalog_available : true
                      }
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="is_catalog_available" className="text-sm text-white">
                      Disponible para compra
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      defaultChecked={editingProduct ? Boolean(editingProduct.is_active) : true}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="is_active" className="text-sm text-white">
                      Producto Activo
                    </label>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_renewable"
                      name="is_renewable"
                      defaultChecked={editingProduct ? editingProduct.is_renewable : true}
                      className="w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                    />
                    <label htmlFor="is_renewable" className="text-sm text-white">
                      Cuenta renovable
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/5 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                >
                  {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
