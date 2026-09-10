declare module "canvas-confetti" {
  export interface Options {
    particleCount?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x?: number;
      y?: number;
    };
    colors?: string[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export interface CreateTypes {
    (options?: Options): Promise<null> | null;
    reset(): void;
  }

  const confetti: CreateTypes & {
    create(canvas?: HTMLCanvasElement | null, options?: Options): CreateTypes;
  };

  export default confetti;
}
