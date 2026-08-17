import { t as getPlatformPage } from "./_ssr/platform-pages-D-sJNagi.mjs";
import { B as notFound, g as createFileRoute, h as lazyRouteComponent } from "./_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_slug-mXZpWn83.js
var $$splitComponentImporter = () => import("./_slug-CMCA9rwf.mjs");
var Route = createFileRoute("/plataformas/$slug")({
	loader: ({ params }) => {
		const page = getPlatformPage(params.slug);
		if (!page) throw notFound();
		return page;
	},
	head: ({ params, loaderData }) => {
		if (!loaderData) return {};
		const url = `https://cmdstreaming.pe/plataformas/${params.slug}`;
		const title = `${loaderData.name} — precio y activación | CMD Streaming`;
		return {
			meta: [
				{ title },
				{
					name: "description",
					content: loaderData.description.slice(0, 155)
				},
				{
					property: "og:title",
					content: title
				},
				{
					property: "og:description",
					content: loaderData.tagline
				},
				{
					property: "og:type",
					content: "product"
				},
				{
					property: "og:url",
					content: url
				},
				{
					name: "twitter:card",
					content: "summary_large_image"
				}
			],
			links: [{
				rel: "canonical",
				href: url
			}],
			scripts: [
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "Product",
						name: loaderData.name,
						description: loaderData.description,
						brand: {
							"@type": "Brand",
							name: "CMD Streaming"
						},
						offers: {
							"@type": "Offer",
							price: loaderData.price.toFixed(2),
							priceCurrency: "PEN",
							availability: "https://schema.org/InStock",
							url
						}
					})
				},
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "BreadcrumbList",
						itemListElement: [
							{
								"@type": "ListItem",
								position: 1,
								name: "Inicio",
								item: "/"
							},
							{
								"@type": "ListItem",
								position: 2,
								name: "Plataformas",
								item: "/plataformas"
							},
							{
								"@type": "ListItem",
								position: 3,
								name: loaderData.name,
								item: url
							}
						]
					})
				},
				{
					type: "application/ld+json",
					children: JSON.stringify({
						"@context": "https://schema.org",
						"@type": "FAQPage",
						mainEntity: loaderData.faq.map((f) => ({
							"@type": "Question",
							name: f.q,
							acceptedAnswer: {
								"@type": "Answer",
								text: f.a
							}
						}))
					})
				}
			]
		};
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
