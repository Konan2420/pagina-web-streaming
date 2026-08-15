/** Catálogo de avatares profesionales predefinidos para proveedores. */
export type ProviderAvatar = {
  id: string;
  /** Imagen a resolución completa (512x512). */
  url: string;
  /** Miniatura optimizada para la galería (128x128). */
  thumb: string;
  label: string;
  recommended?: boolean;
};

const FILES = [
  { id: "provider-avatar-01", label: "Ejecutivo Proveedor", recommended: true },
  { id: "provider-avatar-02", label: "Ejecutivo Neón" },
  { id: "provider-avatar-03", label: "Ejecutiva Digital", recommended: true },
  { id: "provider-avatar-04", label: "Ejecutivo Senior" },
  { id: "provider-avatar-05", label: "Ejecutivo Clásico" },
] as const;

export const PROVIDER_AVATARS: ProviderAvatar[] = FILES.map((f) => ({
  id: f.id,
  url: `/provider-avatars/${f.id}.png`,
  thumb: `/provider-avatars/${f.id}-128.png`,
  label: f.label,
  recommended: "recommended" in f ? Boolean(f.recommended) : false,
}));

export function isPredefinedAvatar(url: string | null | undefined) {
  return !!url && PROVIDER_AVATARS.some((a) => a.url === url);
}
