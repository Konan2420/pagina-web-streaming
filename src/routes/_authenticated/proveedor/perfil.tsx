import { createFileRoute } from "@tanstack/react-router";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSupplierDashboardStats,
  getSupplierProfile,
  updateSupplierProfile,
} from "@/lib/supplier.functions";
import { useState, useEffect } from "react";
import {
  User,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  Star,
  Package,
  CalendarDays,
  Store,
  ImageIcon,
} from "lucide-react";
import { useFuturisticSound } from "@/hooks/useSound";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { ProviderAvatarPicker } from "@/components/supplier/ProviderAvatarPicker";
import { AvatarEffectPicker } from "@/components/supplier/AvatarEffectPicker";
import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { normalizeEffect } from "@/lib/avatar-effects";

export const Route = createFileRoute("/_authenticated/proveedor/perfil")({
  component: SupplierProfile,
});

type TabKey = "perfil" | "avatar";

function SupplierProfile() {
  const { playHover, playClick } = useFuturisticSound();
  const [tab, setTab] = useState<TabKey>("perfil");
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userId, setUserId] = useState("");
  const [memberSince, setMemberSince] = useState<string>("");
  const [avatarEffect, setAvatarEffect] = useState("none");
  const [previewFx, setPreviewFx] = useState("none");

  const queryClient = useQueryClient();
  const updateProfileFn = useServerFn(updateSupplierProfile);

  const { data: stats } = useQuery({
    queryKey: ["supplier-stats"],
    queryFn: () => getSupplierDashboardStats(),
  });

  const { data: profile } = useQuery({
    queryKey: ["supplier-profile"],
    queryFn: () => getSupplierProfile(),
  });

  // El perfil guardado en la base de datos es la única fuente de verdad.
  useEffect(() => {
    if (!profile) return;
    setUserId(profile.user_id);
    setDisplayName(profile.display_name || "");
    setAvatarUrl(profile.avatar_url || "");
    const fx = normalizeEffect(profile.avatar_effect);
    setAvatarEffect(fx);
    setPreviewFx(fx);
    if (profile.joined_at) setMemberSince(new Date(profile.joined_at).getFullYear().toString());
  }, [profile]);

  const save = useMutation({
    mutationFn: (payload: { display_name: string; avatar_url?: string; avatar_effect?: string }) =>
      updateProfileFn({ data: payload }),
    onSuccess: (res) => {
      const saved = res?.profile;
      if (saved) {
        const fx = normalizeEffect(saved.avatar_effect);
        setAvatarEffect(fx);
        setPreviewFx(fx);
        setAvatarUrl(saved.avatar_url || "");
      }
      queryClient.invalidateQueries({ queryKey: ["supplier-profile"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["my-order-ratings"] });
      queryClient.invalidateQueries({ queryKey: ["public-suppliers"] });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    save.mutate(
      {
        display_name: displayName.trim(),
        avatar_url: avatarUrl || undefined,
        avatar_effect: avatarEffect,
      },
      {
        onSuccess: () => toast.success("Perfil actualizado correctamente"),
        onError: () => toast.error("Error al actualizar perfil"),
      },
    );
  };

  const applyAvatar = async (url: string) => {
    if (displayName.trim().length < 2) {
      toast.error("Primero define tu nombre comercial.");
      setTab("perfil");
      return;
    }
    try {
      await save.mutateAsync({
        display_name: displayName.trim(),
        avatar_url: url,
        avatar_effect: avatarEffect,
      });
      toast.success("Avatar actualizado correctamente");
    } catch {
      toast.error("No se pudo guardar el avatar. Inténtalo nuevamente.");
    }
  };

  const applyEffect = async (fx: string) => {
    if (displayName.trim().length < 2) {
      toast.error("Primero define tu nombre comercial.");
      setTab("perfil");
      return;
    }
    try {
      // Solo se confirma en la interfaz cuando la base de datos responde OK.
      await save.mutateAsync({
        display_name: displayName.trim(),
        avatar_url: avatarUrl || undefined,
        avatar_effect: normalizeEffect(fx),
      });
      toast.success("Efecto guardado correctamente.");
    } catch {
      toast.error("No se pudo guardar el efecto. Inténtalo nuevamente.");
    }
  };

  const rating = stats?.rating ?? null;

  return (
    <SupplierLayout
      title="Mi Perfil"
      subtitle="Configura tu identidad como proveedor en la plataforma."
    >
      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-6 min-w-0">
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 w-fit">
            {(
              [
                { key: "perfil", label: "Perfil", icon: User },
                { key: "avatar", label: "Avatar", icon: ImageIcon },
              ] as const
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onMouseEnter={playHover}
                onClick={() => {
                  playClick();
                  setTab(key);
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition ${
                  tab === key
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "perfil" ? (
            <form
              onSubmit={handleSave}
              className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">
                  Nombre Comercial / Marca
                </label>
                <div className="relative group">
                  <Store className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={60}
                    placeholder="Ej: CMD Digital Store"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={save.isPending}
                onMouseEnter={playHover}
                onClick={() => playClick()}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {save.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Guardar Cambios
              </button>
            </form>
          ) : (
            <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6">
              <div>
                <h2 className="font-display text-lg text-foreground uppercase tracking-tight">
                  Avatar de Proveedor
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Elige una imagen profesional para representar tu perfil y tu tienda.
                </p>
              </div>
              <ProviderAvatarPicker
                userId={userId}
                currentUrl={avatarUrl}
                saving={save.isPending}
                onApply={applyAvatar}
              />

              <div className="border-t border-white/5 pt-6">
                <AvatarEffectPicker
                  currentEffect={avatarEffect}
                  previewEffect={previewFx}
                  avatarUrl={avatarUrl}
                  saving={save.isPending}
                  onPreview={setPreviewFx}
                  onApply={applyEffect}
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview card */}
        <aside className="bg-ink/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-7 text-center lg:sticky lg:top-6">
          <div className="relative w-28 h-28 mx-auto">
            <ProviderAvatar
              src={avatarUrl}
              effect={tab === "avatar" ? previewFx : avatarEffect}
              size="md"
              alt={`Avatar de ${displayName || "proveedor"}`}
            />
            {stats?.isVerified && (
              <span className="absolute -bottom-1 -right-1 z-20 bg-green-500 text-white p-1.5 rounded-xl border-2 border-ink">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <h3 className="mt-5 font-display text-lg text-foreground uppercase tracking-tight truncate">
            {displayName || "Tu tienda"}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
            {stats?.isVerified ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-green-500" /> Proveedor verificado
              </>
            ) : (
              "Pendiente de verificación"
            )}
          </p>

          <div className="mt-5 space-y-2.5 text-[11px] text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <Star className="w-3.5 h-3.5 text-primary" />
              {rating
                ? `${rating.toFixed(1)} (${stats?.totalReviews} reseñas)`
                : "Sin calificaciones aún"}
            </p>
            <p className="flex items-center justify-center gap-2">
              <Package className="w-3.5 h-3.5" /> {stats?.availableStock ?? 0} productos disponibles
            </p>
            <p className="flex items-center justify-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" /> Miembro desde{" "}
              {memberSince || new Date().getFullYear()}
            </p>
            <p className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" /> En línea
            </p>
          </div>

          <a
            href="/tienda"
            onMouseEnter={playHover}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition"
          >
            <Store className="w-3.5 h-3.5" /> Ver tienda
          </a>
        </aside>
      </div>
    </SupplierLayout>
  );
}
