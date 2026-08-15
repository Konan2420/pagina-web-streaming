import { useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PROVIDER_AVATARS } from "@/lib/provider-avatars";

const MAX_BYTES = 2 * 1024 * 1024;
const OUT_SIZE = 512;
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

type Props = {
  userId: string;
  currentUrl: string;
  saving: boolean;
  onApply: (url: string) => void | Promise<void>;
};

/** Galería de avatares predefinidos + subida de imagen propia. */
export function ProviderAvatarPicker({ userId, currentUrl, saving, onApply }: Props) {
  const [selected, setSelected] = useState<string>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const dirty = selected !== "" && selected !== currentUrl;

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (inputRef.current) inputRef.current.value = "";
    if (!file) {
      toast.error("Selecciona una imagen válida.");
      return;
    }
    if (!ALLOWED.includes(file.type)) {
      toast.error("Formato no compatible.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("La imagen supera el tamaño máximo permitido.");
      return;
    }

    setUploading(true);
    try {
      const bitmap = await createImageBitmap(file);
      const side = Math.min(bitmap.width, bitmap.height);
      const sx = (bitmap.width - side) / 2;
      const sy = (bitmap.height - side) / 2;

      const canvas = document.createElement("canvas");
      canvas.width = OUT_SIZE;
      canvas.height = OUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Tu navegador no soporta el recorte de imágenes.");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUT_SIZE, OUT_SIZE);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))),
          "image/webp",
          0.9,
        ),
      );

      const path = `${userId}/supplier-avatar-${Date.now()}.webp`;
      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/webp" });
      if (error) throw error;

      const { data: signed } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      if (!signed?.signedUrl) throw new Error("No se pudo generar el enlace de la imagen.");

      setSelected(signed.signedUrl);
      toast.success("Imagen lista. Pulsa «Usar este avatar» para aplicarla.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Vista previa grande */}
        <div className="flex flex-col items-center gap-3 shrink-0">
          <div className="relative w-40 h-40 animate-fire-aura">
            <div className="w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-white/5 relative z-10">
              {selected ? (
                <img
                  src={selected}
                  alt="Vista previa del avatar seleccionado"
                  width={512}
                  height={512}
                  className="w-full h-full object-cover"
                />
              ) : null}
            </div>
            <span className="absolute bottom-2 right-2 z-20 w-4 h-4 rounded-full bg-green-500 border-2 border-ink" />
          </div>
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onApply(selected)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Usar este avatar
          </button>
        </div>

        {/* Galería */}
        <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {PROVIDER_AVATARS.map((a) => {
            const active = selected === a.url;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setSelected(a.url)}
                aria-label={`Seleccionar avatar ${a.label}`}
                aria-pressed={active}
                className={`relative rounded-full aspect-square overflow-hidden border-2 transition ${
                  active
                    ? "border-primary shadow-[0_0_18px_2px_hsl(var(--primary)/0.45)]"
                    : "border-white/10 hover:border-primary/50"
                }`}
              >
                <img
                  src={a.thumb}
                  alt={a.label}
                  width={128}
                  height={128}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                {active && (
                  <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground grid place-items-center">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Imagen propia */}
      <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <p className="text-sm text-foreground font-semibold">¿Prefieres usar tu propia imagen?</p>
          <p className="text-[11px] text-muted-foreground mt-1">
            PNG, JPG o WEBP · máx 2MB · recomendado 512 × 512 px
          </p>
        </div>
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-xs font-black uppercase tracking-widest hover:border-primary/50 transition disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Subir imagen
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {!selected && (
        <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ImagePlus className="w-3.5 h-3.5" /> Aún no has elegido un avatar.
        </p>
      )}
    </div>
  );
}
