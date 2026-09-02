import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Database,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  Package,
  ArrowRight,
  MoreVertical,
  X,
  Check,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  component: StockManagement,
});

function StockManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [bulkText, setBulkText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const queryClient = useQueryClient();

  // Fetch all products (platforms)
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, image_url, category")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch inventory for counts
  const { data: inventory = [], isLoading } = useQuery({
    queryKey: ["admin-stock-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_inventory")
        .select("id, product_id, status, email, created_at, payment_verified");
      if (error) throw error;
      return data;
    },
  });

  // Calculate stock per product
  const productStock = useMemo(() => {
    const counts: Record<string, { available: number; assigned: number }> = {};

    inventory.forEach((item) => {
      if (!counts[item.product_id]) {
        counts[item.product_id] = { available: 0, assigned: 0 };
      }
      if (item.status === "available" || item.status === "disponible") {
        counts[item.product_id].available++;
      } else if (item.status === "assigned" || item.status === "vendida") {
        counts[item.product_id].assigned++;
      }
    });

    return products
      .map((p) => ({
        ...p,
        available: counts[p.id]?.available || 0,
        assigned: counts[p.id]?.assigned || 0,
      }))
      .filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
  }, [products, inventory, searchTerm]);

  const handleBulkAdd = async () => {
    if (!selectedProduct) {
      toast.error("Selecciona una plataforma");
      return;
    }
    if (!bulkText.trim()) {
      toast.error("Ingresa las credenciales");
      return;
    }

    setIsSubmitting(true);
    try {
      const lines = bulkText.split("\n").filter((l) => l.trim().length > 0);
      const inserts = lines.map((line) => {
        // Support email:password or email,password formats
        let email = "";
        let password = "";

        if (line.includes(":")) {
          const parts = line.split(":");
          email = parts[0].trim();
          password = parts.slice(1).join(":").trim();
        } else if (line.includes(",")) {
          const parts = line.split(",");
          email = parts[0].trim();
          password = parts.slice(1).join(",").trim();
        } else {
          // If no separator, use the whole line as email and placeholder password
          email = line.trim();
          password = "TEMPPASSWORD";
        }

        return {
          product_id: selectedProduct,
          email,
          password,
          status: "disponible", // Matching the system's preferred status
        };
      });

      const { error } = await supabase.from("account_inventory").insert(inserts);
      if (error) throw error;

      toast.success(`${inserts.length} cuentas añadidas correctamente`);
      setIsAddOpen(false);
      setBulkText("");
      setSelectedProduct("");
      queryClient.invalidateQueries({ queryKey: ["admin-stock-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
      queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
    } catch (error) {
      toast.error(
        "Error al añadir stock: " + (error instanceof Error ? error.message : "Desconocido"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch availability status
  useEffect(() => {
    const getStatus = async () => {
      const { data, error } = await supabase
        .from("admin_status")
        .select("is_active")
        .limit(1)
        .maybeSingle();

      if (data) setIsAdminActive(data.is_active);
    };
    getStatus();
  }, []);

  const toggleAdminStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const { data: statusData } = await supabase
        .from("admin_status")
        .select("id")
        .limit(1)
        .single();
      const statusId = statusData?.id;

      if (!statusId) throw new Error("No se encontró el registro de estado");

      const { error } = await supabase
        .from("admin_status")
        .update({ is_active: !isAdminActive })
        .eq("id", statusId);

      if (error) throw error;

      setIsAdminActive(!isAdminActive);
      toast.success(!isAdminActive ? "Estado: Activo" : "Estado: Fuera de horario");
      queryClient.invalidateQueries({ queryKey: ["admin-availability-status"] });
    } catch (error) {
      toast.error(
        "Error al actualizar estado: " + (error instanceof Error ? error.message : "Desconocido"),
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminLayout
      title="Stock de Cuentas"
      subtitle="Gestión centralizada de inventario por plataforma"
    >
      <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              isAdminActive
                ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
            )}
          />
          <div>
            <p className="text-sm font-bold text-white uppercase tracking-wider">
              Disponibilidad: {isAdminActive ? "Activo" : "Fuera de horario"}
            </p>
            <p className="text-[10px] text-white/40 uppercase">
              Implementa una opción en el panel para programar horarios de disponibilidad (por fecha
              y hora) en lugar de solo alternar manualmente.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={isUpdatingStatus}
          onClick={toggleAdminStatus}
          className={cn(
            "border-white/10 font-bold text-[10px] uppercase tracking-widest px-6",
            isAdminActive
              ? "text-red-400 hover:text-red-300"
              : "text-green-400 hover:text-green-300",
          )}
        >
          {isAdminActive ? "Poner fuera de horario" : "Activar disponibilidad"}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar plataforma..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Añadir cuentas
            </Button>
          </DialogTrigger>
          <DialogContent className="flex h-[min(82dvh,46rem)] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden border-white/10 bg-ink p-0 text-white">
            <DialogHeader className="shrink-0 p-5 pb-0 sm:p-6 sm:pb-0">
              <DialogTitle>Añadir Stock a Plataforma</DialogTitle>
              <DialogDescription className="text-white/40">
                Selecciona una plataforma y carga las credenciales en lote.
              </DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-white/60">
                  1. Selecciona la plataforma
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProduct(p.id)}
                      className={cn(
                        "flex flex-col items-center p-2 rounded-xl border transition-all gap-1.5",
                        selectedProduct === p.id
                          ? "bg-primary/20 border-primary shadow-lg shadow-primary/20"
                          : "bg-white/5 border-white/5 hover:border-white/20",
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-white/20" />
                        )}
                      </div>
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase truncate w-full text-center px-0.5">
                        {p.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedProduct && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-medium text-white/60">
                    2. Carga credenciales (email:password)
                  </label>
                  <Textarea
                    placeholder="correo@ejemplo.com:clave123&#10;otro@ejemplo.com:clave456"
                    className="bg-white/5 border-white/10 h-48 font-mono text-sm"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <div className="flex items-center gap-2 text-xs text-white/40 bg-white/5 p-3 rounded-lg border border-white/5">
                    <AlertCircle className="w-4 h-4 text-primary" />
                    <span>
                      Soporta formatos "email:password" o "email,password". Una cuenta por línea.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="mt-auto shrink-0 p-5 pt-0 sm:p-6 sm:pt-0">
              <Button
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="border-white/10 text-white hover:bg-white/5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleBulkAdd}
                disabled={isSubmitting || !selectedProduct || !bulkText.trim()}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Guardando..." : "Confirmar Carga"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-ink/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr className="text-left text-xs text-white/40 border-b border-white/5">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Plataforma</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">
                  Stock Disponible
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-center">
                  Entregadas
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                    Cargando datos de stock...
                  </td>
                </tr>
              ) : productStock.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-white/40 italic">
                    No hay productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                productStock.map((product) => (
                  <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0">
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
                        <span className="font-semibold text-white uppercase tracking-tight">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/40 uppercase text-[10px] font-bold tracking-widest">
                      {product.category || "GENERAL"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "px-3 py-1 font-bold",
                          product.available > 0
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20",
                        )}
                      >
                        {product.available} DISPONIBLES
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center font-mono text-white/40">
                      {product.assigned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedProduct(product.id);
                          setIsAddOpen(true);
                        }}
                        className="text-primary hover:text-primary hover:bg-primary/10 font-bold text-xs uppercase"
                      >
                        Cargar más
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
