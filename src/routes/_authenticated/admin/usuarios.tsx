import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Handshake, Search, ShieldAlert, Store, User as UserIcon } from "lucide-react";
import { getUsersWithRoles, updateUserRole } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

type AssignableRole = "admin" | "proveedor" | "distribuidor" | "user";

const usersQueryOptions = queryOptions({
  queryKey: ["admin-users-roles"],
  queryFn: () => getUsersWithRoles(),
});

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
  component: UsersManagement,
});

function UsersManagement() {
  const { data: users } = useSuspenseQuery(usersQueryOptions);
  const { isAdmin } = Route.useRouteContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const updateRoleMutation = useServerFn(updateUserRole);

  const filteredUsers = users.filter(
    (u) =>
      u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.whatsapp?.includes(searchTerm),
  );

  const handleUpdateRole = async (userId: string, role: AssignableRole) => {
    setUpdatingId(userId);
    try {
      await updateRoleMutation({ data: { user_id: userId, role } });
      toast.success("Rol actualizado correctamente");
      queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
    } catch (err) {
      toast.error(
        "Error al actualizar rol: " + (err instanceof Error ? err.message : "Error desconocido"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            <ShieldAlert className="w-3 h-3" /> Admin
          </span>
        );
      case "proveedor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
            <Store className="w-3 h-3" /> Proveedor
          </span>
        );
      case "distribuidor":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
            <Handshake className="w-3 h-3" /> Distribuidor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
            <UserIcon className="w-3 h-3" /> Usuario
          </span>
        );
    }
  };

  return (
    <AdminLayout title="Usuarios" subtitle="Gestión de permisos y roles de acceso">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por nombre o whatsapp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-white/40 border-b border-white/5 bg-white/[0.02]">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Rol Actual</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  {isAdmin ? "Cambiar Rol" : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-white/30 italic">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-white">
                          {user.nombre_completo || "Sin nombre"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-white/40 font-mono text-xs">
                      {user.whatsapp || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin && (
                        <select
                          disabled={updatingId === user.id}
                          value={user.role}
                          onChange={(e) => {
                            const role = e.target.value;
                            if (
                              role === "admin" ||
                              role === "proveedor" ||
                              role === "distribuidor" ||
                              role === "user"
                            ) {
                              void handleUpdateRole(user.id, role);
                            }
                          }}
                          className="bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                        >
                          <option value="user">Usuario</option>
                          <option value="proveedor">Proveedor</option>
                          <option value="distribuidor">Distribuidor</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
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
