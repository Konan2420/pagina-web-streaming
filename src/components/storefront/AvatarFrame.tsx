import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AvatarFrameKey =
  | "neon"
  | "prisma-orbit"
  | "aurora-halo"
  | "fire"
  | "frost-halo"
  | "aqua-tide"
  | "verdant-bloom"
  | "gold"
  | "petal-wreath"
  | "moon-garden"
  | "crystal-vine"
  | "celebration-ribbon"
  | "candy-spark"
  | "winter-glow"
  | "cat-ears"
  | "fox-ears"
  | "bunny-ears"
  | "bear-hood";

export type AvatarFrameCategory = "animados" | "elementales" | "naturaleza" | "festivos" | "animales";
type AvatarFrameKind = "orbit" | "elemental" | "nature" | "festive" | "animal";
type AvatarFrameAnimation = "rotate" | "pulse" | "particles" | "glow" | "float";

export type AvatarFrameDefinition = {
  key: AvatarFrameKey;
  name: string;
  category: AvatarFrameCategory;
  kind: AvatarFrameKind;
  animation: AvatarFrameAnimation;
  colors: readonly [string, string];
};

export const avatarFrameCatalog: readonly AvatarFrameDefinition[] = [
  { key: "neon", name: "Neón Circuit", category: "animados", kind: "orbit", animation: "glow", colors: ["#22d3ee", "#2563eb"] },
  { key: "prisma-orbit", name: "Órbita Prisma", category: "animados", kind: "orbit", animation: "rotate", colors: ["#f0abfc", "#22d3ee"] },
  { key: "aurora-halo", name: "Halo Aurora", category: "animados", kind: "orbit", animation: "pulse", colors: ["#a7f3d0", "#c084fc"] },
  { key: "fire", name: "Anillo Ember", category: "elementales", kind: "elemental", animation: "glow", colors: ["#fb923c", "#ef4444"] },
  { key: "frost-halo", name: "Halo Escarcha", category: "elementales", kind: "elemental", animation: "float", colors: ["#bae6fd", "#818cf8"] },
  { key: "aqua-tide", name: "Marea Aqua", category: "elementales", kind: "elemental", animation: "particles", colors: ["#67e8f9", "#0ea5e9"] },
  { key: "verdant-bloom", name: "Florecer Verde", category: "elementales", kind: "elemental", animation: "pulse", colors: ["#86efac", "#16a34a"] },
  { key: "gold", name: "Corona Solar", category: "elementales", kind: "elemental", animation: "glow", colors: ["#fde68a", "#f59e0b"] },
  { key: "petal-wreath", name: "Guirnalda de Pétalos", category: "naturaleza", kind: "nature", animation: "float", colors: ["#f9a8d4", "#c084fc"] },
  { key: "moon-garden", name: "Jardín Lunar", category: "naturaleza", kind: "nature", animation: "particles", colors: ["#c4b5fd", "#60a5fa"] },
  { key: "crystal-vine", name: "Enredadera Cristal", category: "naturaleza", kind: "nature", animation: "rotate", colors: ["#a7f3d0", "#2dd4bf"] },
  { key: "celebration-ribbon", name: "Cinta Celebración", category: "festivos", kind: "festive", animation: "float", colors: ["#fda4af", "#facc15"] },
  { key: "candy-spark", name: "Destello Candy", category: "festivos", kind: "festive", animation: "pulse", colors: ["#f0abfc", "#fb7185"] },
  { key: "winter-glow", name: "Brillo Invernal", category: "festivos", kind: "festive", animation: "glow", colors: ["#e0f2fe", "#60a5fa"] },
  { key: "cat-ears", name: "Orejas Gato", category: "animales", kind: "animal", animation: "pulse", colors: ["#f9a8d4", "#c084fc"] },
  { key: "fox-ears", name: "Orejas Zorro", category: "animales", kind: "animal", animation: "glow", colors: ["#fdba74", "#f97316"] },
  { key: "bunny-ears", name: "Orejas Conejo", category: "animales", kind: "animal", animation: "float", colors: ["#fbcfe8", "#f9a8d4"] },
  { key: "bear-hood", name: "Capucha Oso", category: "animales", kind: "animal", animation: "pulse", colors: ["#d6d3d1", "#78716c"] },
] as const;

const avatarFrameByKey = new Map(avatarFrameCatalog.map((frame) => [frame.key, frame]));

export function getAvatarFrame(key?: string | null) {
  return key ? avatarFrameByKey.get(key as AvatarFrameKey) ?? null : null;
}

function FrameArtwork({ frame }: { frame: AvatarFrameDefinition }) {
  const [primary, secondary] = frame.colors;
  const motionClass = `cmd-avatar-frame-${frame.animation}`;
  return (
    <svg viewBox="0 0 120 120" className="cmd-avatar-frame-art" aria-hidden="true" focusable="false">
      <g className={motionClass}>
        <circle cx="60" cy="60" r="52" fill="none" stroke={primary} strokeWidth="4" strokeLinecap="round" strokeDasharray={frame.kind === "orbit" ? "26 10 4 8" : "94 12"} />
        <circle cx="60" cy="60" r="47" fill="none" stroke={secondary} strokeWidth="2" opacity="0.78" strokeDasharray={frame.kind === "elemental" ? "3 8" : "18 12"} />
        {frame.kind === "orbit" && (
          <>
            <ellipse cx="60" cy="60" rx="55" ry="19" fill="none" stroke={secondary} strokeWidth="1.5" opacity="0.8" />
            <circle cx="20" cy="60" r="3" fill={primary} />
            <circle cx="100" cy="60" r="2.5" fill={secondary} />
          </>
        )}
        {frame.kind === "elemental" && (
          <>
            <path d="M13 70c8-12 10-21 5-31 14 6 17 16 13 26 9-7 15-8 22-7-8 11-17 20-35 22Z" fill={primary} opacity="0.7" />
            <path d="M107 70c-8-12-10-21-5-31-14 6-17 16-13 26-9-7-15-8-22-7 8 11 17 20 35 22Z" fill={secondary} opacity="0.62" />
          </>
        )}
        {frame.kind === "nature" && (
          <>
            <path d="M18 38c13 2 18 9 17 19-10 1-17-5-17-19Zm84 0c-13 2-18 9-17 19 10 1 17-5 17-19Z" fill={primary} opacity="0.85" />
            <path d="M23 83c9-11 17-12 24-6-4 10-13 14-24 6Zm74 0c-9-11-17-12-24-6 4 10 13 14 24 6Z" fill={secondary} opacity="0.75" />
          </>
        )}
        {frame.kind === "festive" && (
          <>
            <path d="M16 24l8 7-10 4Zm88 0-8 7 10 4Z" fill={primary} />
            <circle cx="27" cy="94" r="3" fill={secondary} />
            <circle cx="93" cy="94" r="3" fill={primary} />
            <path d="M41 12l2 7m36-7-2 7" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
          </>
        )}
        {frame.kind === "animal" && (
          <>
            <path d="M20 35 25 9l20 23Z" fill={primary} opacity="0.9" />
            <path d="m100 35-5-26-20 23Z" fill={secondary} opacity="0.9" />
            <path d="M26 27 28 17l10 14Zm68 0-2-10-10 14Z" fill="#0f172a" opacity="0.45" />
          </>
        )}
        <circle className="cmd-avatar-frame-spark" cx="31" cy="28" r="2" fill={primary} />
        <circle className="cmd-avatar-frame-spark cmd-avatar-frame-spark-delay" cx="89" cy="82" r="1.8" fill={secondary} />
      </g>
    </svg>
  );
}

export function AvatarFrame({ frameKey, children, className }: { frameKey?: string | null; children: ReactNode; className?: string }) {
  const frame = getAvatarFrame(frameKey);
  return (
    <div className={cn("cmd-avatar-frame-shell", className)}>
      <div className="relative z-0 h-full w-full overflow-hidden rounded-full">{children}</div>
      {frame && <FrameArtwork frame={frame} />}
    </div>
  );
}
