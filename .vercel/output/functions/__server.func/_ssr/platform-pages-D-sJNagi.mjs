//#region node_modules/.nitro/vite/services/ssr/assets/platform-pages-D-sJNagi.js
var platformPages = [
	{
		slug: "netflix",
		name: "Netflix Premium 4K",
		productId: "netflix-1",
		price: 15,
		duracion: "1 Mes",
		tagline: "Perfil Netflix Premium en 4K por 30 días",
		description: "Accede al catálogo completo de Netflix en calidad 4K UHD con un perfil propio. Activación el mismo día, sin permanencia y con soporte por WhatsApp durante toda la vigencia del plan.",
		includes: [
			"Perfil individual dentro de una cuenta Premium",
			"Calidad hasta 4K UHD con HDR según tu dispositivo",
			"Compatible con Smart TV, móvil, tablet, consola y navegador",
			"Garantía y reposición durante los 30 días"
		],
		faq: [{
			q: "¿El perfil de Netflix es solo mío?",
			a: "Sí. Recibes un perfil propio con tu nombre; no compartes historial ni recomendaciones con nadie más."
		}, {
			q: "¿Puedo descargar contenido?",
			a: "Sí, puedes descargar títulos para verlos sin conexión desde la app oficial de Netflix."
		}]
	},
	{
		slug: "disney-plus",
		name: "Disney+ Anual",
		productId: "disney-1",
		price: 45,
		duracion: "12 Meses",
		tagline: "Cuenta completa de Disney+ durante 12 meses",
		description: "Disney, Pixar, Marvel, Star Wars, National Geographic y Star en una sola cuenta completa durante un año entero. Entrega inmediata tras confirmar el pago.",
		includes: [
			"Cuenta completa con todos los perfiles disponibles",
			"12 meses de vigencia al mejor precio por mes",
			"Catálogo Disney, Pixar, Marvel, Star Wars y Star",
			"Soporte y reposición durante todo el año"
		],
		faq: [{
			q: "¿Cuántas pantallas puedo usar en Disney+?",
			a: "Al ser cuenta completa puedes usar las pantallas simultáneas que permite el plan de Disney+."
		}, {
			q: "¿Puedo cambiar la contraseña?",
			a: "Sí, al recibir la cuenta puedes personalizarla; te indicamos cómo hacerlo sin perder el acceso."
		}]
	},
	{
		slug: "hbo-max",
		name: "HBO Max Estándar",
		productId: "hbo-1",
		price: 12,
		duracion: "1 Mes",
		tagline: "Perfil HBO Max por 30 días",
		description: "Series originales de HBO, cine de Warner Bros y estrenos DC en un perfil HBO Max propio por 30 días, con activación rápida y garantía.",
		includes: [
			"Perfil propio en cuenta HBO Max",
			"Estrenos de Warner Bros y catálogo DC",
			"Compatible con todos los dispositivos habituales",
			"Garantía durante los 30 días del plan"
		],
		faq: [{
			q: "¿Incluye los estrenos de cine?",
			a: "Sí, accedes al catálogo estándar de la plataforma, incluidos los estrenos disponibles en HBO Max."
		}, {
			q: "¿Puedo renovar el mismo perfil?",
			a: "Sí. Si renuevas antes de que venza, mantienes el mismo perfil y tu progreso."
		}]
	},
	{
		slug: "prime-video",
		name: "Prime Video",
		productId: "prime-1",
		price: 10,
		duracion: "1 Mes",
		tagline: "Perfil Prime Video por 30 días",
		description: "Series originales de Amazon, cine y contenido exclusivo con un perfil Prime Video por 30 días. Precio fijo, sin cargos recurrentes.",
		includes: [
			"Perfil propio en cuenta Prime Video",
			"Series y películas originales de Amazon",
			"Ver en TV, móvil, tablet o navegador",
			"Soporte por WhatsApp en horario de atención"
		],
		faq: [{
			q: "¿Incluye los envíos de Amazon?",
			a: "No. El servicio cubre únicamente el acceso a Prime Video, no las ventajas de compra de Amazon."
		}, {
			q: "¿Se puede ver en Smart TV?",
			a: "Sí, desde la app oficial de Prime Video instalada en tu televisor."
		}]
	},
	{
		slug: "spotify",
		name: "Spotify Premium",
		productId: "spotify-1",
		price: 8,
		duracion: "1 Mes",
		tagline: "Spotify Premium por 30 días sin anuncios",
		description: "Música sin anuncios, descargas offline y calidad alta durante 30 días. Activación el mismo día y sin permanencia.",
		includes: [
			"Reproducción sin anuncios",
			"Descargas para escuchar sin conexión",
			"Calidad de audio alta",
			"Garantía durante los 30 días"
		],
		faq: [{
			q: "¿Pierdo mis playlists?",
			a: "No. Tus listas y tu biblioteca se mantienen tal cual las tienes."
		}, {
			q: "¿Funciona en cualquier país?",
			a: "Te indicamos la configuración adecuada al activar; funciona en los dispositivos habituales."
		}]
	},
	{
		slug: "combo-streaming",
		name: "Combo Streaming Total",
		productId: "combo-1",
		price: 35,
		duracion: "1 Mes",
		tagline: "3 plataformas de streaming por 30 días",
		description: "Elige tres plataformas de streaming y paga menos que contratándolas por separado. Una sola activación, un solo soporte y una sola fecha de renovación.",
		includes: [
			"3 plataformas a elección del catálogo",
			"Una única fecha de vencimiento",
			"Ahorro frente a la compra individual",
			"Soporte unificado por WhatsApp"
		],
		faq: [{
			q: "¿Qué plataformas puedo elegir?",
			a: "Cualquiera de las disponibles en la tienda: Netflix, Disney+, HBO Max, Prime Video y más."
		}, {
			q: "¿Puedo cambiar una plataforma a mitad de mes?",
			a: "El combo se define al activarlo; los cambios se aplican en la siguiente renovación."
		}]
	}
];
function getPlatformPage(slug) {
	return platformPages.find((p) => p.slug === slug);
}
//#endregion
export { platformPages as n, getPlatformPage as t };
