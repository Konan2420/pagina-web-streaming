export const platforms = [
  { name: "Netflix", tone: "red" },
  { name: "Disney+", tone: "violet" },
  { name: "Prime Video", tone: "violet" },
  { name: "HBO Max", tone: "violet" },
  { name: "Apple TV+", tone: "violet" },
  { name: "YouTube", tone: "red" },
  { name: "Paramount+", tone: "violet" },
  { name: "Star+", tone: "violet" },
  { name: "Hulu", tone: "violet" },
  { name: "Crunchyroll", tone: "violet" },
  { name: "ESPN", tone: "violet" },
  { name: "DAZN", tone: "violet" },
  { name: "Discovery+", tone: "violet" },
  { name: "Peacock", tone: "violet" },
  { name: "Y MÁS", tone: "more" },
] as const;

export type PlatformTone = (typeof platforms)[number]["tone"];

export const navLinks = [
  { label: "Inicio", href: "#inicio", active: true },
  { label: "Películas", href: "#peliculas" },
  { label: "Series", href: "#series" },
  { label: "Canales TV", href: "#canales" },
  { label: "Dispositivos", href: "#dispositivos" },
  { label: "Testimonios", href: "#testimonios" },
  { label: "Planes", href: "#planes" },
  { label: "FAQ", href: "#faq" },
  { label: "Contacto", href: "#contacto" },
];

export const heroCopy = {
  overline: "Plataforma todo-en-uno",
  title: {
    main: "Streaming, IA",
    break: "& Gaming en un",
    accent: " solo lugar",
  },
  description:
    "Disfruta de licencias premium para variedades de IAs, recarga de tus juegos favoritos y servicios para redes sociales, además de todo el cine y TV que amas.",
  ctaPrimary: "Crear cuenta gratis",
  ctaSecondary: "Ingresar a tienda",
  loginText: "¿Ya tienes cuenta?",
  loginAction: "Inicia sesión",
};
