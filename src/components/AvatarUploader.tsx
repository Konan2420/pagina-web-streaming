import { useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Camera, Loader2, Upload, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string;
  fallbackInitials: string;
  avatarUrl?: string | null;
  onUploaded?: (avatarUrl: string) => void;
};

const AVATARS_BUCKET = "avatars";
const MAX_FILE_SIZE = 8 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png"]);

function withCacheVersion(url: string) {
  return `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
}

async function createCroppedAvatar(source: string, area: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const target = new Image();
    target.onload = () => resolve(target);
    target.onerror = () => reject(new Error("No pudimos procesar esta imagen."));
    target.src = source;
  });

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite procesar imágenes.");

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo crear el recorte."))),
      "image/jpeg",
      0.9,
    );
  });
}

/** Selecciona, recorta y sincroniza el avatar público del perfil autenticado. */
export function AvatarUploader({ userId, fallbackInitials, avatarUrl, onUploaded }: Props) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(avatarUrl ?? null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const avatarPath = `${userId}/avatar.jpg`;

  useEffect(() => {
    setCurrentUrl(avatarUrl ?? null);
  }, [avatarUrl]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function resetEditor() {
    setPreviewUrl(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPickFile(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ACCEPTED_TYPES.has(selectedFile.type)) {
      toast.error("Solo se permiten imágenes PNG o JPG.");
      event.target.value = "";
      return;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error("La imagen supera el límite de 8 MB.");
      event.target.value = "";
      return;
    }

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleUpload() {
    if (!previewUrl || !croppedAreaPixels) {
      toast.error("Ajusta la imagen antes de guardarla.");
      return;
    }

    setUploading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      const authenticatedUserId = authData.user?.id;
      if (authError || !authenticatedUserId || authenticatedUserId !== userId) {
        throw new Error("Tu sesión ya no es válida. Inicia sesión nuevamente e inténtalo otra vez.");
      }

      const avatarBlob = await createCroppedAvatar(previewUrl, croppedAreaPixels);
      const { error: uploadError } = await supabase.storage
        .from(AVATARS_BUCKET)
        .upload(avatarPath, avatarBlob, {
          upsert: true,
          contentType: "image/jpeg",
          cacheControl: "3600",
        });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from(AVATARS_BUCKET)
        .getPublicUrl(avatarPath);
      if (!publicUrlData.publicUrl) throw new Error("No se pudo obtener la URL pública del avatar.");

      const nextAvatarUrl = withCacheVersion(publicUrlData.publicUrl);
      const { data: savedProfile, error: profileError } = await supabase
        .from("profiles")
        .upsert(
          { id: authenticatedUserId, avatar_url: nextAvatarUrl },
          { onConflict: "id" },
        )
        .select("avatar_url")
        .single();
      if (profileError) throw profileError;

      const persistedAvatarUrl = savedProfile.avatar_url || nextAvatarUrl;
      setCurrentUrl(persistedAvatarUrl);
      onUploaded?.(persistedAvatarUrl);
      resetEditor();
      toast.success("Foto de perfil actualizada.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Error desconocido";
      toast.error(`No se pudo guardar la foto: ${detail}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="text-xs uppercase tracking-wider text-white/78">Foto de perfil</label>

      {!previewUrl ? (
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/10 bg-white/[0.04]">
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="Foto de perfil del usuario"
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-white">{fallbackInitials || "US"}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white transition hover:border-violet-2/40"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {currentUrl ? "Cambiar foto" : "Subir foto"}
            </button>
            <p className="text-[10px] text-white/62">PNG o JPG · máx. 8 MB · recorte circular</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            <div className="relative mx-auto h-72 w-72 max-w-full shrink-0 overflow-hidden rounded-full bg-black/50 sm:mx-0">
              <Cropper
                image={previewUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <div className="w-full flex-1 space-y-3">
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs text-white/78">
                  <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" /> Zoom
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                  className="w-full accent-red-accent"
                  aria-label="Zoom de la foto"
                />
              </div>
              <p className="text-[11px] text-white/70">Arrastra la imagen para encuadrarla dentro del círculo.</p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleUpload()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Guardar foto
                </button>
                <button
                  type="button"
                  onClick={resetEditor}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-white/80 transition hover:text-white"
                >
                  <X className="h-4 w-4" /> Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
