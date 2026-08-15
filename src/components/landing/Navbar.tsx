import { useEffect, useState } from "react";
import { Menu, Shield, User, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { navLinks } from "./data";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useIsAdmin } from "@/hooks/useIsAdmin";

/** Sticky top navigation for the landing page. */
export function Navbar({ onOpenAuth }: { onOpenAuth?: (mode?: "login" | "signup") => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const track = useAnalytics();
  const { isAuthorized } = useIsAdmin();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    const mql = window.matchMedia("(min-width: 1024px)");
    const onChange = () => mql.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mql.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mql.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background/95 sm:bg-background/80 border-b border-white/5 sm:backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Navegación principal"
        className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-5 lg:px-8 py-3 sm:py-3.5"
      >
        <a
          href="#inicio"
          aria-label="CMD Streaming - Inicio"
          className="group flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <img
            src="/favicon.png"
            alt="CMD Streaming"
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-contain transition-transform group-hover:scale-105"
          />
        </a>

        <ul className="hidden lg:flex items-center gap-7 text-sm text-white/80">
          {navLinks.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                aria-current={l.active ? "page" : undefined}
                className={`relative py-1 rounded-sm hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${l.active ? "text-white" : ""}`}
              >
                {l.label}
                {l.active && (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full gradient-violet"
                  />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {isAuthorized && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary text-primary text-sm hover:bg-primary/10 transition-all"
            >
              <Shield className="w-4 h-4" />
              Panel Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              track("cta_click", { eventName: "navbar_login", metadata: { location: "navbar" } });
              onOpenAuth?.("login");
            }}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet/50 text-white text-sm hover:border-violet hover:bg-violet/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <User aria-hidden="true" className="w-4 h-4" />
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => {
              track("cta_click", { eventName: "navbar_signup", metadata: { location: "navbar" } });
              onOpenAuth?.("signup");
            }}
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-violet text-white text-sm font-semibold hover:scale-[1.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Crear cuenta
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden inline-flex items-center justify-center min-w-11 min-h-11 p-2 rounded-lg text-white hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            {menuOpen ? (
              <X aria-hidden="true" className="w-6 h-6" />
            ) : (
              <Menu aria-hidden="true" className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="mobile-menu"
          className="lg:hidden border-t border-white/5 bg-background/95 pb-safe"
        >
          <ul className="px-6 py-4 flex flex-col gap-1">
            {navLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  aria-current={l.active ? "page" : undefined}
                  className={`block py-3 text-sm rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 ${l.active ? "text-white" : "text-white/80"} hover:text-white`}
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  track("cta_click", {
                    eventName: "navbar_login_mobile",
                    metadata: { location: "navbar_mobile" },
                  });
                  onOpenAuth?.("login");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet/50 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70"
              >
                <User aria-hidden="true" className="w-4 h-4" /> Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  track("cta_click", {
                    eventName: "navbar_signup_mobile",
                    metadata: { location: "navbar_mobile" },
                  });
                  onOpenAuth?.("signup");
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full gradient-violet text-white text-sm font-semibold"
              >
                Crear cuenta
              </button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
