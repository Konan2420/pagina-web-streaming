import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { addProviderInventoryBulk, deleteProviderInventoryItem, getProviderInventory, getProviderProducts } from "@/lib/supplier.functions";

export const Route = createFileRoute("/_authenticated/proveedor/inventario")({ component: ProviderInventory });

function ProviderInventory() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [saving, setSaving] = useState(false);
  const addInventory = useServerFn(addProviderInventoryBulk);
  const deleteInventory = useServerFn(deleteProviderInventoryItem);
  const { data: products = [] } = useQuery({ queryKey: ["provider-products"], queryFn: () => getProviderProducts() });
  const { data: inventory = [], isLoading } = useQuery({ queryKey: ["provider-inventory"], queryFn: () => getProviderInventory() });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const accounts = bulkText.split("\n").map((line) => line.trim()).filter(Boolean).map((line) => {
      const divider = line.indexOf(":");
      return { email: line.slice(0, divider).trim(), password: line.slice(divider + 1).trim() };
    });
    if (!productId || !accounts.length || accounts.some((item) => !item.email || !item.password || !/^\S+@\S+\.\S+$/.test(item.email))) {
      toast.error("Selecciona un producto y usa una cuenta por línea: email:contraseña.");
      return;
    }
    setSaving(true);
    try {
      const result = await addInventory({ data: { product_id: productId, accounts } });
      toast.success(`${result.inserted} cuentas cargadas correctamente.`);
      setBulkText(""); setOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["provider-inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] });
    } catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo cargar el inventario."); }
    finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!window.confirm("¿Quitar esta cuenta disponible del inventario?")) return;
    try { await deleteInventory({ data: { id } }); toast.success("Cuenta eliminada."); await queryClient.invalidateQueries({ queryKey: ["provider-inventory"] }); await queryClient.invalidateQueries({ queryKey: ["provider-dashboard"] }); }
    catch (error) { toast.error(error instanceof Error ? error.message : "No se pudo eliminar."); }
  };

  return <SupplierLayout title="Inventario" subtitle="Carga credenciales para productos propios. Las contraseñas nunca se muestran en este listado.">
    <div className="mb-6 flex justify-end"><button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white"><Plus className="h-4 w-4" /> Carga masiva</button></div>
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]"><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-white/8 text-[10px] font-black uppercase tracking-widest text-white/40"><tr><th className="px-5 py-4">Producto</th><th className="px-5 py-4">Cuenta</th><th className="px-5 py-4">Estado</th><th className="px-5 py-4">Carga</th><th className="px-5 py-4" /></tr></thead><tbody className="divide-y divide-white/6">{isLoading ? Array.from({ length: 4 }, (_, i) => <tr key={i} className="animate-pulse"><td colSpan={5} className="h-16" /></tr>) : inventory.length === 0 ? <tr><td colSpan={5} className="px-5 py-16 text-center text-white/35">No tienes inventario cargado.</td></tr> : inventory.map((item) => <tr key={item.id} className="hover:bg-white/[0.035]"><td className="px-5 py-4 font-semibold text-white">{item.products?.name || "Producto"}</td><td className="px-5 py-4 font-mono text-xs text-white/65">{item.email}</td><td className="px-5 py-4"><span className={item.status === "available" ? "text-emerald-300" : "text-white/40"}>{item.status === "available" ? "Disponible" : "Entregada"}</span></td><td className="px-5 py-4 text-xs text-white/40">{item.created_at ? new Date(item.created_at).toLocaleDateString("es-PE") : "—"}</td><td className="px-5 py-4 text-right">{item.status === "available" && <button onClick={() => void remove(item.id)} className="rounded-lg p-2 text-white/45 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>}</td></tr>)}</tbody></table></div></div>
    {open && <div className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl"><h2 className="font-display text-xl uppercase text-white">Carga masiva</h2><p className="mt-1 text-xs text-white/45">Una cuenta por línea con el formato email:contraseña.</p><select value={productId} onChange={(event) => setProductId(event.target.value)} className="mt-5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white"><option value="">Selecciona un producto</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><textarea value={bulkText} onChange={(event) => setBulkText(event.target.value)} rows={8} placeholder="usuario@email.com:contraseña" className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 p-3 font-mono text-sm text-white" /><div className="mt-4 flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70">Cancelar</button><button disabled={saving} className="rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase text-white disabled:opacity-60">{saving ? "Cargando…" : "Guardar"}</button></div></form></div>}
  </SupplierLayout>;
}
