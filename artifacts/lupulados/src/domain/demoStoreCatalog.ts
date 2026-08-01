import type { Product, ProductPresentation } from "./commercialTypes";
import { demoProductImages, demoProductsInput } from "./demoStoreCatalogData";

export const demoStoreProducts: Product[] = demoProductsInput.map(
  ({ presentations: _presentations, ...product }) => ({
    ...product,
    image: demoProductImages[product.id] ?? "",
    status: "active",
  }),
);

export const demoStorePresentations: ProductPresentation[] = demoProductsInput.flatMap((product) =>
  product.presentations.map((presentation) => ({
    ...presentation,
    ...getDemoPresentationCommercialFields(product.id, presentation),
    id: `${product.id}:${presentation.presentationType}`,
    productId: product.id,
    active: true,
  })),
);

function getDemoPresentationCommercialFields(
  productId: string,
  presentation: Omit<ProductPresentation, "id" | "productId" | "active">,
): Partial<ProductPresentation> {
  if (productId === "demo-wine-malbec") {
    return {
      comparisonGroup: "wine-malbec-bottle",
      comparisonQuantity: presentation.presentationType === "caja6" ? 6 : 1,
      comparisonUnit: "botella",
      unitsPerPresentation: presentation.presentationType === "caja6" ? 6 : 1,
      promotional: presentation.presentationType === "caja6",
      promotionLabel: presentation.presentationType === "caja6" ? "Promo demo" : undefined,
    };
  }

  if (productId === "demo-cola") {
    return {
      comparisonGroup: "cola-2-25",
      comparisonQuantity: presentation.presentationType === "pack6" ? 6 : 1,
      comparisonUnit: "botella",
      unitsPerPresentation: presentation.presentationType === "pack6" ? 6 : 1,
    };
  }

  if (productId === "demo-tonic") {
    return {
      comparisonGroup: "tonic-can",
      comparisonQuantity: presentation.presentationType === "pack6" ? 6 : 1,
      comparisonUnit: "lata",
      unitsPerPresentation: presentation.presentationType === "pack6" ? 6 : 1,
      promotional: presentation.presentationType === "pack6",
      promotionLabel: presentation.presentationType === "pack6" ? "Promo demo" : undefined,
    };
  }

  if (productId === "demo-combo-fernet") {
    return {
      compareAtPrice: 21000,
      promotional: true,
      promotionLabel: "Promo demo",
      comparisonUnit: "pack",
    };
  }

  if (productId === "demo-combo-gin") {
    return {
      compareAtPrice: 25200,
      promotional: true,
      promotionLabel: "Promo demo",
      comparisonUnit: "pack",
    };
  }

  if (productId === "demo-combo-beer-event") {
    return {
      compareAtPrice: 62000,
      promotional: true,
      promotionLabel: "Promo demo",
      comparisonUnit: "evento",
    };
  }

  if (productId === "demo-combo-meeting") {
    return {
      compareAtPrice: 31500,
      promotional: true,
      promotionLabel: "Promo demo",
      comparisonUnit: "pack",
    };
  }

  if (presentation.presentationType === "750ml") {
    return {
      comparisonGroup: `${productId}-bottle`,
      comparisonQuantity: 1,
      comparisonUnit: "botella",
      unitsPerPresentation: 1,
    };
  }

  if (
    presentation.presentationType === "1l" ||
    presentation.presentationType === "1-5l" ||
    presentation.presentationType === "2l"
  ) {
    return {
      comparisonGroup: `${productId}-liter`,
      comparisonQuantity: presentation.volumeLiters,
      comparisonUnit: "litro",
    };
  }

  return { comparisonQuantity: 1, comparisonUnit: "unidad" };
}
