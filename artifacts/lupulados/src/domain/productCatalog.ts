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
