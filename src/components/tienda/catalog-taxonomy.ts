import { categories, type Category } from "./data";

const aliases: Record<string, string> = {
  musica: "music",
  juegos: "videojuegos",
  gaming: "videojuegos",
  inteligencia_artificial: "ia",
  "inteligencia artificial": "ia",
  ai: "ia",
  gift_cards: "giftcards",
  "gift cards": "giftcards",
  educacion: "educacion",
  diseno: "diseno",
};

export function normalizeCatalogSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function toCatalogCategory(value: string): string {
  const normalized = normalizeCatalogSearch(value).replace(/[-\s]+/g, "_");
  return aliases[normalized] ?? normalized;
}

export function getCategoryLabel(value: string): string {
  const id = toCatalogCategory(value);
  if (id === "redes") return "Redes Sociales";
  return categories.find((category) => category.id === id)?.label ?? value.replace(/[_-]+/g, " ");
}

/** Products remain the source of truth: unknown database categories stay selectable. */
export function getCatalogCategories(productCategories: string[]): Category[] {
  const known = new Set(categories.map(({ id }) => id));
  const extra = [...new Set(productCategories.map(toCatalogCategory))]
    .filter((id) => id && id !== "redes" && !known.has(id))
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((id) => ({ id, label: getCategoryLabel(id), accent: "var(--primary)" }));
  return [...categories, ...extra];
}

export type CatalogSearchProduct = {
  name: string;
  category: string;
  accountType?: string | null;
  deliveryType?: string | null;
  publisherName?: string | null;
};

export function matchesCatalogSearch(product: CatalogSearchProduct, query: string): boolean {
  const words = normalizeCatalogSearch(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const fields = [
    product.name,
    product.category,
    getCategoryLabel(product.category),
    product.accountType ?? "",
    product.deliveryType ?? "",
    product.publisherName ?? "",
  ].map(normalizeCatalogSearch);
  return words.every((word) => fields.some((field) => field.includes(word)));
}
