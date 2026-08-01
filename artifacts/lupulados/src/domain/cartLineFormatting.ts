import { PRODUCT_CATEGORY_LABELS } from "@/domain/productCatalog";
import type { ProductPresentation } from "@/domain/commercialTypes";

export function getCartLineTitle(item: {
  category: string;
  productName?: string;
  beerName?: string;
  name: string;
}) {
  if (item.category === "pack") return item.productName ?? item.name;
  return item.productName ?? item.beerName ?? item.name;
}

export function getCartLineBeer(item: {
  category: string;
  productCategory?: string;
  beerName?: string;
  productName?: string;
  variantLabel?: string;
  name: string;
}) {
  if (
    item.productCategory &&
    item.productCategory !== "beer" &&
    item.productCategory in PRODUCT_CATEGORY_LABELS
  ) {
    return item.variantLabel && item.variantLabel !== item.productName
      ? item.variantLabel
      : PRODUCT_CATEGORY_LABELS[item.productCategory as keyof typeof PRODUCT_CATEGORY_LABELS];
  }
  if (item.category === "pack") return null;
  return item.beerName ?? item.productName ?? item.name.split("—")[0]?.trim() ?? item.name;
}

export function getCartLinePresentation(item: { presentationLabel?: string; name: string }) {
  return item.presentationLabel ?? item.name.split("—")[1]?.trim() ?? null;
}

export function getCompactCartLineDescription(item: {
  category: string;
  productCategory?: string;
  pack?: { type: string; capacity: number; composition: Array<{ productId: string }> };
  presentationLabel?: string;
  variantLabel?: string;
  qty: number;
  name: string;
}) {
  if (item.pack?.type === "configurable-beer-pack") {
    const styleCount = new Set(item.pack.composition.map((selection) => selection.productId)).size;
    return `${item.qty * item.pack.capacity} porrones · ${styleCount} ${styleCount === 1 ? "estilo" : "estilos"}`;
  }
  if (item.category === "pack") return "6 estilos surtidos";
  if (item.presentationLabel) return item.presentationLabel;
  if (item.variantLabel) return item.variantLabel;
  return getCartLinePresentation(item) ?? item.category;
}

export function getPresentationDetails(presentation: ProductPresentation) {
  return [
    presentation.description,
    presentation.volumeLiters > 0 ? `${presentation.volumeLiters} L` : null,
    presentation.presentationType && presentation.presentationType !== presentation.label
      ? presentation.presentationType
      : null,
  ].filter((part): part is string => Boolean(part));
}
