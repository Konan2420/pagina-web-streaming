import { useState } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { createUserBan } from "@/lib/ban.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type BanTarget = {
  id: string;
  name: string;
  email?: string;
  role: string;
};

export function BanUserDialog({
  open,
  onOpenChange,
  target,
  onCompleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: BanTarget | null;
  onCompleted?: () => void;
}) {
  const banUser = useServerFn(createUserBan);
  const [reason, setReason] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [banAssociatedIp, setBanAssociatedIp] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setReason("");
    setStartsAt("");
    setEndsAt("");
    setBanAssociatedIp(false);
    setConfirmed(false);
  };

  const close = (nextOpen: boolean) => {
    if (!nextOpen && !saving) reset();
    onOpenChange(nextOpen);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!target || target.role === "admin") return;
    setSaving(true);
    try {
      const result = await banUser({
        data: {
          userId: target.id,
          reason,
          startsAt: startsAt || undefined,
          endsAt: endsAt || null,
          banAssociatedIp,
        },
      });
      toast.success(result.ipBanCreated ? "Cuenta e IP asociada suspendidas." : "Cuenta suspendida correctamente.");
      if (banAssociatedIp && !result.ipBanCreated) {
        toast.info("No había una IP autenticada registrada para esta cuenta.");
      }
      if (!result.sessionRevoked) {
        toast.warning("El baneo fue creado, pero la sesión remota se cerrará al siguiente acceso.");
      }
      reset();
      onOpenChange(false);
      onCompleted?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el baneo.");
    } finally {
      setSaving(false);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="border-destructive/35 bg-card sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldAlert className="size-5 text-destructive" /> Suspender cuenta
          </DialogTitle>
          <DialogDescription>
            Restringirá por completo el acceso de <strong className="text-foreground">{target.name}</strong>. Esta acción queda registrada para auditoría.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Motivo <span className="text-destructive">*</span>
            <textarea
              required
              minLength={3}
              maxLength={1000}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Describe el motivo del baneo para la auditoría interna."
              className="min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              Inicio
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="block text-xs font-normal text-muted-foreground">Vacío: comienza ahora.</span>
            </label>
            <label className="block space-y-1.5 text-sm font-medium text-foreground">
              Fin
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
              <span className="block text-xs font-normal text-muted-foreground">Vacío: baneo permanente.</span>
            </label>
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={banAssociatedIp}
              onChange={(event) => setBanAssociatedIp(event.target.checked)}
              className="mt-0.5 size-4 accent-primary"
            />
            <span>
              Bloquear también la última IP autenticada conocida.
              <span className="mt-0.5 block text-xs text-muted-foreground">Es una medida adicional; puede afectar redes compartidas.</span>
            </span>
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-destructive/25 bg-destructive/5 p-3 text-sm text-foreground">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-0.5 size-4 accent-destructive"
            />
            <span>Confirmo que revisé la cuenta y autorizo esta suspensión.</span>
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => close(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={saving || !confirmed || target.role === "admin"}>
              {saving && <Loader2 className="size-4 animate-spin" />} Suspender cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
