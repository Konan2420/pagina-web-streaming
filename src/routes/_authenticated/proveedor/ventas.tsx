import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { getProviderSales } from "@/lib/supplier.functions";

export const Route = createFileRoute("/_authenticated/proveedor/ventas")({ component: ProviderSales });

function ProviderSales() {
  const { data: sales = [], isLoading } = useQuery({ queryKey: ["provider-sales"], queryFn: () => getProviderSales() });
  const revenue = sales.reduce((total, sale) => total + Number(sale.products?.price ?? 0), 0);
  return <SupplierLayout title="Ventas" subtitle="Consulta las cuentas entregadas desde tu propio inventario.">
    <div className="mb-6 grid gap-4 sm:grid-cols-2"><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><p className="text-[10px] font-black uppercase tracking-widest text-white/40">Ventas entregadas</p><p className="mt-2 text-3xl font-black text-white">{sales.length}</p></div><div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5"><p className="text-[10px] font-black uppercase tracking-widest text-white/40">Valor vendido</p><p className="mt-2 text-3xl font-black text-primary">S/ {revenue.toFixed(2)}</p></div></div>
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025]"><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-white/8 text-[10px] font-black uppercase tracking-widest text-white/40"><tr><th className="px-5 py-4">Producto</th><th className="px-5 py-4">Precio</th><th className="px-5 py-4">Fecha de entrega</th></tr></thead><tbody className="divide-y divide-white/6">{isLoading ? Array.from({ length: 3 }, (_, i) => <tr key={i} className="animate-pulse"><td colSpan={3} className="h-16" /></tr>) : sales.length === 0 ? <tr><td colSpan={3} className="px-5 py-16 text-center text-white/35">Aún no hay ventas entregadas.</td></tr> : sales.map((sale) => <tr key={sale.id} className="hover:bg-white/[0.035]"><td className="px-5 py-4 font-semibold text-white">{sale.products?.name || "Producto"}</td><td className="px-5 py-4 font-bold text-primary">S/ {Number(sale.products?.price ?? 0).toFixed(2)}</td><td className="px-5 py-4 text-white/45">{sale.assigned_at ? new Date(sale.assigned_at).toLocaleDateString("es-PE") : "—"}</td></tr>)}</tbody></table></div></div>
  </SupplierLayout>;
}
