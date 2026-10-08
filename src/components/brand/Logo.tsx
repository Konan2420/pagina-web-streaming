import type { SVGProps } from "react";
import { cn } from "@/lib/utils";
import { LION_PATH, WORDMARK_PATHS } from "./logo-paths";

type LogoProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  variant?: "full" | "compact";
};

/** One inline mark for all app surfaces. CSS controls its color in both themes. */
export function Logo({ variant = "full", className, ...props }: LogoProps) {
  const decorative = props["aria-hidden"] === true || props["aria-hidden"] === "true";

  return (
    <svg
      {...props}
      viewBox={variant === "compact" ? "0 0 1157 1407" : "284 74 908 1294"}
      fill="none"
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : (props["aria-label"] ?? "CMD Streaming")}
      className={cn("cmd-logo", className)}
    >
      {variant === "compact" ? (
        <path fill="currentColor" fillRule="evenodd" d={LION_PATH} />
      ) : (
        <>
          <g transform="translate(304.5 93.75) scale(.75)">
            <path fill="currentColor" fillRule="evenodd" d={LION_PATH} />
          </g>
          <g transform="translate(394 1197)" fill="currentColor">
            {WORDMARK_PATHS.map(({ transform, d }) => (
              <g key={transform} transform={transform}>
                <path d={d} />
              </g>
            ))}
          </g>
        </>
      )}
    </svg>
  );
}
