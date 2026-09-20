import { useEffect, useState } from "react";

/** Oyentes activos y el único intervalo que los alimenta. */
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

/**
 * Fuerza un re-render por minuto para que los textos relativos ("hace 3 min") no
 * se queden congelados en el valor que tenían al montar el componente.
 *
 * El intervalo es compartido: cien tarjetas suscritas siguen usando un solo
 * temporizador, y se apaga en cuanto se desmonta la última. No devuelve la hora
 * a propósito — cada consumidor sigue llamando a `Date.now()` al renderizar, que
 * es lo que ya hacía, así que el render del servidor y la hidratación no cambian.
 */
export function useMinuteTick() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const listener = () => forceRender((value) => value + 1);
    listeners.add(listener);

    if (timer === null) {
      timer = setInterval(() => {
        listeners.forEach((notify) => notify());
      }, 60_000);
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };
  }, []);
}
