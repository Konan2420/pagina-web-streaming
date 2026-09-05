import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Ban, Handshake, Search, ShieldAlert, Store, User as UserIcon } from "lucide-react";
import { getUsersWithRoles, updateUserRole } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BanUserDialog, type BanTarget } from "@/components/admin/BanUserDialog";

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
  const [banTarget, setBanTarget] = useState<BanTarget | null>(null);

  const queryClient = useQueryClient();
  const updateRoleMutation = useServerFn(updateUserRole);

  const filteredUsers = users.filter(
    (u) =>
      u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-muted/55 text-muted-foreground border border-border">
            <UserIcon className="w-3 h-3" /> Usuario
          </span>
        );
    }
  };

  return (
    <AdminLayout
      title="Usuarios"
      subtitle="Todas las cuentas registradas, con su rol actual y herramientas de moderación."
    >
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo o WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <span className="hidden shrink-0 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:inline-flex">
          {users.length} registrados
        </span>
      </div>

      <div className="glass-card rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground border-b border-border bg-muted/45">
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">WhatsApp</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Registro</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider">Rol Actual</th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  {isAdmin ? "Cambiar Rol" : ""}
                </th>
                <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">
                  {isAdmin ? "Moderación" : ""}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/45 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted/55 border border-border flex items-center justify-center text-muted-foreground">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-foreground">
                          {user.nombre_completo || "Sin nombre"}
                        </span>
                        {user.email && <span className="hidden text-xs text-muted-foreground xl:inline">{user.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                      {user.whatsapp || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("es-PE", { dateStyle: "medium" }).format(
                        new Date(user.created_at),
                      )}
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
                          className="bg-card border border-border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                        >
                          <option value="user">Usuario</option>
                          <option value="proveedor">Proveedor</option>
                          <option value="distribuidor">Distribuidor</option>
                          <option value="admin">Administrador</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {isAdmin && user.role !== "admin" && (
                        <button
                          type="button"
                          onClick={() =>
                            setBanTarget({
                              id: user.id,
                              name: user.nombre_completo || "Usuario sin nombre",
                              email: user.email || undefined,
                              role: user.role,
                            })
                          }
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-destructive/35 px-3 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                        >
                          <Ban className="size-3.5" /> Banear
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
      <BanUserDialog
        open={Boolean(banTarget)}
        onOpenChange={(open) => {
          if (!open) setBanTarget(null);
        }}
        target={banTarget}
        onCompleted={() => queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] })}
      />
    </AdminLayout>
  );
}
