import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
} from "lucide-react";
import { getAdminProducts, upsertProduct, deleteProduct } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const productsQueryOptions = queryOptions({
  queryKey: ["admin-products"],
  queryFn: () => getAdminProducts(),
});

export const Route = createFileRoute("/_authenticated/admin/productos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQueryOptions),
  component: ProductsManagement,
});

function ProductsManagement() {
  const { data: products } = useSuspenseQuery(productsQueryOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Tables<"products"> | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showHelper, setShowHelper] = useState(false);

  const queryClient = useQueryClient();
  const upsertMutation = useServerFn(upsertProduct);
  const deleteMutation = useServerFn(deleteProduct);

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
      console.error("Upload error:", err);
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
      image_url: imagePreview || (formData.get("image_url") as string),
      is_active: formData.get("is_active") === "on",
      descripcion_larga: formData.get("descripcion_larga") as string,
    };

    if (!data.name || data.price < 0) {
      toast.error("Nombre y precio válido son obligatorios");
      return;
    }

    try {
      await upsertMutation({ data });
      toast.success(data.id ? "Producto actualizado" : "Producto creado");
      setIsModalOpen(false);
      setEditingProduct(null);
      setImagePreview(null);
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
    }
  };

  const openModal = (product: Tables<"products"> | null = null) => {
    setEditingProduct(product);
    setImagePreview(product?.image_url || null);
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
                      {product.category || "General"}
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
          <div className="glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
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

            <form onSubmit={handleUpsert} className="p-6 space-y-4">
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
                    Imagen
                  </label>
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

                <div className="flex items-center gap-3 py-2">
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
