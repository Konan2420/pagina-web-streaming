import { useEffect, useMemo, useRef, useState } from "react";
import { BarChart3, Crown, Gem, Medal, Sparkles, Star, Trophy, Users } from "lucide-react";
import { useAuthState } from "@/hooks/useAuthState";

export type ChampionsRole = "distribuidor" | "proveedor";

export type ChampionEntry = {
  id: string;
  userId?: string;
  displayName: string;
  role: ChampionsRole;
  monthlySales: number;
  monthlyPoints: number;
  avatarUrl?: string | null;
};

export type ChampionLevel = {
  key: string;
  label: string;
  min: number;
  max: number;
  color: string;
};

const MAX_POINTS = 10_000;

const DEMO_DISTRIBUTORS: ChampionEntry[] = [
  {
    id: "demo-distributor-1",
    displayName: "CMD Digital",
    role: "distribuidor",
    monthlySales: 184,
    monthlyPoints: 10_000,
  },
  {
    id: "demo-distributor-2",
    displayName: "Streaming Pro",
    role: "distribuidor",
    monthlySales: 161,
    monthlyPoints: 9_720,
  },
  {
    id: "demo-distributor-3",
    displayName: "Digital Store",
    role: "distribuidor",
    monthlySales: 143,
    monthlyPoints: 8_940,
  },
  {
    id: "demo-distributor-4",
    displayName: "Max Streaming",
    role: "distribuidor",
    monthlySales: 126,
    monthlyPoints: 7_480,
  },
  {
    id: "demo-distributor-5",
    displayName: "Store Plus",
    role: "distribuidor",
    monthlySales: 119,
    monthlyPoints: 6_920,
  },
];

const DEMO_PROVIDERS: ChampionEntry[] = [
  {
    id: "demo-provider-1",
    displayName: "CMD Digital",
    role: "proveedor",
    monthlySales: 178,
    monthlyPoints: 9_860,
  },
  {
    id: "demo-provider-2",
    displayName: "Streaming Pro",
    role: "proveedor",
    monthlySales: 154,
    monthlyPoints: 9_280,
  },
  {
    id: "demo-provider-3",
    displayName: "Digital Store",
    role: "proveedor",
    monthlySales: 138,
    monthlyPoints: 8_410,
  },
  {
    id: "demo-provider-4",
    displayName: "Max Streaming",
    role: "proveedor",
    monthlySales: 121,
    monthlyPoints: 7_260,
  },
  {
    id: "demo-provider-5",
    displayName: "Store Plus",
    role: "proveedor",
    monthlySales: 112,
    monthlyPoints: 6_580,
  },
];

const LEVELS: ChampionLevel[] = [
  { key: "bronze", label: "Bronce", min: 0, max: 1_999, color: "#cd7f32" },
  { key: "silver", label: "Plata", min: 2_000, max: 3_999, color: "#c0c0c0" },
  { key: "gold", label: "Oro", min: 4_000, max: 5_999, color: "#f5b942" },
  { key: "diamond", label: "Diamante", min: 6_000, max: 7_999, color: "#38bdf8" },
  { key: "elite", label: "Élite", min: 8_000, max: 9_499, color: "#a78bfa" },
  { key: "legend", label: "Leyenda", min: 9_500, max: 9_999, color: "#fb7185" },
  {
    key: "champion",
    label: "Campeón",
    min: 10_000,
    max: Number.POSITIVE_INFINITY,
    color: "#ffd700",
  },
];

const PARTICLES = [
  [8, 14, 0.2],
  [18, 62, 0.5],
  [30, 24, 0.8],
  [43, 78, 0.35],
  [57, 12, 0.65],
  [69, 67, 0.4],
  [79, 28, 0.72],
  [91, 53, 0.28],
  [96, 10, 0.55],
  [52, 91, 0.45],
] as const;

function getChampionLevel(points: number): ChampionLevel {
  const safePoints = Math.min(Math.max(Number.isFinite(points) ? points : 0, 0), MAX_POINTS);
  return LEVELS.find((level) => safePoints >= level.min && safePoints <= level.max) ?? LEVELS[0];
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatPoints(points: number) {
  return Math.round(Math.min(Math.max(points, 0), MAX_POINTS)).toLocaleString("es-PE");
}

function ChampionWings() {
  return (
    <svg className="cmd-champions__wings" viewBox="0 0 560 180" aria-hidden="true">
      <path d="M270 154C212 152 120 141 27 89c54-4 103 2 143 20-41-28-75-58-103-94 74 13 132 40 181 91l22 48Z" />
      <path d="M290 154c58-2 150-13 243-65-54-4-103 2-143 20 41-28 75-58 103-94-74 13-132 40-181 91l-22 48Z" />
    </svg>
  );
}

function PodiumCard({ entry, position }: { entry: ChampionEntry; position: 1 | 2 | 3 }) {
  const level = getChampionLevel(entry.monthlyPoints);
  const rankClass = `cmd-champions__podium-card--rank-${position}`;
  return (
    <article className={`cmd-champions__podium-card ${rankClass}`}>
      <div className="cmd-champions__podium-topline">
        <span className="cmd-champions__rank-number">#{position}</span>
        {position === 1 ? <Crown aria-hidden="true" /> : <Medal aria-hidden="true" />}
      </div>
      {position === 1 && <ChampionWings />}
      <div className="cmd-champions__avatar" style={{ borderColor: level.color }}>
        {entry.avatarUrl ? <img src={entry.avatarUrl} alt="" /> : initials(entry.displayName)}
      </div>
      <h3>{entry.displayName}</h3>
      <p className="cmd-champions__podium-role">
        {entry.role === "proveedor" ? "Proveedor" : "Distribuidor"}
      </p>
      <strong>
        {formatPoints(entry.monthlyPoints)} <small>pts</small>
      </strong>
      <span className="cmd-champions__level-pill" style={{ color: level.color }}>
        {level.label}
      </span>
      <div className="cmd-champions__pedestal" aria-hidden="true">
        <span>{position}</span>
      </div>
    </article>
  );
}

export type ChampionsRankingProps = {
  distributorRanking?: ChampionEntry[];
  providerRanking?: ChampionEntry[];
  userProgress?: ChampionEntry | null;
};

export function ChampionsRanking({
  distributorRanking = DEMO_DISTRIBUTORS,
  providerRanking = DEMO_PROVIDERS,
  userProgress = null,
}: ChampionsRankingProps) {
  const { session } = useAuthState();
  const [activeRole, setActiveRole] = useState<ChampionsRole>("distribuidor");
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const ranking = useMemo(() => {
    const source = activeRole === "distribuidor" ? distributorRanking : providerRanking;
    return [...source]
      .sort((a, b) => b.monthlyPoints - a.monthlyPoints)
      .slice(0, 5)
      .map((entry, index) => ({
        ...entry,
        monthlyPoints: Math.min(Math.max(entry.monthlyPoints, 0), MAX_POINTS),
        rankPosition: index + 1,
      }));
  }, [activeRole, distributorRanking, providerRanking]);
  const winner = ranking[0];
  const progress = userProgress ? Math.min(Math.max(userProgress.monthlyPoints, 0), MAX_POINTS) : 0;
  const progressLevel = getChampionLevel(progress);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="cmd-champions-ranking"
      ref={sectionRef}
      className={`cmd-champions ${isVisible ? "is-visible" : ""}`}
      aria-labelledby="cmd-champions-title"
    >
      <div className="cmd-champions__particles" aria-hidden="true">
        {PARTICLES.map(([left, top, delay], index) => (
          <span
            key={index}
            style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${delay}s` }}
          />
        ))}
      </div>
      <header className="cmd-champions__header">
        <div className="cmd-champions__eyebrow">
          <Crown aria-hidden="true" /> Ranking mensual de ganadores
        </div>
        <h2 id="cmd-champions-title">
          CMD <span>CHAMPIONS</span>
        </h2>
        <p>Reconocemos el esfuerzo que convierte cada venta en un resultado extraordinario.</p>
        <div className="cmd-champions__maximum">
          <Star aria-hidden="true" /> Puntos máximos al mes:{" "}
          <strong>{formatPoints(MAX_POINTS)}</strong>
        </div>
        <small className="cmd-champions__demo-note">
          Vista previa · preparada para datos mensuales de Supabase
        </small>
      </header>

      <div className="cmd-champions__tabs" role="tablist" aria-label="Tipo de ranking">
        {(["distribuidor", "proveedor"] as const).map((role) => (
          <button
            key={role}
            type="button"
            role="tab"
            aria-selected={activeRole === role}
            onClick={() => setActiveRole(role)}
          >
            <Users aria-hidden="true" />{" "}
            {role === "distribuidor" ? "Distribuidores" : "Proveedores"}
          </button>
        ))}
      </div>

      <div className="cmd-champions__stage">
        <div className="cmd-champions__podium" aria-label="Podio de ganadores">
          {ranking.slice(0, 3).map((entry, index) => (
            <PodiumCard
              key={entry.id}
              entry={entry}
              position={([1, 2, 3][index] ?? 3) as 1 | 2 | 3}
            />
          ))}
        </div>
        <aside className="cmd-champions__levels" aria-label="Escala de niveles">
          <div className="cmd-champions__levels-title">
            <BarChart3 aria-hidden="true" /> Escala de niveles
          </div>
          {LEVELS.map((level) => (
            <div
              className="cmd-champions__level"
              key={level.key}
              style={{ "--level-color": level.color } as React.CSSProperties}
            >
              <span className="cmd-champions__level-icon">
                {level.key === "champion" ? (
                  <Crown aria-hidden="true" />
                ) : level.key === "diamond" ? (
                  <Gem aria-hidden="true" />
                ) : (
                  <Star aria-hidden="true" />
                )}
              </span>
              <span>
                <b>{level.label}</b>
                <small>
                  {formatPoints(level.min)}
                  {level.max < Number.POSITIVE_INFINITY ? ` – ${formatPoints(level.max)}` : ""} pts
                </small>
              </span>
            </div>
          ))}
        </aside>
      </div>

      <div className="cmd-champions__lower-grid">
        <div className="cmd-champions__leaderboard">
          <div className="cmd-champions__panel-heading">
            <Trophy aria-hidden="true" />
            <h3>Top 5</h3>
            <span>{activeRole === "distribuidor" ? "Distribuidores" : "Proveedores"}</span>
          </div>
          <div className="cmd-champions__leaderboard-head">
            <span>#</span>
            <span>Tienda / equipo</span>
            <span>Ventas</span>
            <span>Puntos</span>
            <span>Nivel</span>
          </div>
          {ranking.map((entry, index) => {
            const level = getChampionLevel(entry.monthlyPoints);
            return (
              <div
                className={`cmd-champions__leaderboard-row ${index === 0 ? "is-winner" : ""}`}
                key={entry.id}
              >
                <strong>{index + 1}</strong>
                <span className="cmd-champions__team">
                  <span>{initials(entry.displayName)}</span>
                  {entry.displayName}
                </span>
                <span>{entry.monthlySales}</span>
                <b>{formatPoints(entry.monthlyPoints)}</b>
                <span style={{ color: level.color }}>{level.label}</span>
              </div>
            );
          })}
        </div>
        {winner && (
          <article className="cmd-champions__winner-card">
            <div className="cmd-champions__winner-glow" aria-hidden="true" />
            <div className="cmd-champions__panel-heading">
              <Crown aria-hidden="true" />
              <h3>Ganador del mes</h3>
            </div>
            <div className="cmd-champions__winner-trophy">
              <Trophy aria-hidden="true" />
            </div>
            <strong>{winner.displayName}</strong>
            <span>{formatPoints(winner.monthlyPoints)} pts</span>
            <small>Trofeo + alas doradas</small>
          </article>
        )}
      </div>

      {session && (
        <div className="cmd-champions__progress-card">
          <div>
            <Sparkles aria-hidden="true" />
            <div>
              <strong>Mi progreso</strong>
              <span>
                {userProgress
                  ? `${userProgress.displayName} · ${progressLevel.label}`
                  : "Tu progreso aparecerá al conectar el ranking"}
              </span>
            </div>
          </div>
          {userProgress && (
            <>
              <b>
                {formatPoints(progress)} / {formatPoints(MAX_POINTS)} pts
              </b>
              <div className="cmd-champions__progress-track">
                <span
                  style={{
                    width: `${(progress / MAX_POINTS) * 100}%`,
                    background: progressLevel.color,
                  }}
                />
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}

export default ChampionsRanking;
