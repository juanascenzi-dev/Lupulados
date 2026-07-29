import type { CommercialSnapshot, Product, ProductCategory, ProductPresentation } from "./commercialTypes";
import { demoStorePresentations, demoStoreProducts } from "./demoStoreCatalog";
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

export interface StorePresentationOption {
  value: string;
  label: string;
}

export const STORE_MAIN_CATEGORY_LABELS = {
  all: "Todo",
  beer: "Cervezas",
  alcohol: "Bebidas alcohólicas",
  "non-alcohol": "Bebidas sin alcohol",
  combo: "Combos y ofertas",
  accessory: "Accesorios y alquileres",
} as const satisfies Record<StoreMainCategory, string>;

const invalidImageSources = new Set(["https://example.com/lupulados-demo-placeholder"]);

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

export function isValidStoreImageSource(value: string | undefined | null) {
  const src = value?.trim();
  return Boolean(src && !invalidImageSources.has(src));
}

export function getStoreImageSource(product: Product) {
  return isValidStoreImageSource(product.image) ? product.image.trim() : null;
}

export function normalizePresentationLabel(label: string) {
  return label
    .replace(/(\d+(?:[.,]\d+)?)\s*L\b/g, "$1 L")
    .replace(/(\d+(?:[.,]\d+)?)\s*ml\b/gi, "$1 ml")
    .replace(/\bPorron\b/i, "Porrón")
    .replace(/\bTonica\b/i, "Tónica")
    .replace(/\bclasico\b/i, "clásico")
    .trim();
}

function labelFromPresentationType(type: string) {
  const normalized = type.toLowerCase();
  const volume = /^(\d+)-(\d+)l$/.exec(normalized);
  if (volume) return `Botella ${volume[1]},${volume[2]} L`;

  const simpleVolume = /^(\d+(?:[.,]\d+)?)l$/.exec(normalized);
  if (simpleVolume) return `Botella ${simpleVolume[1].replace(".", ",")} L`;

  const can = /^lata(\d+)$/.exec(normalized);
  if (can) return `Lata ${can[1]} ml`;

  const pack = /^pack(\d+)$/.exec(normalized);
  if (pack) return `Pack x${pack[1]}`;

  if (normalized === "barril20l") return "Barril 20 L";
  if (normalized === "barril30l") return "Barril 30 L";
  if (normalized === "barril50l") return "Barril 50 L";
  if (normalized === "growler1l") return "Growler 1 L";
  if (normalized === "growler2l") return "Growler 2 L";
  if (normalized === "porron500ml") return "Porrón 500 ml";
  if (normalized === "750ml") return "Botella 750 ml";
  if (normalized === "caja6") return "Caja x6";
  if (normalized === "combo") return "Combo";
  if (normalized === "evento") return "Por evento";

  return null;
}

export function getHumanPresentationLabel(presentation: Pick<ProductPresentation, "presentationType" | "label" | "sortOrder">) {
  return labelFromPresentationType(presentation.presentationType) ?? normalizePresentationLabel(presentation.label);
}

export function buildStoreSnapshot(snapshot: CommercialSnapshot): CommercialSnapshot {
  const productIds = new Set(snapshot.products.map((product) => product.id));
  const presentationIds = new Set(snapshot.productPresentations.map((presentation) => presentation.id));
  const demoProductsToAdd = demoStoreProducts.filter((product) => !productIds.has(product.id));
  const demoProductIdsToAdd = new Set(demoProductsToAdd.map((product) => product.id));
  const demoPresentationsToAdd = demoStorePresentations.filter(
    (presentation) => demoProductIdsToAdd.has(presentation.productId) && !presentationIds.has(presentation.id),
  );

  return {
    ...snapshot,
    products: [...snapshot.products, ...demoProductsToAdd],
    productPresentations: [...snapshot.productPresentations, ...demoPresentationsToAdd],
  };
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

export function buildStoreCatalogWithDemo(snapshot: CommercialSnapshot): StoreCatalogItem[] {
  return buildStoreCatalog(buildStoreSnapshot(snapshot));
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

export function listStorePresentationOptions(items: readonly StoreCatalogItem[]): StorePresentationOption[] {
  const byType = new Map<string, ProductPresentation[]>();
  items.forEach((item) => {
    item.presentations.forEach((presentation) => {
      byType.set(presentation.presentationType, [...(byType.get(presentation.presentationType) ?? []), presentation]);
    });
  });

  return Array.from(byType.entries())
    .map(([value, presentations]) => {
      const sorted = [...presentations].sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));
      return { value, label: getHumanPresentationLabel(sorted[0]) };
    })
    .sort((left, right) => left.label.localeCompare(right.label));
}

export function getStoreResultLabel(count: number) {
  return `${count} resultado${count === 1 ? "" : "s"}`;
}
