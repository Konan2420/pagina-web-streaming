import { useEffect, useMemo, useState } from "react";

const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
};

export const FallingStars = () => {
  const hydrated = useHydrated();
  const stars = useMemo(() => {
    // Keep the ambient detail subtle. More particles have a noticeable cost on entry-level phones.
    return Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
      size: `${1 + Math.random() * 2}px`,
    }));
  }, []);

  if (!hydrated) return null;

  return (
    <div
      aria-hidden="true"
      className="ambient-falling-stars fixed inset-0 pointer-events-none z-[-5] overflow-hidden"
    >
      {stars.map((star) => (
        <div
          key={star.id}
          className={`absolute bg-white rounded-full animate-falling-star ${star.id >= 10 ? "hidden sm:block" : ""}`}
          style={{
            left: star.left,
            top: "-10px",
            width: star.size,
            height: star.size,
            animationDelay: star.delay,
            animationDuration: star.duration,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
};

export const FuturisticBackground = () => {
  return (
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-[-10] overflow-hidden">
      {/* Grid Pattern */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] sm:block" />

      {/* Glow Arcs */}
      <div className="absolute top-0 left-1/2 hidden h-[40%] w-[120%] -translate-x-1/2 rounded-[100%] bg-red-accent/10 blur-3xl animate-arc sm:block" />
      <div
        className="absolute bottom-0 left-1/2 hidden h-[30%] w-[100%] -translate-x-1/2 rounded-[100%] bg-violet-2/5 blur-3xl animate-arc sm:block"
        style={{ animationDelay: "-3s" }}
      />

      {/* Scanline effect */}
      <div className="absolute inset-0 hidden bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20 md:block" />
    </div>
  );
};
