import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import type { CommercialSnapshot, Product, ProductPresentation } from "./commercialTypes";
import { createCartLineKey, createCommercialCartItem, findActiveProductPresentation } from "./productCatalog";

function product(overrides: Partial<Product>): Product {
  return {
    id: "generic-test",
    slug: "generic-test",
    name: "Generic Test",
    description: "Fixture de test",
    category: "wine",
    image: "https://example.com/product.jpg",
    status: "active",
    sortOrder: 1000,
    ...overrides,
  };
}

function presentation(overrides: Partial<ProductPresentation>): ProductPresentation {
  return {
    id: "generic-test:750ml",
    productId: "generic-test",
    presentationType: "750ml",
    label: "Botella 750ml",
    volumeLiters: 0.75,
    unitPrice: 12000,
    category: "pack",
    active: true,
    sortOrder: 1000,
    ...overrides,
  };
}

function snapshot(products: Product[], presentations: ProductPresentation[]): CommercialSnapshot {
  return {
    ...structuredClone(commercialSnapshot),
    products,
    productPresentations: presentations,
  };
}

describe("productCatalog", () => {
  it("builds a commercial cart item for an active beer from the current catalog", () => {
    const currentProduct = commercialSnapshot.products.find((item) => item.id === "ipa");
    const currentPresentation = commercialSnapshot.productPresentations.find((item) => item.id === "ipa:barril50L");

    expect(currentProduct && currentPresentation ? createCommercialCartItem(currentProduct, currentPresentation) : null).toMatchObject({
      category: "barril",
      productCategory: "beer",
      productId: "ipa",
      productName: "IPA",
      presentationId: "ipa:barril50L",
      presentationLabel: "Barril 50L",
      price: 105000,
    });
  });

  it("supports generic wine and mixer products in test fixtures", () => {
    const wine = product({ id: "wine-test", slug: "wine-test", name: "Wine Test", category: "wine" });
    const mixer = product({ id: "mixer-test", slug: "mixer-test", name: "Mixer Test", category: "mixer" });

    expect(createCommercialCartItem(wine, presentation({ id: "wine-test:750ml", productId: "wine-test" }))).toMatchObject({
      productCategory: "wine",
      productName: "Wine Test",
    });
    expect(createCommercialCartItem(mixer, presentation({ id: "mixer-test:lata", productId: "mixer-test", presentationType: "lata", label: "Lata" }))).toMatchObject({
      productCategory: "mixer",
      productName: "Mixer Test",
      presentationLabel: "Lata",
    });
  });

  it("supports accessories and products without a beer style", () => {
    const accessory = product({ id: "accessory-test", slug: "accessory-test", name: "Accesorio Test", category: "accessory", style: undefined });
    const line = createCommercialCartItem(accessory, presentation({ id: "accessory-test:unidad", productId: "accessory-test", presentationType: "unidad", label: "Unidad" }));

    expect(line).toMatchObject({
      productCategory: "accessory",
      variantId: undefined,
      variantLabel: undefined,
      presentationLabel: "Unidad",
    });
  });

  it("supports presentations with and without size labels through their stable presentation id", () => {
    const withSize = createCommercialCartItem(product({ id: "wine-test", slug: "wine-test" }), presentation({ id: "wine-test:750ml", productId: "wine-test", presentationType: "750ml", label: "Botella 750ml" }));
    const withoutSize = createCommercialCartItem(product({ id: "accessory-test", slug: "accessory-test", category: "accessory" }), presentation({ id: "accessory-test:unidad", productId: "accessory-test", presentationType: "unidad", label: "Unidad" }));

    expect(withSize.presentationId).toBe("wine-test:750ml");
    expect(withoutSize.presentationId).toBe("accessory-test:unidad");
  });

  it("does not return inactive products or inactive/invalid-price presentations", () => {
    const active = product({ id: "active-test", slug: "active-test" });
    const inactiveProduct = product({ id: "inactive-test", slug: "inactive-test", status: "archived" });
    const inactivePresentation = presentation({ id: "active-test:inactive", productId: "active-test", active: false });
    const invalidPrice = presentation({ id: "active-test:negative", productId: "active-test", unitPrice: -1 });
    const validPresentation = presentation({ id: "active-test:750ml", productId: "active-test" });
    const data = snapshot([active, inactiveProduct], [inactivePresentation, invalidPrice, validPresentation]);

    expect(findActiveProductPresentation(data, "active-test", "active-test:750ml")).not.toBeNull();
    expect(findActiveProductPresentation(data, "inactive-test", "inactive-test:750ml")).toBeNull();
    expect(findActiveProductPresentation(data, "active-test", "active-test:inactive")).toBeNull();
    expect(findActiveProductPresentation(data, "active-test", "active-test:negative")).toBeNull();
  });

  it("creates stable line keys that change by presentation, product, category or variant", () => {
    const base = createCartLineKey({ category: "pack", productCategory: "wine", productId: "p1", presentationId: "p1:750ml", variantId: "reserva" });

    expect(base).toBe("category=wine|product=p1|presentation=p1:750ml|variant=reserva");
    expect(createCartLineKey({ category: "pack", productCategory: "wine", productId: "p1", presentationId: "p1:750ml", variantId: "reserva" })).toBe(base);
    expect(createCartLineKey({ category: "pack", productCategory: "wine", productId: "p1", presentationId: "p1:1l", variantId: "reserva" })).not.toBe(base);
    expect(createCartLineKey({ category: "pack", productCategory: "wine", productId: "p2", presentationId: "p2:750ml", variantId: "reserva" })).not.toBe(base);
    expect(createCartLineKey({ category: "pack", productCategory: "mixer", productId: "p1", presentationId: "p1:750ml", variantId: "reserva" })).not.toBe(base);
    expect(createCartLineKey({ category: "pack", productCategory: "wine", productId: "p1", presentationId: "p1:750ml", variantId: "clasico" })).not.toBe(base);
  });
});
