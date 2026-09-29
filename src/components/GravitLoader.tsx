export function GravitLoader({ label = "Cargando" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-32 w-full items-center justify-center"
    >
      <div className="ld-ball" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
