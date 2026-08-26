import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AuthModal, type AuthMode } from "@/components/AuthModal";
import { CloseBanner } from "@/components/landing/CloseBanner";
import { ContactForm } from "@/components/landing/ContactForm";
import { ContentShowcase } from "@/components/landing/ContentShowcase";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LogoMarquee } from "@/components/landing/LogoMarquee";
import { Navbar } from "@/components/landing/Navbar";
import { Plans } from "@/components/landing/Plans";
import { StatsBar } from "@/components/landing/StatsBar";
import { Testimonials } from "@/components/landing/Testimonials";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMD Streaming — Cine, series y TV en vivo en 4K" },
      {
        name: "description",
        content:
          "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia.",
      },
      { property: "og:title", content: "CMD Streaming — Cine, series y TV en vivo en 4K" },
      {
        property: "og:description",
        content:
          "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/" },
      {
        property: "og:image",
        content: "https://cmdstreaming.pe/landing/cmd-red-background-desktop.jpg",
      },
      { property: "og:image:alt", content: "CMD Streaming" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CMD Streaming — Cine, series y TV en vivo en 4K" },
      {
        name: "twitter:description",
        content:
          "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K.",
      },
      {
        name: "twitter:image",
        content: "https://cmdstreaming.pe/landing/cmd-red-background-desktop.jpg",
      },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/" }],
  }),
  component: LandingPage,
});

/** Public marketing landing. It deliberately remains available without ending an active session. */
function LandingPage() {
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  const openAuth = (mode: "login" | "signup" = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar onOpenAuth={openAuth} />
      <main>
        <Hero onOpenAuth={openAuth} />
        <LogoMarquee />
        <ContentShowcase />
        <Features />
        <HowItWorks />
        <StatsBar />
        <Testimonials />
        <Plans />
        <Faq />
        <ContactForm />
        <CloseBanner onOpenAuth={openAuth} />
      </main>
      <Footer />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}
