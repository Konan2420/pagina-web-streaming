import { createFileRoute } from '@tanstack/react-router'
import { useState } from "react";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import {
  POLICY_DOCUMENTS,
  POLICY_LAST_UPDATED,
  type PolicyDocument,
} from "@/content/politicas";
import { cn } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

export const Route = createFileRoute("/politicas")({
  head: () => ({
    meta: [
      { title: "Políticas de CMD Streaming" },
      {
        name: "description",
        content:
          "Consulta los términos, privacidad, renovaciones, pagos y políticas de uso de CMD Streaming.",
      },
      { property: "og:title", content: "Políticas de CMD Streaming" },
      {
        property: "og:description",
        content: "Información clara sobre compras, garantía, renovaciones y uso de servicios.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/politicas" },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/politicas" }],
  }),
  component: PoliciesPage,
});

function PoliciesPage() {
  const [selectedId, setSelectedId] = useState<PolicyDocument["id"]>(POLICY_DOCUMENTS[0].id);
  const mobilePolicyScroll = useHorizontalScroll();
  const selectedPolicy = POLICY_DOCUMENTS.find((policy) => policy.id === selectedId) ?? POLICY_DOCUMENTS[0];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14">
        <nav aria-label="Ruta de navegación" className="text-xs text-white/60">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <a href="/" className="transition hover:text-white">
                Inicio
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <a href="/tienda" className="transition hover:text-white">
                Tienda
              </a>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white/85">Políticas</li>
          </ol>
        </nav>

        <header className="mt-7 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Transparencia CMD
          </span>
          <h1 className="mt-4 font-display text-3xl uppercase tracking-wide text-white sm:text-4xl">
            Políticas de CMD Streaming
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
            Aquí encontrarás información clara sobre compras, garantía, renovaciones y el uso de
            nuestros servicios digitales.
          </p>
        </header>

        <div className="mt-8 grid gap-5 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-start">
          <nav
            aria-label="Documentos de políticas"
            role="tablist"
            aria-orientation="vertical"
            className="hidden rounded-xl border border-border bg-background p-2 lg:block"
          >
            {POLICY_DOCUMENTS.map((policy) => (
              <PolicyTab
                key={policy.id}
                policy={policy}
                active={selectedPolicy.id === policy.id}
                onSelect={setSelectedId}
              />
            ))}
          </nav>

          <div className="relative -mx-4 sm:-mx-6 lg:hidden">
            <div
              ref={mobilePolicyScroll.scrollRef}
              role="tablist"
              aria-label="Documentos de políticas"
              className={cn(
                "flex touch-pan-x gap-2 overflow-x-auto px-4 pb-1 scrollbar-none select-none sm:px-6",
                mobilePolicyScroll.isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              onPointerDown={mobilePolicyScroll.onPointerDown}
              onPointerMove={mobilePolicyScroll.onPointerMove}
              onPointerUp={mobilePolicyScroll.onPointerUp}
              onPointerCancel={mobilePolicyScroll.onPointerCancel}
              onClickCapture={mobilePolicyScroll.onClickCapture}
            >
              {POLICY_DOCUMENTS.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedPolicy.id === policy.id}
                  onClick={() => setSelectedId(policy.id)}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-2 text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selectedPolicy.id === policy.id
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-border bg-background text-white/55 hover:border-primary/30 hover:text-white/85",
                  )}
                >
                  {policy.shortTitle}
                </button>
              ))}
            </div>
            {mobilePolicyScroll.hasStartOverflow && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
            )}
            {mobilePolicyScroll.hasEndOverflow && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
            )}
          </div>

          <article
            id="policy-content"
            role="tabpanel"
            tabIndex={0}
            className="rounded-xl border border-border bg-background p-5 outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-7"
          >
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                  Documento informativo
                </p>
                <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                  {selectedPolicy.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                  {selectedPolicy.summary}
                </p>
              </div>
              <FileText className="h-6 w-6 shrink-0 text-white/35" aria-hidden="true" />
            </div>

            <div className="divide-y divide-border">
              {selectedPolicy.sections.map((section) => (
                <section key={section.heading} className="py-6 first:pt-7 last:pb-7">
                  <h3 className="text-sm font-bold text-white sm:text-base">{section.heading}</h3>
                  <div className="mt-3 space-y-3 text-sm leading-7 text-white/70">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.bullets && (
                      <ul className="space-y-2 pl-5 marker:text-primary">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="pl-1">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <footer className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/45">Última actualización: {POLICY_LAST_UPDATED}</p>
              <a
                href="/tienda"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/75 transition hover:border-primary/60 hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                Volver a la tienda
              </a>
            </footer>
          </article>
        </div>
      </main>
    </div>
  );
}

function PolicyTab({
  policy,
  active,
  onSelect,
}: {
  policy: PolicyDocument;
  active: boolean;
  onSelect: (id: PolicyDocument["id"]) => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(policy.id)}
      className={cn(
        "flex w-full items-start gap-2 rounded-lg px-3 py-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        active
          ? "bg-primary/15 text-white"
          : "text-white/55 hover:bg-white/[0.045] hover:text-white/85",
      )}
    >
      <FileText className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", active ? "text-primary" : "text-white/40")} aria-hidden="true" />
      <span>{policy.title}</span>
    </button>
  );
}
