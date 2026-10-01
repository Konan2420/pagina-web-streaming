import { ArrowDown, Crown, Sparkles, Trophy } from "lucide-react";

function RankingWings() {
  return (
    <svg className="cmd-champions-hero__wings" viewBox="0 0 620 230" aria-hidden="true">
      <path d="M300 201C236 195 126 177 17 106c64-4 122 4 169 27C137 95 97 53 70 16c86 16 155 55 210 123l20 62Z" />
      <path d="M320 201c64-6 174-24 283-95-64-4-122 4-169 27 49-38 89-80 116-117-86 16-155 55-210 123l-20 62Z" />
      <path
        className="cmd-champions-hero__wing-line"
        d="M270 165C207 130 149 97 98 71M350 165c63-35 121-68 172-94M251 179C196 153 157 130 124 106M369 179c55-26 94-49 127-73"
      />
    </svg>
  );
}

export function ChampionsHeroBanner() {
  const scrollToRanking = () => {
    document
      .getElementById("cmd-champions-ranking")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="cmd-champions-hero" aria-labelledby="cmd-champions-hero-title">
      <div className="cmd-champions-hero__particles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="cmd-champions-hero__copy">
        <div className="cmd-champions-hero__eyebrow">
          <Sparkles aria-hidden="true" /> Competencia mensual
        </div>
        <h2 id="cmd-champions-hero-title">
          CMD <span>CHAMPIONS</span>
        </h2>
        <p>Tu esfuerzo también merece un trofeo.</p>
        <button type="button" className="cmd-champions-hero__cta" onClick={scrollToRanking}>
          Ver ranking <ArrowDown aria-hidden="true" />
        </button>
      </div>
      <div className="cmd-champions-hero__trophy" aria-hidden="true">
        <RankingWings />
        <div className="cmd-champions-hero__crown">
          <Crown />
        </div>
        <div className="cmd-champions-hero__trophy-orb">
          <Trophy />
        </div>
      </div>
      <div className="cmd-champions-hero__hint">
        <span>Distribuidores</span>
        <i />
        <span>Proveedores</span>
      </div>
    </section>
  );
}

export default ChampionsHeroBanner;
