/** Hero banner with mosaic backdrop and greeting. */
export function StoreBanner({ authed, displayName }: { authed: boolean; displayName: string }) {
  const platforms = [
    "Netflix",
    "Disney+",
    "HBO",
    "Prime",
    "YouTube",
    "Apple TV",
    "Spotify",
    "Hulu",
    "Paramount+",
    "Peacock",
    "ESPN",
    "Crunchyroll",
    "DAZN",
    "Star+",
    "Discovery",
    "Max",
  ];
  return (
    <div className="relative h-52 sm:h-64 md:h-72 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-red-accent/40 via-violet/40 to-black" />
      <div className="absolute inset-0 grid grid-cols-6 sm:grid-cols-8 gap-2 p-4 opacity-40">
        {platforms.map((n, i) => (
          <div
            key={i}
            className="rounded-lg bg-white/5 border border-white/10 grid place-items-center text-[10px] sm:text-xs text-white/70 font-semibold px-1"
          >
            {n}
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-background" />
      <div className="relative h-full grid place-items-center px-4 pt-10 sm:pt-0 text-center">
        <div className="max-w-2xl">
          <h1 className="font-display text-2xl sm:text-4xl md:text-5xl uppercase text-white tracking-wide leading-tight">
            {authed ? (
              <>
                Hola, <span className="text-gradient-violet break-words">{displayName}</span>
              </>
            ) : (
              <>
                CMD <span className="text-gradient-violet">Streaming</span>
              </>
            )}
          </h1>
          <p className="mt-2 text-xs sm:text-base text-white/80 max-w-xl mx-auto">
            {authed
              ? "Bienvenido a tu panel — compra, gestiona tus pedidos y actualiza tus datos."
              : "Disfruta sin límites de todo tu entretenimiento favorito"}
          </p>
        </div>
      </div>
    </div>
  );
}
