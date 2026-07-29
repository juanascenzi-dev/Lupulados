import type { CommercialSnapshot, Product, ProductCategory, ProductPresentation } from "./commercialTypes";
import { isValidCatalogPresentation } from "./productCatalog";

export type StoreMainCategory = "all" | "beer" | "alcohol" | "non-alcohol" | "combo" | "accessory";

export interface StoreCatalogItem {
  product: Product;
  presentations: ProductPresentation[];
  mainCategory: Exclude<StoreMainCategory, "all">;
  subcategory: string;
  priceFrom: number;
  searchText: string;
  isDemo: boolean;
}

export interface StoreFilters {
  query?: string;
  mainCategory?: StoreMainCategory;
  subcategory?: string;
  productCategory?: ProductCategory | "all";
  presentationType?: string;
}

export const STORE_MAIN_CATEGORY_LABELS = {
  all: "Todo",
  beer: "Cervezas",
  alcohol: "Bebidas alcoholicas",
  "non-alcohol": "Bebidas sin alcohol",
  combo: "Combos y ofertas",
  accessory: "Accesorios y alquileres",
} as const satisfies Record<StoreMainCategory, string>;

const fallbackMainCategory: Record<ProductCategory, Exclude<StoreMainCategory, "all">> = {
  beer: "beer",
  wine: "alcohol",
  fernet: "alcohol",
  aperitif: "alcohol",
  gin: "alcohol",
  vodka: "alcohol",
  whisky: "alcohol",
  rum: "alcohol",
  tequila: "alcohol",
  liqueur: "alcohol",
  mixer: "non-alcohol",
  "soft-drink": "non-alcohol",
  water: "non-alcohol",
  ice: "non-alcohol",
  accessory: "accessory",
  pack: "combo",
};

const fallbackSubcategory: Record<ProductCategory, string> = {
  beer: "Cervezas",
  wine: "Vinos",
  fernet: "Fernet y amargos",
  aperitif: "Aperitivos y vermuts",
  gin: "Gin y ginebra",
  vodka: "Vodka",
  whisky: "Whiskies y bourbons",
  rum: "Ron",
  tequila: "Tequila",
  liqueur: "Licores",
  mixer: "Mixers",
  "soft-drink": "Gaseosas",
  water: "Agua y soda",
  ice: "Hielo",
  accessory: "Accesorios",
  pack: "Combos y ofertas",
};

export function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

export function getStoreMainCategory(product: Product): Exclude<StoreMainCategory, "all"> {
  return product.mainCategory ?? fallbackMainCategory[product.category];
}

export function getStoreSubcategory(product: Product) {
  return product.subcategory ?? fallbackSubcategory[product.category];
}

export function buildStoreCatalog(snapshot: CommercialSnapshot): StoreCatalogItem[] {
  const activeProducts = snapshot.products
    .filter((product) => product.status === "active")
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

  return activeProducts.flatMap((product) => {
    const presentations = snapshot.productPresentations
      .filter((presentation) => presentation.productId === product.id && isValidCatalogPresentation(presentation))
      .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));

    if (presentations.length === 0) return [];

    const mainCategory = getStoreMainCategory(product);
    const subcategory = getStoreSubcategory(product);
    const searchText = normalizeSearchText(
      [
        product.name,
        product.description,
        product.style,
        product.category,
        mainCategory,
        subcategory,
        product.tags?.join(" "),
        presentations.map((presentation) => presentation.label).join(" "),
      ]
        .filter(Boolean)
        .join(" "),
    );

    return [
      {
        product,
        presentations,
        mainCategory,
        subcategory,
        priceFrom: Math.min(...presentations.map((presentation) => presentation.unitPrice)),
        searchText,
        isDemo: product.demo === true,
      },
    ];
  });
}

export function filterStoreCatalog(items: readonly StoreCatalogItem[], filters: StoreFilters) {
  const query = normalizeSearchText(filters.query ?? "");

  return items.filter((item) => {
    if (filters.mainCategory && filters.mainCategory !== "all" && item.mainCategory !== filters.mainCategory) return false;
    if (filters.subcategory && filters.subcategory !== "all" && item.subcategory !== filters.subcategory) return false;
    if (filters.productCategory && filters.productCategory !== "all" && item.product.category !== filters.productCategory) return false;
    if (
      filters.presentationType &&
      filters.presentationType !== "all" &&
      !item.presentations.some((presentation) => presentation.presentationType === filters.presentationType)
    ) {
      return false;
    }
    return !query || item.searchText.includes(query);
  });
}

export function listStoreSubcategories(items: readonly StoreCatalogItem[], mainCategory: StoreMainCategory = "all") {
  const values = items
    .filter((item) => mainCategory === "all" || item.mainCategory === mainCategory)
    .map((item) => item.subcategory);

  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

export function listStorePresentationTypes(items: readonly StoreCatalogItem[]) {
  return Array.from(new Set(items.flatMap((item) => item.presentations.map((presentation) => presentation.presentationType)))).sort();
}

export function getStoreResultLabel(count: number) {
  return `${count} resultado${count === 1 ? "" : "s"}`;
}
