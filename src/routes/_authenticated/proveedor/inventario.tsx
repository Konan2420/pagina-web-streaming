import { createFileRoute } from "@tanstack/react-router";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSupplierInventory,
  addSupplierInventoryBulk,
  getSupplierProducts,
  deleteSupplierInventoryItem,
} from "@/lib/supplier.functions";
import { useState } from "react";
import { Plus, Database, Search, Trash2, CheckCircle2, Clock, X } from "lucide-react";
import { useFuturisticSound } from "@/hooks/useSound";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/proveedor/inventario")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: search["add"] === true || search["add"] === "true" ? true : undefined,
  }),
  component: SupplierInventory,
});

function SupplierInventory() {
  const { playHover, playClick } = useFuturisticSound();
  const { add } = Route.useSearch();
  const [showAdd, setShowAdd] = useState(Boolean(add));
  const [searchTerm, setSearchTerm] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const queryClient = useQueryClient();
  const addBulkFn = useServerFn(addSupplierInventoryBulk);
  const deleteFn = useServerFn(deleteSupplierInventoryItem);

  const { data: myProducts = [] } = useQuery({
    queryKey: ["supplier-products"],
    queryFn: () => getSupplierProducts(),
  });

  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["supplier-inventory"],
    queryFn: () => getSupplierInventory(),
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar esta cuenta del inventario?")) return;
    setDeletingId(id);
    try {
      await deleteFn({ data: { id } });
      toast.success("Cuenta eliminada");
      queryClient.invalidateQueries({ queryKey: ["supplier-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo eliminar la cuenta.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;
    if (!selectedProductId || !bulkText.trim()) {
      toast.error("Selecciona un producto e ingresa las credenciales.");
      return;
    }

    const lines = bulkText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    if (lines.length > 100) {
      toast.error("Puedes cargar como máximo 100 cuentas por operación.");
      return;
    }

    const invalidLines: number[] = [];
    const accounts = lines.flatMap((line, index) => {
      const separator = line.indexOf(":");
      if (separator <= 0) {
        invalidLines.push(index + 1);
        return [];
      }

      const email = line.slice(0, separator).trim();
      const password = line.slice(separator + 1).trim();
      if (!email || !password || !/^\S+@\S+\.\S+$/.test(email)) {
        invalidLines.push(index + 1);
        return [];
      }

      return [{ email, password }];
    });

    if (invalidLines.length > 0) {
      toast.error(
        `Revisa el formato de las líneas: ${invalidLines.join(", ")}. Usa email:contraseña.`,
      );
      return;
    }

    const toastId = "supplier-inventory-upload";
    setIsUploading(true);
    toast.loading(`Procesando ${accounts.length} cuentas...`, { id: toastId });
    try {
      await addBulkFn({
        data: {
          product_id: selectedProductId,
          accounts,
        },
      });
      toast.success(`${accounts.length} cuentas agregadas con éxito`, { id: toastId });
      setBulkText("");
      setShowAdd(false);
      queryClient.invalidateQueries({ queryKey: ["supplier-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al subir inventario.";
      toast.error(message, { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const filtered = inventory.filter(
    (item) =>
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <SupplierLayout title="Mi Inventario" subtitle="Carga y gestiona las cuentas que vendes.">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por email o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <button
          onClick={() => {
            playClick();
            setShowAdd(true);
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" /> Nueva Carga Masiva
        </button>
      </div>

      <div className="bg-ink/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-white/40 border-b border-white/5 bg-white/[0.02] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Producto</th>
                <th className="px-8 py-5">Email / Usuario</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Fecha Carga</th>
                <th className="px-8 py-5 text-right opacity-0">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-8 py-4 h-16 bg-white/[0.01]" />
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-white/20 italic">
                    No tienes inventario cargado.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Database className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-white">
                          {item.products?.name || "Desconocido"}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-white/60 font-mono text-xs">{item.email}</td>
                    <td className="px-8 py-5">
                      {item.status === "available" ? (
                        <span className="flex items-center gap-1.5 text-green-400 font-bold text-[10px] uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3" /> Disponible
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-white/30 font-bold text-[10px] uppercase tracking-wider">
                          <Clock className="w-3 h-3" /> Vendida
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-5 text-white/30 text-xs">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-8 py-5 text-right">
                      {item.status === "available" && (
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDelete(item.id)}
                          onMouseEnter={playHover}
                          className="p-2 text-white/20 hover:text-red-400 transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Carga Masiva */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto py-10">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full max-w-lg bg-ink border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl my-auto">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-display text-white uppercase tracking-tight">
                  Carga Masiva
                </h2>
                <p className="text-white/40 text-sm mt-1">Sube múltiples cuentas a la vez.</p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkAdd} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Producto Asociado
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
                >
                  <option value="">Selecciona un producto...</option>
                  {myProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-white/30 mt-1 italic leading-relaxed">
                  * Selecciona el producto al que pertenecen estas cuentas.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">
                  Credenciales (email:password)
                </label>
                <textarea
                  rows={8}
                  placeholder="usuario1@mail.com:pass123&#10;usuario2@mail.com:pass456"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all placeholder:text-white/10"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
                >
                  {isUploading ? "Subiendo inventario..." : "Subir Inventario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </SupplierLayout>
  );
}
