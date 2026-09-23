import { useEffect, useState, type ChangeEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgePercent, Image as ImageIcon, Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  DISCOUNT_BANNER_CONFIG_ID,
  DiscountBanner,
  type DiscountBannerConfig,
} from "@/components/tienda/DiscountBanner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type DiscountForm = Pick<
  DiscountBannerConfig,
  | "is_active"
  | "discount_amount"
  | "main_text"
  | "sub_text"
  | "icon_type"
  | "icon_value"
  | "starts_at"
  | "ends_at"
>;

function toDateTimeLocalValue(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function currentDateTimeLocalValue() {
  return toDateTimeLocalValue(new Date().toISOString());
}

const DEFAULT_FORM: DiscountForm = {
  is_active: false,
  discount_amount: 10,
  main_text: "{user} recibe un aumento del {amount}%!",
  sub_text: "En tu próxima recarga",
  icon_type: "emoji",
  icon_value: "🎁",
  starts_at: currentDateTimeLocalValue(),
  ends_at: "",
};

export const Route = createFileRoute("/_authenticated/admin/banner-descuento")({
  component: DiscountBannerAdminPage,
});

function DiscountBannerAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<DiscountForm>(DEFAULT_FORM);
  const [uploading, setUploading] = useState(false);

  const configQuery = useQuery({
    queryKey: ["discount-banner-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("discount_banner_config")
        .select("*")
        .eq("id", DISCOUNT_BANNER_CONFIG_ID)
        .maybeSingle();
      if (error) throw error;
      return data as DiscountBannerConfig | null;
    },
  });

  useEffect(() => {
    if (!configQuery.data) return;
    const { is_active, discount_amount, main_text, sub_text, icon_type, icon_value } =
      configQuery.data;
    setForm({
      is_active,
      discount_amount,
      main_text,
      sub_text,
      icon_type,
      icon_value,
      starts_at: toDateTimeLocalValue(configQuery.data.starts_at),
      ends_at: toDateTimeLocalValue(configQuery.data.ends_at),
    });
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Tu sesión de administrador no es válida.");
      const startsAt = new Date(form.starts_at);
      const endsAt = form.ends_at ? new Date(form.ends_at) : null;
      if (Number.isNaN(startsAt.getTime())) throw new Error("La fecha de inicio no es válida.");
      if (endsAt && (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt)) {
        throw new Error("La fecha de finalización debe ser posterior al inicio.");
      }

      const { error } = await supabase.from("discount_banner_config").upsert(
        {
          id: DISCOUNT_BANNER_CONFIG_ID,
          ...form,
          discount_amount: Math.min(
            100,
            Math.max(0, Math.round(Number(form.discount_amount) || 0)),
          ),
          main_text: form.main_text.trim() || DEFAULT_FORM.main_text,
          sub_text: form.sub_text.trim(),
          icon_value: form.icon_value.trim() || DEFAULT_FORM.icon_value,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt?.toISOString() ?? null,
          updated_by: authData.user.id,
        },
        { onConflict: "id" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Banner de aumento actualizado.");
      void queryClient.invalidateQueries({ queryKey: ["discount-banner-config"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el banner.");
    },
  });

  const handleIconUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("La imagen debe ser PNG, JPG, WebP o GIF.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no puede superar los 2 MB.");
      return;
    }

    setUploading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("Tu sesión de administrador no es válida.");
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${authData.user.id}/discount-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("discount-banner-assets")
        .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("discount-banner-assets").getPublicUrl(path);
      setForm((current) => ({ ...current, icon_type: "image", icon_value: data.publicUrl }));
      toast.success("Icono cargado. Guarda los cambios para publicarlo.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el icono.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout
      title="Banner de aumento"
      subtitle="Configura el aviso de aumento de saldo que aparece sobre los métodos de recarga"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.8fr)]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <BadgePercent className="mt-0.5 h-5 w-5 text-yellow-300" aria-hidden="true" />
            <div>
              <h2 className="text-base font-bold text-white">Contenido del banner de aumento</h2>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Usa <code className="text-white/80">&#123;user&#125;</code> y{" "}
                <code className="text-white/80">&#123;amount&#125;</code> para personalizar el
                mensaje automáticamente.
              </p>
            </div>
          </div>

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              saveMutation.mutate();
            }}
          >
            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/10 p-4">
              <span>
                <span className="block text-sm font-semibold text-white">Mostrar banner</span>
                <span className="mt-1 block text-xs text-white/45">
                  Visible para clientes, proveedores y distribuidores autenticados mientras esté
                  vigente.
                </span>
              </span>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) =>
                  setForm((current) => ({ ...current, is_active: event.target.checked }))
                }
                className="h-5 w-5 accent-[var(--color-primary,#DC2626)]"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                  Inicio de la promoción
                </span>
                <input
                  type="datetime-local"
                  value={form.starts_at}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, starts_at: event.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                  Fin del temporizador
                </span>
                <input
                  type="datetime-local"
                  value={form.ends_at ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ends_at: event.target.value }))
                  }
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
                <span className="block text-[11px] text-white/40">
                  Déjalo vacío para una promoción sin vencimiento.
                </span>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                Aumento de saldo (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                value={form.discount_amount}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    discount_amount: Number(event.target.value),
                  }))
                }
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              <span className="block text-[11px] text-white/40">
                Se sumará automáticamente al saldo acreditado de cada recarga verificada, sin
                distinguir entre cliente, proveedor o distribuidor.
              </span>
            </label>

            <div className="rounded-xl border border-primary/20 bg-primary/[0.06] p-4 text-xs leading-relaxed text-white/65">
              <strong className="text-white">Alcance global:</strong> cuando el banner esté activo y
              vigente, el porcentaje se aplica a cualquier cuenta autenticada. Tú controlas su
              activación, vigencia y porcentaje desde este panel.
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                Texto principal
              </span>
              <input
                value={form.main_text}
                maxLength={140}
                onChange={(event) =>
                  setForm((current) => ({ ...current, main_text: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                Subtítulo
              </span>
              <input
                value={form.sub_text}
                maxLength={140}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sub_text: event.target.value }))
                }
                className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wide text-white/55">Icono</span>
              <div className="flex flex-wrap gap-2">
                {(["emoji", "image"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, icon_type: type }))}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-xs font-semibold transition",
                      form.icon_type === type
                        ? "border-primary/60 bg-primary/15 text-white"
                        : "border-white/10 bg-background text-white/55 hover:text-white",
                    )}
                  >
                    {type === "emoji" ? "Emoji" : "Imagen"}
                  </button>
                ))}
              </div>
              {form.icon_type === "emoji" ? (
                <input
                  value={form.icon_value}
                  maxLength={8}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, icon_value: event.target.value }))
                  }
                  placeholder="🎁"
                  className="w-full rounded-lg border border-white/10 bg-background px-3 py-3 text-lg text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-background px-3 py-2 text-xs font-semibold text-white/70 hover:text-white">
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Cargar imagen
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleIconUpload}
                      className="sr-only"
                      disabled={uploading}
                    />
                  </label>
                  {form.icon_value && (
                    <img
                      src={form.icon_value}
                      alt="Vista previa del icono"
                      className="h-10 w-10 rounded-lg object-cover"
                    />
                  )}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saveMutation.isPending || configQuery.isLoading}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar cambios
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
          <div className="mb-5 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">Vista previa del banner de aumento</h2>
          </div>
          <div className="rounded-xl border border-white/10 bg-background p-4">
            <DiscountBanner configOverride={form} userNameOverride="Mariana" />
            {!form.is_active && (
              <p className="text-xs text-white/40">El banner está desactivado.</p>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}
