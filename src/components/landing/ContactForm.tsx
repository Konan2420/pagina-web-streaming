import { useState } from "react";
import { Send, User, Mail, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { WA_NUMBER } from "@/components/tienda/data";

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const message = String(data.get("message") || "").trim();

    setIsSubmitting(true);
    try {
      const text = [
        "Hola, necesito ayuda con CMD Streaming.",
        `Nombre: ${name}`,
        `Correo: ${email}`,
        `Mensaje: ${message}`,
      ].join("\n");
      window.open(
        `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`,
        "_blank",
        "noopener,noreferrer",
      );
      toast.success("Abrimos WhatsApp para que envíes tu mensaje.");
      form.reset();
    } catch {
      toast.error("No se pudo abrir WhatsApp. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contacto" className="py-24 relative overflow-hidden bg-white/[0.01]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-accent">
              <span className="h-px w-8 bg-red-accent" aria-hidden="true" />
              Soporte Directo
            </p>
            <h2 className="mt-5 font-display uppercase text-white text-4xl sm:text-5xl leading-tight">
              ¿Tienes alguna <span className="text-red-accent">duda?</span>
            </h2>
            <p className="mt-6 text-white/70 text-lg leading-relaxed max-w-lg">
              Nuestro equipo está listo para ayudarte con la activación de tus cuentas o cualquier
              consulta técnica. Respondemos en tiempo récord.
            </p>

            <div className="mt-10 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-md bg-white/5 border border-white/10 grid place-items-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-red-accent" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Chat en vivo</h3>
                  <p className="text-sm text-white/60">
                    Disponible 24/7 vía WhatsApp para activaciones rápidas.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 bg-red-accent/5 blur-3xl rounded-full opacity-50" />
            <form
              onSubmit={handleSubmit}
              className="relative bg-white/[0.03] border border-white/10 rounded-xl p-8 space-y-5"
            >
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold uppercase tracking-wider text-white/50 px-1"
                >
                  Nombre completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    required
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-md py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-accent/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-white/50 px-1"
                >
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    required
                    id="email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="w-full bg-white/[0.05] border border-white/10 rounded-md py-3.5 pl-11 pr-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-accent/50 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="text-xs font-semibold uppercase tracking-wider text-white/50 px-1"
                >
                  Mensaje
                </label>
                <textarea
                  required
                  id="message"
                  name="message"
                  rows={4}
                  placeholder="¿En qué podemos ayudarte?"
                  className="w-full bg-white/[0.05] border border-white/10 rounded-md py-3.5 px-4 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-red-accent/50 transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm tracking-wide uppercase hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar mensaje
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
