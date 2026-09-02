import { useEffect, useState } from "react";
import { Crown, ImageUp, Loader2, Save, Store, Upload } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { avatarFrames, storefrontTemplates } from "@/components/storefront/storefront-templates";
import { StorefrontLivePreview, type StorefrontPreviewSettings } from "@/components/storefront/StorefrontLivePreview";

export type StorefrontSettingsRecord = {
  availability_mode: "manual" | "schedule";
  avatar_frame_key: "neon" | "fire" | "gold" | null;
  banner_url: string | null;
  closes_at: string | null;
  display_name: string;
  description: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_available: boolean;
  is_public: boolean;
  logo_url: string | null;
  opens_at: string | null;
  store_slug: string;
  template_key: string;
  tiktok_url: string | null;
  timezone: string;
  x_url: string | null;
  youtube_url: string | null;
};

export type StorefrontSettingsPayload = {
  availabilityMode: "manual" | "schedule";
  avatarFrameKey: "neon" | "fire" | "gold" | null;
  bannerUrl: string | null;
  closesAt: string | null;
  displayName: string;
  description: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  isAvailable: boolean;
  isPublic: boolean;
  logoUrl: string | null;
  opensAt: string | null;
  storeSlug: string;
  templateKey: string;
  tiktokUrl: string | null;
  timezone: string;
  xUrl: string | null;
  youtubeUrl: string | null;
};

type Draft = StorefrontSettingsPayload & StorefrontPreviewSettings;
type PreviewProduct = { id: string; name: string; price: number | null; imageUrl?: string | null };

function initialDraft(settings: StorefrontSettingsRecord): Draft {
  return {
    availabilityMode: settings.availability_mode,
    avatarFrameKey: settings.avatar_frame_key,
    bannerUrl: settings.banner_url || "",
    closesAt: settings.closes_at?.slice(0, 5) || "",
    displayName: settings.display_name,
    description: settings.description || "",
    facebookUrl: settings.facebook_url || "",
    instagramUrl: settings.instagram_url || "",
    isAvailable: settings.is_available,
    isPublic: settings.is_public,
    logoUrl: settings.logo_url || "",
    opensAt: settings.opens_at?.slice(0, 5) || "",
    storeSlug: settings.store_slug,
    templateKey: settings.template_key || "standard-professional",
    tiktokUrl: settings.tiktok_url || "",
    timezone: settings.timezone || "America/Lima",
    xUrl: settings.x_url || "",
    youtubeUrl: settings.youtube_url || "",
  };
}

function isHttpsUrl(value: string) {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function StorefrontSettingsEditor({
  open,
  ownerId,
  ownerName,
  isAdministrativeEditing,
  settings,
  products,
  totalSales,
  saving,
  onClose,
  onPublish,
  onUploadImage,
}: {
  open: boolean;
  ownerId?: string;
  ownerName: string;
  isAdministrativeEditing: boolean;
  settings: StorefrontSettingsRecord;
  products: PreviewProduct[];
  totalSales: number;
  saving: boolean;
  onClose: () => void;
  onPublish: (payload: StorefrontSettingsPayload) => Promise<void>;
  onUploadImage: (kind: "banner" | "logo", file?: File) => Promise<string>;
}) {
  const [form, setForm] = useState<Draft>(() => initialDraft(settings));
  const [uploading, setUploading] = useState<"banner" | "logo" | null>(null);
  useEffect(() => setForm(initialDraft(settings)), [settings]);

  const update = (changes: Partial<Draft>) => setForm((current) => ({ ...current, ...changes }));
  const handleImage = async (kind: "banner" | "logo", file?: File) => {
    if (!file || !ownerId) return;
    setUploading(kind);
    try {
      const url = await onUploadImage(kind, file);
      update(kind === "banner" ? { bannerUrl: url } : { logoUrl: url });
      toast.success(kind === "banner" ? "Portada cargada. Publícala para hacerla visible." : "Avatar cargado. Publícalo para hacerlo visible.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar la imagen.");
    } finally { setUploading(null); }
  };
  const publish = async () => {
    const socialValues = [form.facebookUrl, form.instagramUrl, form.tiktokUrl, form.xUrl, form.youtubeUrl].filter(Boolean);
    if (socialValues.some((url) => !isHttpsUrl(url))) {
      toast.error("Las redes sociales deben usar una URL HTTPS válida.");
      return;
    }
    await onPublish({
      availabilityMode: form.availabilityMode, avatarFrameKey: form.avatarFrameKey, bannerUrl: form.bannerUrl.trim() || null,
      closesAt: form.closesAt || null, displayName: form.displayName.trim(), description: form.description.trim() || null,
      facebookUrl: form.facebookUrl.trim() || null, instagramUrl: form.instagramUrl.trim() || null, isAvailable: form.isAvailable,
      isPublic: form.isPublic, logoUrl: form.logoUrl.trim() || null, opensAt: form.opensAt || null, storeSlug: form.storeSlug.trim(),
      templateKey: form.templateKey, tiktokUrl: form.tiktokUrl.trim() || null, timezone: form.timezone,
      xUrl: form.xUrl.trim() || null, youtubeUrl: form.youtubeUrl.trim() || null,
    });
  };
  const publicHref = `/tienda-publica/${form.storeSlug || "mi-tienda"}`;

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="flex max-h-[calc(100vh-1.5rem)] max-w-[1180px] flex-col overflow-hidden border-border bg-[#121722] p-0 text-white sm:max-h-[calc(100vh-3rem)]">
        <DialogHeader className="border-b border-border px-5 py-4 text-center sm:px-7">
          <DialogTitle className="font-display text-xl font-bold sm:text-2xl">{isAdministrativeEditing ? `Configuración de la tienda de ${ownerName}` : "Configuración de tu Tienda"}</DialogTitle>
          {isAdministrativeEditing && <p className="mt-1 text-xs text-amber-200">Estás editando una tienda ajena como administrador. La publicación quedará auditada.</p>}
        </DialogHeader>
        <div className="grid min-h-0 flex-1 xl:grid-cols-[minmax(0,1fr)_27rem]">
          <div className="cmd-dark-scrollbar min-h-0 overflow-y-auto px-5 py-5 sm:px-7">
            <section>
              <div className="flex items-end justify-between gap-3"><div><h3 className="text-sm font-bold text-white">Ajustes de Diseño</h3><p className="mt-1 text-xs text-white/45">Elige la plantilla que mejor se adapte a tu marca.</p></div><Store className="h-5 w-5 text-primary" aria-hidden="true" /></div>
              <button type="button" disabled={saving || uploading !== null} onClick={() => void publish()} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-accent px-4 text-xs font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10"><Save className="h-4 w-4" />{saving ? "Publicando cambios…" : isAdministrativeEditing ? "Publicar cambios en esta tienda" : "Publicar cambios en mi tienda"}</button>
            </section>

            <section className="mt-7 border-t border-border/70 pt-6"><h3 className="text-sm font-bold text-white">Identidad Visual</h3><p className="mt-1 text-xs text-white/45">Personaliza tu foto de perfil y portada de tienda.</p>
              <div className="mt-4 grid gap-5 sm:grid-cols-[9rem_minmax(0,1fr)]"><div><p className="mb-2 text-xs font-semibold text-white/80">Avatar</p><div className="grid h-32 w-32 place-items-center overflow-hidden rounded-full border-4 border-card bg-background text-2xl font-black text-white">{form.logoUrl ? <img src={form.logoUrl} alt="Avatar de tienda" className="h-full w-full object-cover" /> : form.displayName.slice(0, 2).toUpperCase()}</div><label className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-white/35 sm:h-9">{uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Subir<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!ownerId || uploading !== null} onChange={(event) => void handleImage("logo", event.target.files?.[0])} /></label></div>
                <div><p className="text-xs font-semibold text-white/80">Marco de Avatar <span className="font-normal text-white/40">(Opcional)</span></p><p className="mt-1 text-xs leading-relaxed text-white/45">Destaca en la tienda con un marco animado.</p><div className="mt-3 flex flex-wrap gap-2">{avatarFrames.map((frame) => <button key={frame.name} type="button" onClick={() => update({ avatarFrameKey: frame.key })} className={form.avatarFrameKey === frame.key ? "h-11 rounded-md border border-primary bg-primary/10 px-2.5 text-xs font-bold text-primary sm:h-8" : "h-11 rounded-md border border-border bg-background px-2.5 text-xs font-semibold text-white/65 transition hover:border-white/30 sm:h-8"}>{frame.name}</button>)}</div>{form.avatarFrameKey && <button type="button" onClick={() => update({ avatarFrameKey: null })} className="mt-3 h-11 px-2 text-xs font-semibold text-red-300 transition hover:text-red-200 sm:h-auto">Quitar Marco</button>}</div></div>
              <div className="mt-5"><p className="text-xs font-semibold text-white/80">Portada de Tienda <span className="font-normal text-white/40">(Opcional)</span></p><p className="mt-1 text-xs text-white/45">Aparecerá en la parte superior de tu tienda. Medidas recomendadas: 1024×256 px.</p><div className="mt-3 overflow-hidden rounded-lg border border-border bg-background">{form.bannerUrl ? <img src={form.bannerUrl} alt="Vista previa de portada" className="h-28 w-full object-cover" /> : <div className="grid h-28 place-items-center text-xs text-white/35">Sin portada seleccionada</div>}</div><label className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-md border border-white/15 px-3 text-xs font-semibold text-white transition hover:border-white/35 sm:h-9">{uploading === "banner" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageUp className="h-3.5 w-3.5" />} Subir portada<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={!ownerId || uploading !== null} onChange={(event) => void handleImage("banner", event.target.files?.[0])} /></label><p className="mt-2 text-[10px] text-white/40">JPG, PNG o WebP; máximo 5 MB.</p></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><Input label="Nombre público" value={form.displayName} onChange={(value) => update({ displayName: value })} /><Input label="Enlace público" value={form.storeSlug} onChange={(value) => update({ storeSlug: value })} /><label className="sm:col-span-2 grid gap-1.5 text-xs font-semibold text-white/75">Descripción<textarea value={form.description} onChange={(event) => update({ description: event.target.value })} className="min-h-20 rounded-lg border border-border bg-background p-3 text-sm text-white outline-none focus:border-red-accent/70" /></label></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2"><SwitchRow label="Tienda pública" description="Permite que los clientes la visiten." checked={form.isPublic} onChange={(value) => update({ isPublic: value })} /><SwitchRow label="Disponible ahora" description="Indica si aceptas pedidos actualmente." checked={form.isAvailable} onChange={(value) => update({ isAvailable: value })} /></div>
              <label className="mt-3 grid gap-1.5 text-xs font-semibold text-white/75">Disponibilidad<select value={form.availabilityMode} onChange={(event) => update({ availabilityMode: event.target.value as "manual" | "schedule" })} className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none focus:border-red-accent/70"><option value="manual">Manual</option><option value="schedule">Por horario</option></select></label>
              {form.availabilityMode === "schedule" && <div className="mt-3 grid grid-cols-2 gap-3"><Input label="Desde" type="time" value={form.opensAt} onChange={(value) => update({ opensAt: value })} /><Input label="Hasta" type="time" value={form.closesAt} onChange={(value) => update({ closesAt: value })} /></div>}
            </section>

            <section className="mt-7 border-t border-border/70 pt-6"><h3 className="text-sm font-bold text-white">Plantilla Base</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{storefrontTemplates.map((template) => <button key={template.key} type="button" onClick={() => update({ templateKey: template.key })} className={form.templateKey === template.key ? "flex min-h-14 items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 text-left" : "flex min-h-14 items-center gap-2 rounded-lg border border-border bg-background/45 px-3 text-left transition hover:border-white/30"}><span className="h-5 w-5 shrink-0 rounded-full" style={{ background: `linear-gradient(135deg, ${template.accentSoft}, ${template.accent})` }} /> <span className="min-w-0 flex-1"><span className="flex items-center gap-1 text-xs font-bold text-white">{template.premium && <Crown className="h-3 w-3 text-amber-300" />}{template.name}</span><span className="mt-0.5 block text-[10px] text-white/45">{template.description}</span></span><span className={form.templateKey === template.key ? "h-3 w-3 rounded-full border-4 border-primary bg-background" : "h-3 w-3 rounded-full border border-white/20"} /></button>)}</div><p className="mt-3 text-xs text-white/45">Configura el estilo visual fundamental de tu tienda pública.</p></section>

            <section className="mt-7 border-t border-border/70 pb-2 pt-6"><h3 className="text-sm font-bold text-white">Redes Sociales</h3><p className="mt-1 text-xs leading-relaxed text-white/45">Tus clientes podrán contactarte directamente. Solo se mostrarán los íconos de las redes que completes.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><Input label="Facebook URL" placeholder="https://facebook.com/..." value={form.facebookUrl} onChange={(value) => update({ facebookUrl: value })} /><Input label="Instagram URL" placeholder="https://instagram.com/..." value={form.instagramUrl} onChange={(value) => update({ instagramUrl: value })} /><Input label="TikTok URL" placeholder="https://tiktok.com/@..." value={form.tiktokUrl} onChange={(value) => update({ tiktokUrl: value })} /><Input label="X (Twitter) URL" placeholder="https://x.com/..." value={form.xUrl} onChange={(value) => update({ xUrl: value })} /><Input label="YouTube URL" placeholder="https://youtube.com/..." value={form.youtubeUrl} onChange={(value) => update({ youtubeUrl: value })} /></div></section>
          </div>
          <div className="cmd-dark-scrollbar min-h-0 overflow-y-auto border-t border-border bg-black/10 px-5 py-5 sm:px-7 xl:border-l xl:border-t-0">
            <StorefrontLivePreview settings={form} products={products} totalSales={totalSales} publicHref={publicHref} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="grid gap-1.5 text-xs font-semibold text-white/75">{label}<input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="h-11 rounded-lg border border-border bg-background px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-red-accent/70 sm:h-10" /></label>;
}

function SwitchRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/45 px-3 py-2.5 text-xs"><span><span className="block font-semibold text-white">{label}</span><span className="mt-0.5 block text-[10px] text-white/45">{description}</span></span><Switch checked={checked} onCheckedChange={onChange} /></label>;
}
