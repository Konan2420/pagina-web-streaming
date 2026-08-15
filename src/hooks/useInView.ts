import { useEffect, useRef, useState } from "react";

/** One-shot intersection observer. `seen` flips to true the first time the ref intersects. */
export function useInView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current || seen) return;
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && setSeen(true), {
      threshold,
    });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen, threshold]);
  return { ref, seen };
}
