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
      className="w-11 h-11 rounded-full bg-white/[0.04] border border-white/10 grid place-items-center text-white/80 hover:text-white hover:border-violet-2/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70"
    >
      {children}
    </button>
  );
}
