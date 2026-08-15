/** Single source of truth for the FAQ: rendered accordion + FAQPage JSON-LD. */
export const FAQS = [
  {
    q: "¿Necesito instalar algo raro?",
    a: "No. Usamos las aplicaciones oficiales o un reproductor sencillo según el dispositivo. Te enviamos instrucciones paso a paso al activar tu servicio.",
  },
  {
    q: "¿En cuánto tiempo se activa mi acceso?",
    a: "La mayoría de activaciones se completan en minutos. En horarios de alta demanda puede tardar hasta un par de horas y te avisamos por WhatsApp.",
  },
  {
    q: "¿Puedo verlo en varios dispositivos a la vez?",
    a: "Sí, depende del plan. El plan Familiar permite hasta 4 pantallas simultáneas y el plan Total no tiene límite práctico de dispositivos registrados.",
  },
  {
    q: "¿Hay permanencia o cargos automáticos?",
    a: "Ninguno. Cada compra es puntual: renuevas solo si quieres y no guardamos cobros recurrentes sin tu confirmación.",
  },
  {
    q: "¿Qué pasa si tengo un problema?",
    a: "Tienes soporte 24/7. Escríbenos y revisamos tu caso; si el servicio no funciona correctamente, lo reponemos o lo reactivamos sin coste.",
  },
];

export const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};
