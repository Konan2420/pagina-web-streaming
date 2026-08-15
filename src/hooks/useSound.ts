import { useCallback, useRef } from "react";

type WindowWithWebkitAudioContext = Window & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContextConstructor() {
  return window.AudioContext || (window as WindowWithWebkitAudioContext).webkitAudioContext;
}

export const useFuturisticSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);

  const playHover = useCallback(() => {
    try {
      if (!audioCtx.current) {
        const AudioContextConstructor = getAudioContextConstructor();
        if (!AudioContextConstructor) return;
        audioCtx.current = new AudioContextConstructor();
      }

      if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }

      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Futuristic "blip" sound
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }, []);

  const playClick = useCallback(() => {
    try {
      if (!audioCtx.current) {
        const AudioContextConstructor = getAudioContextConstructor();
        if (!AudioContextConstructor) return;
        audioCtx.current = new AudioContextConstructor();
      }

      if (audioCtx.current.state === "suspended") {
        audioCtx.current.resume();
      }

      const ctx = audioCtx.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Quick techy click/confirm
      osc.type = "square";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Audio play failed:", e);
    }
  }, []);

  return { playHover, playClick };
};
