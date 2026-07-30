import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import type { CommercialSnapshot, Product, ProductPresentation } from "./commercialTypes";
import {
  PRODUCT_CATEGORY_LABELS,
  createCartLineKey,
  createCommercialCartItem,
  findActiveProductPresentation,
  listCatalogProductsByCategory,
  listVisibleCatalogCategories,
  normalizeCatalogQuantity,
  reconcileCatalogSelection,
  shouldShowCategorySelector,
} from "./productCatalog";

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
    const zeroPrice = presentation({ id: "active-test:zero", productId: "active-test", unitPrice: 0 });
    const validPresentation = presentation({ id: "active-test:750ml", productId: "active-test" });
    const data = snapshot([active, inactiveProduct], [inactivePresentation, invalidPrice, zeroPrice, validPresentation]);

    expect(findActiveProductPresentation(data, "active-test", "active-test:750ml")).not.toBeNull();
    expect(findActiveProductPresentation(data, "inactive-test", "inactive-test:750ml")).toBeNull();
    expect(findActiveProductPresentation(data, "active-test", "active-test:inactive")).toBeNull();
    expect(findActiveProductPresentation(data, "active-test", "active-test:negative")).toBeNull();
    expect(findActiveProductPresentation(data, "active-test", "active-test:zero")).toBeNull();
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

  it("derives visible categories only from active products with active positive-price presentations", () => {
    const data = snapshot(
      [
        product({ id: "wine-test", slug: "wine-test", category: "wine", sortOrder: 2 }),
        product({ id: "mixer-test", slug: "mixer-test", category: "mixer", sortOrder: 3 }),
        product({ id: "gin-test", slug: "gin-test", category: "gin", sortOrder: 1, status: "archived" }),
        product({ id: "whisky-test", slug: "whisky-test", category: "whisky", sortOrder: 4 }),
        product({ id: "accessory-test", slug: "accessory-test", category: "accessory", sortOrder: 5 }),
      ],
      [
        presentation({ id: "wine-test:750ml", productId: "wine-test", unitPrice: 12000 }),
        presentation({ id: "mixer-test:lata", productId: "mixer-test", unitPrice: 1800 }),
        presentation({ id: "gin-test:750ml", productId: "gin-test", unitPrice: 15000 }),
        presentation({ id: "whisky-test:750ml", productId: "whisky-test", active: false, unitPrice: 30000 }),
        presentation({ id: "accessory-test:unidad", productId: "accessory-test", unitPrice: 0 }),
      ],
    );

    expect(listVisibleCatalogCategories(data)).toEqual([
      { id: "wine", label: "Vinos" },
      { id: "mixer", label: "Mixers" },
    ]);
    expect(listVisibleCatalogCategories(data).map((category) => category.label)).not.toContain("Gin");
    expect(listVisibleCatalogCategories(data).map((category) => category.label)).not.toContain("Whisky");
    expect(listVisibleCatalogCategories(data).map((category) => category.label)).not.toContain("Accesorios");
  });

  it("keeps category labels centralized and follows the preferred order without gaps", () => {
    const data = snapshot(
      [
        product({ id: "accessory-test", slug: "accessory-test", category: "accessory" }),
        product({ id: "beer-test", slug: "beer-test", category: "beer" }),
        product({ id: "pack-test", slug: "pack-test", category: "pack" }),
        product({ id: "soft-test", slug: "soft-test", category: "soft-drink" }),
      ],
      [
        presentation({ id: "accessory-test:unidad", productId: "accessory-test" }),
        presentation({ id: "beer-test:growler1L", productId: "beer-test" }),
        presentation({ id: "pack-test:unidad", productId: "pack-test" }),
        presentation({ id: "soft-test:lata", productId: "soft-test" }),
      ],
    );

    expect(PRODUCT_CATEGORY_LABELS).toMatchObject({
      beer: "Cervezas",
      wine: "Vinos",
      fernet: "Fernet",
      aperitif: "Aperitivos y vermuts",
      gin: "Gin",
      vodka: "Vodka",
      whisky: "Whisky",
      rum: "Ron",
      tequila: "Tequila",
      liqueur: "Licores",
      mixer: "Mixers",
      "soft-drink": "Gaseosas",
      water: "Agua y soda",
      ice: "Hielo",
      accessory: "Accesorios",
      pack: "Packs",
    });
    expect(listVisibleCatalogCategories(data)).toEqual([
      { id: "beer", label: "Cervezas" },
      { id: "soft-drink", label: "Gaseosas" },
      { id: "pack", label: "Packs" },
      { id: "accessory", label: "Accesorios" },
    ]);
  });

  it("indicates that one category skips the selector and several categories enable it", () => {
    const single = snapshot([product({ id: "wine-test", slug: "wine-test", category: "wine" })], [
      presentation({ id: "wine-test:750ml", productId: "wine-test" }),
    ]);
    const multiple = snapshot(
      [
        product({ id: "wine-test", slug: "wine-test", category: "wine" }),
        product({ id: "mixer-test", slug: "mixer-test", category: "mixer" }),
      ],
      [
        presentation({ id: "wine-test:750ml", productId: "wine-test" }),
        presentation({ id: "mixer-test:lata", productId: "mixer-test" }),
      ],
    );

    expect(shouldShowCategorySelector(listVisibleCatalogCategories(single))).toBe(false);
    expect(shouldShowCategorySelector(listVisibleCatalogCategories(multiple))).toBe(true);
  });

  it("filters products by category and preserves snapshot names, images and presentation choices", () => {
    const data = snapshot(
      [
        product({ id: "wine-test", slug: "wine-test", name: "Vino Test", category: "wine", image: "https://example.com/wine.jpg", style: "Reserva", sortOrder: 1 }),
        product({ id: "wine-no-image", slug: "wine-no-image", name: "Vino Sin Imagen", category: "wine", image: "", sortOrder: 2 }),
        product({ id: "mixer-test", slug: "mixer-test", name: "Mixer Test", category: "mixer" }),
        product({ id: "wine-archived", slug: "wine-archived", name: "Archivado", category: "wine", status: "archived" }),
        product({ id: "wine-without-price", slug: "wine-without-price", name: "Sin precio", category: "wine" }),
      ],
      [
        presentation({ id: "wine-test:750ml", productId: "wine-test", label: "Botella 750ml", unitPrice: 12000 }),
        presentation({ id: "wine-test:caja", productId: "wine-test", label: "Caja", unitPrice: 60000 }),
        presentation({ id: "wine-no-image:750ml", productId: "wine-no-image", unitPrice: 9000 }),
        presentation({ id: "mixer-test:lata", productId: "mixer-test", unitPrice: 1800 }),
        presentation({ id: "wine-archived:750ml", productId: "wine-archived", unitPrice: 11000 }),
        presentation({ id: "wine-without-price:750ml", productId: "wine-without-price", unitPrice: 0 }),
      ],
    );

    const wines = listCatalogProductsByCategory(data, "wine");

    expect(wines.map((item) => item.product.name)).toEqual(["Vino Test", "Vino Sin Imagen"]);
    expect(wines[0]).toMatchObject({
      product: expect.objectContaining({ name: "Vino Test", image: "https://example.com/wine.jpg" }),
      variantLabel: "Reserva",
      priceFrom: 12000,
    });
    expect(wines[0].presentations.map((item) => item.label)).toEqual(["Botella 750ml", "Caja"]);
    expect(wines[1].product.image).toBe("");
    expect(listCatalogProductsByCategory(data, "mixer")).toHaveLength(1);
  });

  it("supports accessories without variants", () => {
    const data = snapshot([product({ id: "accessory-test", slug: "accessory-test", category: "accessory", style: undefined })], [
      presentation({ id: "accessory-test:unidad", productId: "accessory-test", label: "Unidad" }),
    ]);

    const accessory = listCatalogProductsByCategory(data, "accessory")[0];
    expect(accessory).not.toHaveProperty("variantLabel");
    expect(accessory.presentations).toEqual([expect.objectContaining({ label: "Unidad" })]);
  });

  it("reconciles category, product, presentation and quantity selections against the active snapshot", () => {
    const data = snapshot(
      [
        product({ id: "wine-test", slug: "wine-test", category: "wine" }),
        product({ id: "mixer-test", slug: "mixer-test", category: "mixer" }),
      ],
      [
        presentation({ id: "wine-test:750ml", productId: "wine-test" }),
        presentation({ id: "wine-test:caja", productId: "wine-test", label: "Caja" }),
        presentation({ id: "mixer-test:lata", productId: "mixer-test" }),
      ],
    );

    expect(reconcileCatalogSelection(data, { category: "mixer", quantity: Number.NaN })).toEqual({
      category: "mixer",
      productId: "",
      presentationId: "",
      quantity: 1,
    });
    expect(reconcileCatalogSelection(data, { category: "mixer", productId: "mixer-test" })).toEqual({
      category: "mixer",
      productId: "mixer-test",
      presentationId: "mixer-test:lata",
      quantity: 1,
    });
    expect(reconcileCatalogSelection(data, { category: "wine", productId: "mixer-test", presentationId: "mixer-test:lata", quantity: 2 })).toEqual({
      category: "wine",
      productId: "",
      presentationId: "",
      quantity: 2,
    });
    expect(reconcileCatalogSelection(data, { category: "wine", productId: "wine-test", presentationId: "mixer-test:lata", quantity: 1200 })).toEqual({
      category: "wine",
      productId: "wine-test",
      presentationId: "",
      quantity: 999,
    });
    expect(normalizeCatalogQuantity(3.8)).toBe(3);
    expect(normalizeCatalogQuantity(0)).toBe(1);
  });

  it("builds a generic line from the selected product and presentation with variant and current price", () => {
    const wine = product({ id: "wine-test", slug: "wine-test", name: "Vino Test", category: "wine", style: "Reserva" });
    const bottle = presentation({ id: "wine-test:750ml", productId: "wine-test", label: "Botella 750ml", unitPrice: 12000 });
    const line = createCommercialCartItem(wine, bottle);

    expect(line).toMatchObject({
      id: "category=wine|product=wine-test|presentation=wine-test:750ml|variant=Reserva",
      name: "Vino Test — Reserva — Botella 750ml",
      price: 12000,
      productCategory: "wine",
      productId: "wine-test",
      presentationId: "wine-test:750ml",
      variantLabel: "Reserva",
    });
  });
});
