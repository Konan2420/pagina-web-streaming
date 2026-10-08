import type { CatalogFilters } from "./CatalogToolbar";
import { matchesCatalogSearch, normalizeCatalogSearch } from "./catalog-taxonomy";

type FilterableCatalogProduct = {
  name: string;
  category: string;
  serviceId: string | null;
  price: number;
  durationDays: number;
  isRenewable: boolean;
  accountType?: string | null;
  deliveryType?: string | null;
  publisherName?: string | null;
};

type CatalogFilterState = {
  category: string;
  serviceId: string | null;
  query: string;
  filters: CatalogFilters;
};

export function filterCatalogProducts<T extends FilterableCatalogProduct>(
  products: T[],
  state: CatalogFilterState,
): T[] {
  const query = normalizeCatalogSearch(state.query);
  const minPrice = state.filters.minPrice === "" ? null : Number(state.filters.minPrice);
  const maxPrice = state.filters.maxPrice === "" ? null : Number(state.filters.maxPrice);

  return products.filter((product) => {
    const matchesCategory = state.serviceId
      ? true
      : state.category === "todo"
        ? product.category !== "redes"
        : product.category === state.category;
    const matchesService =
      !state.serviceId ||
      product.serviceId === state.serviceId ||
      (query !== "" && normalizeCatalogSearch(product.name).includes(query));
    const matchesSearch = state.serviceId || matchesCatalogSearch(product, query);
    const matchesMinPrice =
      minPrice == null || !Number.isFinite(minPrice) || product.price >= minPrice;
    const matchesMaxPrice =
      maxPrice == null || !Number.isFinite(maxPrice) || product.price <= maxPrice;
    const matchesDuration =
      state.filters.durationDays.length === 0 ||
      state.filters.durationDays.includes(product.durationDays);
    const matchesRenewal =
      state.filters.renewalTypes.length === 0 ||
      state.filters.renewalTypes.includes(product.isRenewable ? "renewable" : "nonrenewable");
    return (
      matchesCategory &&
      matchesService &&
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesDuration &&
      matchesRenewal
    );
  });
}
