import { useState, type ReactNode } from "react";

type ProductImageProps = {
  /** Portada del producto. Sin URL se pinta el respaldo directamente. */
  src?: string | null;
  alt: string;
  className?: string;
  /** Qué mostrar cuando no hay URL o cuando la imagen no termina de cargar. */
  fallback: ReactNode;
  /** La ficha del producto tiene la portada sobre el pliegue y no debe diferirse. */
  loading?: "lazy" | "eager";
};

/**
 * Portada de producto con respaldo ante fallo de carga.
 *
 * Hace falta porque las URLs caducan: las imágenes que sube el admin son URLs
 * firmadas de Supabase Storage con un año de vigencia, y los proveedores también
 * pegan URLs externas que pueden caerse. Sin `onError` el navegador dejaba el
 * icono de imagen rota dentro del catálogo, que se lee como una tienda averiada.
 *
 * Se centraliza aquí justamente para que ninguna superficie nueva se olvide de
 * manejarlo: la tarjeta ya trataba el caso y la ficha del producto no.
 */
export function ProductImage({
  src,
  alt,
  className,
  fallback,
  loading = "lazy",
}: ProductImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  // Se compara contra la URL concreta y no contra un booleano: si el mismo
  // componente pasa a mostrar otro producto, la portada nueva no hereda el fallo
  // de la anterior.
  if (!src || failedSrc === src) return <>{fallback}</>;

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      onError={() => setFailedSrc(src)}
      className={className}
    />
  );
}
