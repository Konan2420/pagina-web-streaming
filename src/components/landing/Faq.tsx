import { Minus, Plus } from "lucide-react";
import { FAQS } from "@/components/landing/faq-data";
import { useState } from "react";

/** Accessible FAQ accordion. */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 sm:py-28 scroll-mt-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Preguntas</p>
          <h2 className="mt-4 font-display uppercase text-white">Antes de empezar</h2>
          <p className="mt-4 text-white/75">Lo que más nos preguntan, respondido sin rodeos.</p>
        </div>

        <div className="lg:col-span-8 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="w-full flex items-center justify-between gap-6 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    <span className="font-display uppercase text-lg sm:text-xl text-white">
                      {f.q}
                    </span>
                    {isOpen ? (
                      <Minus className="w-5 h-5 text-red-accent shrink-0" aria-hidden="true" />
                    ) : (
                      <Plus className="w-5 h-5 text-white/60 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </h3>
                {isOpen && (
                  <p
                    id={`faq-panel-${i}`}
                    className="pb-6 -mt-1 text-sm leading-relaxed text-white/78 max-w-2xl"
                  >
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
