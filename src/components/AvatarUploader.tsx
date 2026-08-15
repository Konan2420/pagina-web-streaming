import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, Upload, X, ZoomIn } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  userId: string;
  fallbackInitials: string;
  onUploaded?: (signedUrl: string) => void;
};

const OUTPUT_SIZE = 512;

export function AvatarUploader({ userId, fallbackInitials, onUploaded }: Props) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const dragStart = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const path = `${userId}/avatar.png`;

  // Load current avatar via signed URL
  const loadCurrent = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
      if (!error && data?.signedUrl) {
        setCurrentUrl(`${data.signedUrl}&t=${Date.now()}`);
      }
    } catch {
      setCurrentUrl(null);
    }
  }, [path]);

  useEffect(() => {
    loadCurrent();
  }, [loadCurrent]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast.error("Selecciona una imagen");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Máximo 8MB");
      return;
    }
    setFile(f);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    const reader = new FileReader();
    reader.onload = () => setImgSrc(String(reader.result));
    reader.readAsDataURL(f);
  }

  function cancelEdit() {
    setFile(null);
    setImgSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setOffset({ x: dragStart.current.ox + dx, y: dragStart.current.oy + dy });
  }
  function onPointerUp(e: React.PointerEvent) {
    setDragging(false);
    dragStart.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  async function handleUpload() {
    if (!imgSrc || !imgRef.current) return;
    setUploading(true);
    try {
      const img = imgRef.current;
      const box = 320; // preview box size in px
      // Compute source rect from displayed image
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      // Base cover fit
      const baseScale = Math.max(box / natW, box / natH);
      const scale = baseScale * zoom;
      const drawW = natW * scale;
      const drawH = natH * scale;
      // top-left of image in the preview box (centered + offset)
      const left = (box - drawW) / 2 + offset.x;
      const top = (box - drawH) / 2 + offset.y;
      // The crop area is the box (0,0,box,box). Convert to source coords.
      const sx = (0 - left) / scale;
      const sy = (0 - top) / scale;
      const sSize = box / scale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas no soportado");
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob: Blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Error al procesar"))),
          "image/png",
          0.92,
        ),
      );

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/png" });
      if (error) throw error;

      const { data: signed, error: signedError } = await supabase.storage
        .from("avatars")
        .createSignedUrl(path, 3600);
      if (signedError) throw signedError;
      const url = signed?.signedUrl ? `${signed.signedUrl}&t=${Date.now()}` : null;
      if (url) setCurrentUrl(url);
      onUploaded?.(url ?? "");
      toast.success("Foto de perfil actualizada");
      cancelEdit();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "No se pudo subir";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4">
      <label className="text-xs text-white/78 uppercase tracking-wider">Foto de perfil</label>

      {!imgSrc ? (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-white/[0.04] grid place-items-center shrink-0">
            {currentUrl ? (
              <img
                src={currentUrl}
                alt="Foto de perfil del usuario"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white font-bold text-xl">{fallbackInitials || "US"}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:border-violet-2/40 text-white text-xs font-semibold transition"
            >
              <Camera className="w-4 h-4" />
              {currentUrl ? "Cambiar foto" : "Subir foto"}
            </button>
            <p className="text-[10px] text-white/62">PNG o JPG · máx 8MB · recorte cuadrado</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={onPickFile}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
          <div className="flex items-start gap-4 flex-col sm:flex-row">
            <div
              className="relative w-[320px] h-[320px] max-w-full rounded-full overflow-hidden bg-black/50 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing mx-auto"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <img
                ref={imgRef}
                src={imgSrc}
                alt="Vista previa de tu foto de perfil"
                draggable={false}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                  transformOrigin: "center center",
                  minWidth: "100%",
                  minHeight: "100%",
                  maxWidth: "none",
                  objectFit: "cover",
                  pointerEvents: "none",
                }}
              />
              <div className="absolute inset-0 ring-2 ring-white/20 rounded-full pointer-events-none" />
            </div>

            <div className="flex-1 w-full space-y-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-white/78 mb-2">
                  <ZoomIn className="w-3.5 h-3.5" /> Zoom
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-red-accent"
                />
              </div>
              <p className="text-[11px] text-white/70">
                Arrastra la imagen para ajustar la posición.
              </p>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-violet text-white text-xs font-semibold disabled:opacity-60 hover:scale-[1.02] transition"
                >
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Guardar foto
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-xs font-semibold hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
