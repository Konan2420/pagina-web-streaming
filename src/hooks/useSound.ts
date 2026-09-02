import { useCallback, useRef } from "react";

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor() {
  return window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
}

function createAudioContext(): AudioContext | null {
  const AudioContextConstructor = getAudioContextConstructor();
  return AudioContextConstructor ? new AudioContextConstructor() : null;
}

function playTone(
  context: AudioContext,
  type: OscillatorType,
  from: number,
  to: number,
  duration: number,
  volume: number,
) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(from, context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(to, context.currentTime + duration);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

export const useFuturisticSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);

  const playHover = useCallback(() => {
    try {
      const ctx = audioCtx.current;
      // Hover no es un gesto de usuario válido para Chrome. El contexto solo
      // se crea desde playClick y nunca se reanuda desde aquí.
      if (!ctx || ctx.state !== "running") return;
      playTone(ctx, "sine", 800, 400, 0.1, 0.15);
    } catch {
      // El sonido es una mejora opcional y no debe afectar la interfaz.
    }
  }, []);

  const playClick = useCallback(() => {
    try {
      const ctx = audioCtx.current ?? createAudioContext();
      if (!ctx) return;
      audioCtx.current = ctx;

      const play = () => {
        if (ctx.state !== "running") return;
        playTone(ctx, "square", 1200, 600, 0.05, 0.1);
      };

      if (ctx.state === "suspended") {
        // Este callback se ejecuta desde click/tap/Enter. La promesa se maneja
        // explícitamente para que una política del navegador no genere ruido
        // en consola ni rompa los botones.
        void ctx.resume().then(play).catch(() => undefined);
        return;
      }

      play();
    } catch {
      // El sonido es una mejora opcional y no debe afectar la interfaz.
    }
  }, []);

  return { playHover, playClick };
};
