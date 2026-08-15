import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { effectLabel } from "@/lib/avatar-effects";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import {
  Users,
  Search,
  ShieldCheck,
  Star,
  Plus,
  BadgeCheck,
  Package,
  TrendingUp,
  X,
  User as UserIcon,
} from "lucide-react";
import { useFuturisticSound } from "@/hooks/useSound";
import { setSupplierCommission } from "@/lib/admin.functions";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type SupplierProfileContact = Pick<Tables<"profiles">, "nombre_completo" | "whatsapp">;
type SupplierWithProfile = Tables<"supplier_profiles"> & {
  profiles: SupplierProfileContact | null;
};

export const Route = createFileRoute("/_authenticated/admin/proveedores")({
  component: SuppliersManagement,
});

function SuppliersManagement() {
  const { playHover, playClick } = useFuturisticSound();
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newSupplierEmail, setNewSupplierEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<{ user_id: string; value: string } | null>(null);

  const queryClient = useQueryClient();

  const {
    data: suppliers = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async (): Promise<SupplierWithProfile[]> => {
      console.log("Fetching suppliers...");
      const { data, error } = await supabase.from("supplier_profiles").select(`
          *,
          profiles(
            nombre_completo,
            whatsapp
          )
        `);

      if (error) {
        console.error("Error fetching suppliers:", error);
        throw error;
      }
      console.log("Suppliers data received:", data);
      return (data ?? []) as unknown as SupplierWithProfile[];
    },
  });

  const handleVerify = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("supplier_profiles")
        .update({ is_verified: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentStatus ? "Verificación removida" : "Proveedor verificado con éxito");
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    } catch (err) {
      toast.error("Error al actualizar verificación");
    }
  };

  const commissionMutation = useMutation({
    mutationFn: (vars: { user_id: string; commission_rate: number }) =>
      setSupplierCommission({ data: vars }),
    onSuccess: () => {
      toast.success("Comisión actualizada");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar la comisión"),
  });

  const filtered = suppliers.filter((s) => {
    const profile = s.profiles;
    const displayName = s.display_name?.toLowerCase() || "";
    const fullName = profile?.nombre_completo?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();

    return displayName.includes(search) || fullName.includes(search);
  });

  return (
    <AdminLayout
      title="Gestión de Proveedores"
      subtitle="Autoriza, verifica y monitorea a los proveedores externos."
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              playClick();
              setShowAdd(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition shadow-lg shadow-primary/20"
          >
            <Plus className="w-5 h-5" /> Invitar Proveedor
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {isLoading ? (
          [1, 2].map((i) => <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse" />)
        ) : queryError ? (
          <div className="lg:col-span-2 py-20 text-center border border-red-500/20 rounded-3xl bg-red-500/5">
            <p className="text-red-400 font-bold mb-2">Error al cargar proveedores</p>
            <p className="text-white/40 text-sm">
              {queryError instanceof Error ? queryError.message : "Error desconocido"}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="lg:col-span-2 py-20 text-center border border-white/5 rounded-3xl bg-white/[0.01]">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 italic">
              No se encontraron proveedores ({suppliers.length} en total).
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              className="bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] group hover:border-primary/20 transition-all relative overflow-hidden"
              onMouseEnter={playHover}
            >
              {/* Stats Overlay background */}
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                  <ProviderAvatar
                    src={s.avatar_url}
                    effect={(s as { avatar_effect?: string }).avatar_effect}
                    size="sm"
                    verified={s.is_verified}
                    alt={s.display_name}
                  />
                  <div>
                    <h3 className="text-xl font-display text-white uppercase tracking-tight flex items-center gap-2">
                      {s.display_name}
                      {s.is_verified && <BadgeCheck className="w-5 h-5 text-green-500" />}
                    </h3>
                    <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5">
                      {s.profiles?.nombre_completo || "Perfil sin nombre"}
                    </p>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1">
                      Efecto: {effectLabel((s as { avatar_effect?: string }).avatar_effect)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-500/20">
                    <Star className="w-3 h-3 fill-yellow-500" />{" "}
                    {s.total_reviews
                      ? `${Number(s.rating).toFixed(1)} (${s.total_reviews})`
                      : "Sin reseñas"}
                  </div>
                  <button
                    onClick={() => handleVerify(s.id, !!s.is_verified)}
                    className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${
                      s.is_verified
                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                        : "bg-white/5 text-white/40 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {s.is_verified ? "VERIFICADO" : "VERIFICAR"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                    Ventas
                  </p>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xl font-display text-white">{s.total_sales || 0}</span>
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">
                    Comisión
                  </p>
                  {editing?.user_id === s.user_id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editing.value}
                        onChange={(e) => setEditing({ user_id: s.user_id, value: e.target.value })}
                        className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        onClick={() =>
                          commissionMutation.mutate({
                            user_id: s.user_id,
                            commission_rate: Number(editing.value),
                          })
                        }
                        className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-primary text-white"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        className="text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-white/10 text-white/60"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        playClick();
                        setEditing({
                          user_id: s.user_id,
                          value: String(s.commission_rate ?? 70),
                        });
                      }}
                      className="flex items-center gap-2 hover:text-primary transition-colors"
                    >
                      <Package className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-xl font-display text-white">
                        {Number(s.commission_rate ?? 70)}%
                      </span>
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <p className="text-[10px] text-white/30 font-medium">
                    WhatsApp:{" "}
                    <span className="text-white/60">{s.profiles?.whatsapp || "No registrado"}</span>
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Invitar Proveedor */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative w-full max-w-lg bg-ink border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-display text-white uppercase tracking-tight">
                  Autorizar Proveedor
                </h2>
                <p className="text-white/40 text-sm mt-1">
                  Selecciona un usuario para otorgarle el rol.
                </p>
              </div>
              <button
                onClick={() => setShowAdd(false)}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8">
              <p className="text-sm text-white/60 mb-8">
                Para activar un nuevo proveedor, primero debes asignarle el rol en la sección de
                gestión de usuarios.
              </p>

              <Link
                to="/admin/usuarios"
                className="block w-full py-4 bg-primary text-white rounded-2xl font-bold text-center text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 mb-4"
                onClick={() => setShowAdd(false)}
              >
                Ir a Usuarios para Asignar Rol
              </Link>

              <button
                onClick={() => setShowAdd(false)}
                className="w-full py-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
