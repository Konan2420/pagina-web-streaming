import { Link } from "@tanstack/react-router";
import { platformPages } from "@/components/landing/platform-pages";
import { navLinks } from "./data";

const LEGAL = ["Términos y condiciones", "Política de privacidad", "Reembolsos"];

/** Landing footer with brand, navigation and legal links. */
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <img
              src="/cmd-logo.png"
              alt="CMD Streaming"
              className="h-10 w-10 rounded-xl object-contain opacity-90 transition-opacity hover:opacity-100"
            />
          </div>
          <p className="mt-5 text-sm text-white/70 max-w-xs">
            Entretenimiento premium sin complicaciones: cine, series, deportes y TV en vivo en todos
            tus dispositivos.
          </p>
        </div>

        <nav aria-label="Navegación del pie">
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-white/55">Navegación</h2>
          <ul className="mt-4 space-y-2.5">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  className="text-sm text-white/75 hover:text-white transition-colors"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Plataformas">
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-white/55">Plataformas</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <Link
                to="/plataformas"
                className="text-sm text-white/75 hover:text-white transition-colors"
              >
                Todas las plataformas
              </Link>
            </li>
            {platformPages.slice(0, 4).map((p) => (
              <li key={p.slug}>
                <Link
                  to="/plataformas/$slug"
                  params={{ slug: p.slug }}
                  className="text-sm text-white/75 hover:text-white transition-colors"
                >
                  {p.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/tienda"
                className="text-sm text-white/75 hover:text-white transition-colors"
              >
                Tienda
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-white/55">Legal</h2>
          <ul className="mt-4 space-y-2.5">
            {LEGAL.map((l) => (
              <li key={l} className="text-sm text-white/75">
                {l}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-[11px] uppercase tracking-[0.28em] text-white/55">Soporte</h2>
          <p className="mt-4 text-sm text-white/75">
            Atención 24/7 por WhatsApp. Respondemos en minutos, todos los días del año.
          </p>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-xs text-white/60">
            © 2026 CMD Streaming. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
