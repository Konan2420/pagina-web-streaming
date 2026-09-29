export function CmdProgressBar({ className = "" }: { className?: string }) {
  return (
    <div className={`cmd-progress-track ${className}`} role="status" aria-label="Cargando">
      <div className="cmd-progress-segment" />
    </div>
  );
}
