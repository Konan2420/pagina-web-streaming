/**
 * Fondo global de la landing/tienda.
 *
 * Usa encuadres del mismo arte para conservar los detalles en escritorio y móvil.
 */
export function PlatformBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#050304]"
    >
      <picture className="absolute inset-0 block">
        <source media="(min-width: 768px)" srcSet="/landing/cmd-red-background-desktop.png" />
        <img
          src="/landing/cmd-red-background-mobile.png"
          alt=""
          className="h-full w-full object-cover object-center opacity-90 md:opacity-80"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,3,4,0.42),rgba(5,3,4,0.3)_35%,rgba(5,3,4,0.58))]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,3,4,0.58)_0%,rgba(5,3,4,0.2)_58%,rgba(5,3,4,0.45)_100%)]" />
    </div>
  );
}
