import type { CommercialSnapshot, Product, ProductCategory, ProductPresentation } from "./commercialTypes";

export const PRODUCT_CATEGORIES = [
  "beer",
  "wine",
  "fernet",
  "gin",
  "whisky",
  "mixer",
  "soft-drink",
  "accessory",
  "pack",
] as const satisfies readonly ProductCategory[];

export const PRODUCT_CATEGORY_ORDER = [
  "beer",
  "wine",
  "fernet",
  "gin",
  "whisky",
  "mixer",
  "soft-drink",
  "pack",
  "accessory",
] as const satisfies readonly ProductCategory[];

export const PRODUCT_CATEGORY_LABELS = {
  beer: "Cervezas",
  wine: "Vinos",
  fernet: "Fernet",
  gin: "Gin",
  whisky: "Whisky",
  mixer: "Mixers",
  "soft-drink": "Gaseosas",
  accessory: "Accesorios",
  pack: "Packs",
} as const satisfies Record<ProductCategory, string>;

export type LegacyOrderCategory = "barril" | "growler" | "porron" | "porrÃ³n" | "pack";

export interface CommercialCartLineDraft {
  id: string;
  name: string;
  price: number;
  category: string;
  productCategory: ProductCategory;
  productId: string;
  productName: string;
  presentationId: string;
  presentationLabel: string;
  presentationType?: string;
  presentationCategory?: string;
  variantId?: string;
  variantLabel?: string;
}

export interface CatalogCategoryOption {
  id: ProductCategory;
  label: string;
}

export interface CatalogProductOption {
  product: Product;
  presentations: ProductPresentation[];
  variantLabel?: string;
  priceFrom: number;
}

export interface CatalogSelectionState {
  category?: ProductCategory;
  productId?: string;
  presentationId?: string;
  quantity?: number;
}

type PresentationVariantFields = {
  variantId?: string;
  variantLabel?: string;
};

export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === "string" && PRODUCT_CATEGORIES.includes(value as ProductCategory);
}

export function createCartLineKey(
  line: Pick<CommercialCartLineDraft, "category" | "productId" | "presentationId" | "variantId"> & { productCategory?: string },
) {
  const category = line.productCategory ?? line.category;
  const parts = [
    `category=${category}`,
    `product=${line.productId}`,
    `presentation=${line.presentationId}`,
  ];

  if (line.variantId) {
    parts.push(`variant=${line.variantId}`);
  }

  return parts.join("|");
}

export function getProductVariantLabel(product: Pick<Product, "style">, presentation?: PresentationVariantFields) {
  return presentation?.variantLabel ?? product.style ?? undefined;
}

export function createCommercialCartItem(product: Product, presentation: ProductPresentation): CommercialCartLineDraft {
  const variantFields = presentation as ProductPresentation & PresentationVariantFields;
  const variantLabel = getProductVariantLabel(product, variantFields);
  const variantId = variantFields.variantId ?? (variantLabel ? product.style : undefined);

  return {
    id: createCartLineKey({
      category: product.category,
      productId: product.id,
      presentationId: presentation.id,
      variantId,
    }),
    name: formatCommercialLineName(product.name, presentation.label, variantLabel),
    price: presentation.unitPrice,
    category: presentation.category,
    productCategory: product.category,
    productId: product.id,
    productName: product.name,
    presentationId: presentation.id,
    presentationLabel: presentation.label,
    presentationType: presentation.presentationType,
    presentationCategory: presentation.category,
    variantId,
    variantLabel,
  };
}

export function formatCommercialLineName(productName: string, presentationLabel?: string, variantLabel?: string) {
  return [productName, variantLabel && variantLabel !== productName ? variantLabel : null, presentationLabel]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" â€” ");
}

export function buildActiveCatalogIndexes(snapshot: CommercialSnapshot) {
  const productsById = new Map(
    snapshot.products.filter((product) => product.status === "active").map((product) => [product.id, product]),
  );
  const presentationsById = new Map(
    snapshot.productPresentations
      .filter((presentation) => presentation.active && productsById.has(presentation.productId) && presentation.unitPrice >= 0)
      .map((presentation) => [presentation.id, presentation]),
  );

  return { productsById, presentationsById };
}

export function isValidCatalogPresentation(presentation: ProductPresentation) {
  return presentation.active && Number.isFinite(presentation.unitPrice) && presentation.unitPrice > 0;
}

export function listCatalogProductsByCategory(
  snapshot: CommercialSnapshot,
  category: ProductCategory,
): CatalogProductOption[] {
  const activeProducts = snapshot.products
    .filter((product) => product.status === "active" && product.category === category)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));

  return activeProducts
    .flatMap((product) => {
      const presentations = snapshot.productPresentations
        .filter((presentation) => presentation.productId === product.id && isValidCatalogPresentation(presentation))
        .sort((left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label));

      if (presentations.length === 0) return [];

      const variantLabel = getProductVariantLabel(product);
      const option = {
        product,
        presentations,
        priceFrom: Math.min(...presentations.map((presentation) => presentation.unitPrice)),
      } satisfies CatalogProductOption;

      return [variantLabel ? { ...option, variantLabel } : option];
    });
}

export function listVisibleCatalogCategories(snapshot: CommercialSnapshot): CatalogCategoryOption[] {
  return PRODUCT_CATEGORY_ORDER
    .filter((category) => listCatalogProductsByCategory(snapshot, category).length > 0)
    .map((category) => ({
      id: category,
      label: PRODUCT_CATEGORY_LABELS[category],
    }));
}

export function shouldShowCategorySelector(categories: readonly CatalogCategoryOption[]) {
  return categories.length > 1;
}

export function reconcileCatalogSelection(
  snapshot: CommercialSnapshot,
  selection: CatalogSelectionState,
): Required<CatalogSelectionState> {
  const categories = listVisibleCatalogCategories(snapshot);
  const category = selection.category && categories.some((item) => item.id === selection.category)
    ? selection.category
    : categories[0]?.id;
  const products = category ? listCatalogProductsByCategory(snapshot, category) : [];
  const product = selection.productId
    ? products.find((item) => item.product.id === selection.productId) ?? null
    : null;
  const presentation = product
    ? product.presentations.find((item) => item.id === selection.presentationId) ??
      (product.presentations.length === 1 ? product.presentations[0] : null)
    : null;
  const quantity = normalizeCatalogQuantity(selection.quantity ?? 1);

  return {
    category: category ?? "beer",
    productId: product?.product.id ?? "",
    presentationId: presentation?.id ?? "",
    quantity,
  };
}

export function normalizeCatalogQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.max(1, Math.min(999, Math.trunc(quantity) || 1));
}

export function findActiveProductPresentation(
  snapshot: CommercialSnapshot,
  productId: string,
  presentationId: string,
) {
  const { productsById, presentationsById } = buildActiveCatalogIndexes(snapshot);
  const product = productsById.get(productId);
  const presentation = presentationsById.get(presentationId);

  if (!product || !presentation || presentation.productId !== product.id) {
    return null;
  }

  return { product, presentation };
}
