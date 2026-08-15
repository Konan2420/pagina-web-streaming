import { createFileRoute } from "@tanstack/react-router";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { useQuery } from "@tanstack/react-query";
import { getSupplierSales, getSupplierDashboardStats } from "@/lib/supplier.functions";
import { useMemo, useState } from "react";
import { Search, Database, Calendar, DollarSign, Package } from "lucide-react";
import { useFuturisticSound } from "@/hooks/useSound";

export const Route = createFileRoute("/_authenticated/proveedor/ventas")({
  component: SupplierSales,
});

function SupplierSales() {
  const { playHover } = useFuturisticSound();
  const [term, setTerm] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data: allSales = [], isLoading } = useQuery({
    queryKey: ["supplier-sales"],
    queryFn: () => getSupplierSales(),
  });

  const { data: stats } = useQuery({
    queryKey: ["supplier-stats"],
    queryFn: () => getSupplierDashboardStats(),
  });

  const commissionRate = Number(stats?.commissionRate ?? 70);

  const sales = useMemo(() => {
    return allSales.filter((s) => {
      const name = s.products?.name?.toLowerCase() || "";
      if (
        term &&
        !name.includes(term.toLowerCase()) &&
        !(s.email || "").toLowerCase().includes(term.toLowerCase())
      )
        return false;
      const d = s.assigned_at || s.created_at;
      if (from && d && new Date(d) < new Date(from)) return false;
      if (to && d && new Date(d) > new Date(`${to}T23:59:59`)) return false;
      return true;
    });
  }, [allSales, term, from, to]);

  const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.products?.price || 0), 0);
  const totalEarnings = (totalRevenue * commissionRate) / 100;

  return (
    <SupplierLayout
      title="Mis Ventas"
      subtitle="Historial de cuentas entregadas y ganancias acumuladas."
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
            Ventas Totales
          </p>
          <div className="flex items-center gap-3">
            <Package className="w-5 h-5 text-primary" />
            <span className="text-3xl font-display text-white">{sales.length}</span>
          </div>
        </div>
        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
            Ingresos Estimados
          </p>
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-green-400" />
            <span className="text-3xl font-display text-white">S/ {totalRevenue.toFixed(2)}</span>
          </div>
        </div>
        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">
            Mis Ganancias ({commissionRate}%)
          </p>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span className="text-3xl font-display text-primary">
              S/ {totalEarnings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por producto o cuenta..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      <div className="bg-ink/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] text-white/40 border-b border-white/5 bg-white/[0.02] font-black uppercase tracking-widest">
                <th className="px-8 py-5">Producto</th>
                <th className="px-8 py-5">Credenciales</th>
                <th className="px-8 py-5">Precio</th>
                <th className="px-8 py-5">Tu Ganancia</th>
                <th className="px-8 py-5">Fecha Entrega</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="h-16 px-8 py-4 bg-white/[0.01]" />
                  </tr>
                ))
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-white/20 italic">
                    No tienes ventas registradas aún.
                  </td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr
                    key={sale.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                    onMouseEnter={playHover}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Database className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-bold text-white">{sale.products?.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-white/60 font-mono text-xs">{sale.email}</td>
                    <td className="px-8 py-5 text-white font-bold">
                      S/ {Number(sale.products?.price || 0).toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-green-400 font-bold">
                      S/ {((Number(sale.products?.price || 0) * commissionRate) / 100).toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-white/30 text-xs">
                      {sale.assigned_at || sale.created_at
                        ? new Date(sale.assigned_at ?? sale.created_at ?? "").toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SupplierLayout>
  );
}
