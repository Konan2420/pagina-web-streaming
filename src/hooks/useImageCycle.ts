import { useEffect, useRef, useState } from "react";

const CYCLE_INTERVAL_MS = 30_000;

/**
 * Cycles through an array of images every 30 seconds.
 * Pauses automatically while the element is not in viewport
 * and respects `prefers-reduced-motion`.
 */
export function useImageCycle<T extends HTMLElement>(images: string[]) {
  const ref = useRef<T | null>(null);
  const [index, setIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const reducedMotion = useRef(false);

  useEffect(() => {
    reducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (!ref.current || images.length <= 1) return;

    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      threshold: 0.1,
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1 || !isVisible || reducedMotion.current) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, CYCLE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [images.length, isVisible]);

  return { ref, index, images };
}
