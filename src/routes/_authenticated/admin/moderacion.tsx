import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Ban, Clock3, Loader2, Search, ShieldCheck, Undo2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { getUserBans, revokeUserBan } from "@/lib/ban.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BanStatus = "active" | "expired" | "revoked";
type BanRow = {
  id: string;
  reason: string;
  ip_address: string | null;
  starts_at: string;
  ends_at: string | null;
  status: BanStatus;
  created_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
  user: { id: string; name: string; email: string; role: string };
  bannedBy: string;
  revokedBy: string | null;
};

const bansQuery = queryOptions({
  queryKey: ["admin-user-bans"],
  queryFn: () => getUserBans(),
});

export const Route = createFileRoute("/_authenticated/admin/moderacion")({
  loader: ({ context }) => context.queryClient.ensureQueryData(bansQuery),
  component: ModerationPage,
});

function dateLabel(value: string | null) {
  if (!value) return "Permanente";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : new Intl.DateTimeFormat("es-PE", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima" }).format(date);
}

function statusBadge(status: BanStatus) {
  const labels: Record<BanStatus, string> = { active: "Activo", expired: "Expirado", revoked: "Revocado" };
  const colors: Record<BanStatus, string> = {
    active: "border-destructive/35 bg-destructive/10 text-destructive",
    expired: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    revoked: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${colors[status]}`}>{labels[status]}</span>;
}

function ModerationPage() {
  const { data } = useSuspenseQuery(bansQuery);
  const bans = data as BanRow[];
  const queryClient = useQueryClient();
  const revoke = useServerFn(revokeUserBan);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | BanStatus>("all");
  const [role, setRole] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [revokeTarget, setRevokeTarget] = useState<BanRow | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeConfirmed, setRevokeConfirmed] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const filtered = bans.filter((ban) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [ban.user.name, ban.user.email, ban.ip_address || "", ban.reason].some((value) => value.toLowerCase().includes(term));
    const timestamp = new Date(ban.created_at).getTime();
    const afterStart = !fromDate || timestamp >= new Date(`${fromDate}T00:00:00`).getTime();
    const beforeEnd = !toDate || timestamp <= new Date(`${toDate}T23:59:59.999`).getTime();
    return matchesSearch && afterStart && beforeEnd && (status === "all" || ban.status === status) && (role === "all" || ban.user.role === role);
  });
  const activeCount = bans.filter((ban) => ban.status === "active").length;
  const permanentCount = bans.filter((ban) => ban.status === "active" && !ban.ends_at).length;

  const closeRevoke = (open: boolean) => {
    if (!open && !revoking) {
      setRevokeTarget(null);
      setRevokeReason("");
      setRevokeConfirmed(false);
    }
  };

  const handleRevoke = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await revoke({ data: { banId: revokeTarget.id, reason: revokeReason || undefined } });
      toast.success("Baneo revocado. La cuenta podrá volver a iniciar sesión.");
      closeRevoke(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-user-bans"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo revocar el baneo.");
    } finally {
      setRevoking(false);
    }
  };

  return (
    <AdminLayout title="Moderación" subtitle="Suspensiones de cuentas e historial de auditoría">
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Summary icon={<Ban className="size-5" />} label="Baneos activos" value={activeCount} tone="text-destructive" />
        <Summary icon={<Clock3 className="size-5" />} label="Suspensiones permanentes" value={permanentCount} tone="text-amber-300" />
        <Summary icon={<ShieldCheck className="size-5" />} label="Historial total" value={bans.length} tone="text-primary" />
      </div>

      <div className="glass-card rounded-2xl border border-border p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_11rem_11rem_10rem_10rem]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por usuario, correo, IP o motivo…" className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary" />
          </label>
          <select value={status} onChange={(event) => setStatus(event.target.value as "all" | BanStatus)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="expired">Expirados</option>
            <option value="revoked">Revocados</option>
          </select>
          <select value={role} onChange={(event) => setRole(event.target.value)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary">
            <option value="all">Todos los roles</option>
            <option value="user">Usuarios</option>
            <option value="proveedor">Proveedores</option>
            <option value="distribuidor">Distribuidores</option>
          </select>
          <label className="sr-only" aria-label="Desde"><input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
          <label className="sr-only" aria-label="Hasta"><input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary" /></label>
        </div>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Usuario</th><th className="px-4 py-3">Motivo</th><th className="px-4 py-3">IP</th><th className="px-4 py-3">Periodo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Administró</th><th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center text-sm text-muted-foreground">No se encontraron baneos para los filtros aplicados.</td></tr> : filtered.map((ban) => (
                <tr key={ban.id} className="align-top transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3"><p className="font-semibold text-foreground">{ban.user.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{ban.user.email} · {ban.user.role}</p></td>
                  <td className="max-w-64 px-4 py-3 text-sm text-foreground"><p className="line-clamp-2">{ban.reason}</p>{ban.revocation_reason && <p className="mt-1 text-xs text-emerald-300">Revocación: {ban.revocation_reason}</p>}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{ban.ip_address || "No registrada"}</td>
                  <td className="px-4 py-3 text-xs leading-5 text-muted-foreground"><p>Inicio: {dateLabel(ban.starts_at)}</p><p>Fin: {dateLabel(ban.ends_at)}</p></td>
                  <td className="px-4 py-3">{statusBadge(ban.status)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground"><p>{ban.bannedBy}</p>{ban.revokedBy && <p className="mt-1 text-emerald-300">Revocado por {ban.revokedBy}</p>}</td>
                  <td className="px-4 py-3 text-right">{ban.status === "active" && <Button size="sm" variant="outline" onClick={() => setRevokeTarget(ban)} className="border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 hover:text-emerald-200"><Undo2 className="size-3.5" /> Revocar</Button>}</td>
                </tr>
              ))}</tbody>
          </table>
        </div>
      </div>

      <Dialog open={Boolean(revokeTarget)} onOpenChange={closeRevoke}>
        <DialogContent className="bg-card sm:max-w-lg">
          <DialogHeader><DialogTitle>Revocar baneo</DialogTitle><DialogDescription>Restaurará el acceso de {revokeTarget?.user.name}. Si el baneo añadió una IP vinculada, también se revocará esa restricción asociada.</DialogDescription></DialogHeader>
          <form className="space-y-4" onSubmit={handleRevoke}>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">Motivo de revocación <span className="font-normal text-muted-foreground">(opcional)</span><textarea value={revokeReason} onChange={(event) => setRevokeReason(event.target.value)} maxLength={1000} className="min-h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" /></label>
            <label className="flex items-start gap-3 rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-3 text-sm text-foreground"><input required type="checkbox" checked={revokeConfirmed} onChange={(event) => setRevokeConfirmed(event.target.checked)} className="mt-0.5 size-4 accent-emerald-500" /><span>Confirmo que deseo levantar esta suspensión.</span></label>
            <DialogFooter><Button type="button" variant="outline" disabled={revoking} onClick={() => closeRevoke(false)}>Cancelar</Button><Button type="submit" disabled={revoking || !revokeConfirmed} className="bg-emerald-600 text-white hover:bg-emerald-500">{revoking && <Loader2 className="size-4 animate-spin" />} Revocar baneo</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function Summary({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: string }) {
  return <div className="rounded-xl border border-border bg-card p-4"><div className={`mb-3 ${tone}`}>{icon}</div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold text-foreground">{value}</p></div>;
}
