import { useImageCycle } from "@/hooks/useImageCycle";

interface CardImageSlideshowProps {
  images: string[];
  alt: string;
}

/** Crossfade slideshow that cycles every 30s. Pauses off-screen. */
export function CardImageSlideshow({ images, alt }: CardImageSlideshowProps) {
  const { ref, index } = useImageCycle<HTMLDivElement>(images);

  if (images.length === 0) return null;

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-label={`Galería de ${alt}`}>
      {images.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={i === index ? alt : ""}
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-in-out ${
            i === index
              ? "opacity-100 transition-transform duration-700 group-hover:scale-[1.06]"
              : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
