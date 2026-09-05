import type { ReactNode } from "react";

/** 44×44 circular icon button with accessible label. */
export function IconBtn({
  children,
  label,
  onClick,
}: {
  children: ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-foreground transition hover:border-primary/60 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
    >
      {children}
    </button>
  );
}
