import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Search,
  Database,
  AlertCircle,
  Package,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronDown,
  LayoutGrid,
  ClipboardCheck,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin/inventario")({
  component: InventoryPage,
});

function InventoryPage() {
  const [search, setSearch] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [bulkMode, setBulkMode] = useState(false);
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
    access_link: "",
    notes: "",
  });
  const [bulkText, setBulkText] = useState("");
  const queryClient = useQueryClient();

  // Fetch products for the dropdown
  const { data: products } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch inventory
  const { data: inventory, isLoading } = useQuery({
    queryKey: ["admin-account-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("account_inventory")
        .select(
          `
          *,
          products(name)
        `,
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Stats
  const stats = useMemo(() => {
    if (!inventory) return { total: 0, available: 0, assigned: 0 };
    return {
      total: inventory.length,
      available: inventory.filter((i) => i.status === "available").length,
      assigned: inventory.filter((i) => i.status === "assigned").length,
    };
  }, [inventory]);

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedProduct) throw new Error("Selecciona un producto");

      if (bulkMode) {
        // Bulk mode: email:password
        const lines = bulkText.split("\n").filter((l) => l.trim().includes(":"));
        if (lines.length === 0) throw new Error("Formato inválido. Usa email:password por línea");

        const inserts = lines.map((line) => {
          const [email, ...rest] = line.split(":");
          return {
            product_id: selectedProduct,
            email: email.trim(),
            password: rest.join(":").trim(),
            status: "available",
          };
        });

        const { error } = await supabase.from("account_inventory").insert(inserts);
        if (error) throw error;
      } else {
        // Single mode
        if (!credentials.email || !credentials.password)
          throw new Error("Email y contraseña requeridos");
        const { error } = await supabase.from("account_inventory").insert([
          {
            product_id: selectedProduct,
            email: credentials.email,
            password: credentials.password,
            access_link: credentials.access_link,
            notes: credentials.notes,
            status: "available",
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
      toast.success(bulkMode ? "Cuentas agregadas en lote" : "Cuenta agregada exitosamente");
      setIsAddOpen(false);
      setCredentials({ email: "", password: "", access_link: "", notes: "" });
      setBulkText("");
    },
    onError: (error) => {
      toast.error("Error: " + (error instanceof Error ? error.message : "Desconocido"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("account_inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
      toast.success("Cuenta eliminada");
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({
      id,
      order_id,
      verified,
    }: {
      id: string;
      order_id: string;
      verified: boolean;
    }) => {
      // Update inventory
      const { error: invError } = await supabase
        .from("account_inventory")
        .update({ payment_verified: verified })
        .eq("id", id);
      if (invError) throw invError;

      // Update order if exists
      if (order_id) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ payment_verified: verified })
          .eq("id", order_id);
        if (orderError) throw orderError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
      toast.success("Estado de pago actualizado");
    },
    onError: (error) => {
      toast.error("Error: " + (error instanceof Error ? error.message : "Desconocido"));
    },
  });

  const filteredInventory = inventory?.filter(
    (item) =>
      item.email.toLowerCase().includes(search.toLowerCase()) ||
      item.products?.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout
      title="Inventario de Cuentas"
      subtitle="Gestiona las credenciales que se entregarán automáticamente"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-ink/40 border-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white/60">Total Cuentas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-ink/40 border-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-400">
              Disponibles (Stock)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{stats.available}</div>
          </CardContent>
        </Card>
        <Card className="bg-ink/40 border-white/5 backdrop-blur-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary">Asignadas (Vendidas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.assigned}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input
            placeholder="Buscar por email o producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white"
          />
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Cargar Inventario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-ink border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Cuenta</DialogTitle>
              <DialogDescription className="text-white/40">
                Estas credenciales se entregarán automáticamente cuando alguien compre el producto.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Producto Relacionado</label>
                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue placeholder="Selecciona un producto" />
                  </SelectTrigger>
                  <SelectContent className="bg-ink border-white/10">
                    {products?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 p-1 bg-white/5 rounded-lg">
                <Button
                  size="sm"
                  variant={!bulkMode ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setBulkMode(false)}
                >
                  Manual
                </Button>
                <Button
                  size="sm"
                  variant={bulkMode ? "default" : "ghost"}
                  className="flex-1"
                  onClick={() => setBulkMode(true)}
                >
                  Lote (Bulk)
                </Button>
              </div>

              {bulkMode ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Lista de Cuentas (email:password)</label>
                  <Textarea
                    placeholder="correo@ejemplo.com:clave123&#10;otro@ejemplo.com:clave456"
                    className="bg-white/5 border-white/10 h-32 font-mono text-sm"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                  <p className="text-[10px] text-white/40">
                    Una línea por cuenta. Separado por dos puntos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm">Email</label>
                      <Input
                        value={credentials.email}
                        onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">Contraseña</label>
                      <Input
                        value={credentials.password}
                        onChange={(e) =>
                          setCredentials({ ...credentials, password: e.target.value })
                        }
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Link de Acceso (opcional)</label>
                    <Input
                      value={credentials.access_link}
                      onChange={(e) =>
                        setCredentials({ ...credentials, access_link: e.target.value })
                      }
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm">Notas/PIN (opcional)</label>
                    <Input
                      value={credentials.notes}
                      onChange={(e) => setCredentials({ ...credentials, notes: e.target.value })}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                onClick={() => addMutation.mutate()}
                disabled={addMutation.isPending}
                className="w-full"
              >
                {addMutation.isPending ? "Guardando..." : "Guardar Inventario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-ink/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-white/60">Producto</TableHead>
              <TableHead className="text-white/60">Email</TableHead>
              <TableHead className="text-white/60">Estado</TableHead>
              <TableHead className="text-white/60">Creado</TableHead>
              <TableHead className="text-right text-white/60">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  Cargando inventario...
                </TableCell>
              </TableRow>
            ) : filteredInventory?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-white/40">
                  No se encontraron cuentas.
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory?.map((item) => (
                <TableRow key={item.id} className="border-white/5 hover:bg-white/5 group">
                  <TableCell>
                    <div className="font-medium text-white">{item.products?.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-white/80">{item.email}</div>
                    <div className="text-xs text-white/40 font-mono">****</div>
                  </TableCell>
                  <TableCell>
                    {item.status === "available" ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-400 border-green-500/20"
                      >
                        Disponible
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-primary/10 text-primary border-primary/20"
                      >
                        Asignada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-white/40 text-sm">
                    {new Date(item.created_at || Date.now()).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === "available" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-white/20 hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            if (confirm("¿Seguro que quieres eliminar esta cuenta disponible?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                      {item.status === "assigned" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            verifyPaymentMutation.mutate({
                              id: item.id,
                              order_id: item.order_id || "",
                              verified: !item.payment_verified,
                            })
                          }
                          disabled={verifyPaymentMutation.isPending}
                          className={cn(
                            "py-1 h-7 text-[10px] font-bold uppercase tracking-wider transition-all",
                            item.payment_verified
                              ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
                          )}
                        >
                          {item.payment_verified ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pago Verificado
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Confirmar Pago WA
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
