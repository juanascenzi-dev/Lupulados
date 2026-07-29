import { describe, expect, it, vi } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  CART_STORAGE_KEY,
  CURRENT_CART_STORAGE_VERSION,
  MAX_CART_ITEM_QTY,
  addCartItemToCart,
  getCartItemSubtotal,
  getCartLineKey,
  getCartTotal,
  normalizeCartQuantity,
  parseCartItems,
  readCartItems,
  reconcileCartItemsWithSnapshot,
  updateCartItemQuantity,
  writeCartItems,
  type StoredCartItem,
} from "./cartStorage";
import type { CommercialSnapshot, Product, ProductPresentation } from "./commercialTypes";
import { createCartLineKey } from "./productCatalog";

const beerLine = {
  id: createCartLineKey({
    category: "barril",
    productCategory: "beer",
    productId: "blonde-ale",
    presentationId: "blonde-ale:barril20L",
    variantId: "Blonde Ale",
  }),
  name: "Blonde Ale - Barril 20L",
  price: 38000,
  category: "barril",
  productCategory: "beer" as const,
  productId: "blonde-ale",
  productName: "Blonde Ale",
  presentationId: "blonde-ale:barril20L",
  presentationType: "barril20L",
  presentationLabel: "Barril 20L",
  variantId: "Blonde Ale",
  variantLabel: "Blonde Ale",
} satisfies Omit<StoredCartItem, "qty">;

function withGenericProducts(): CommercialSnapshot {
  const wine: Product = {
    id: "malbec-test",
    slug: "malbec-test",
    name: "Malbec Test",
    description: "Fixture de test",
    category: "wine",
    image: "https://example.com/wine.jpg",
    status: "active",
    sortOrder: 900,
  };
  const mixer: Product = {
    id: "tonic-test",
    slug: "tonic-test",
    name: "Tonica Test",
    description: "Fixture de test",
    category: "mixer",
    image: "https://example.com/mixer.jpg",
    status: "active",
    sortOrder: 901,
  };
  const accessory: Product = {
    id: "cups-test",
    slug: "cups-test",
    name: "Vasos Test",
    description: "Fixture de test",
    category: "accessory",
    image: "https://example.com/cups.jpg",
    status: "active",
    sortOrder: 902,
  };
  const presentations: ProductPresentation[] = [
    {
      id: "malbec-test:750ml",
      productId: "malbec-test",
      presentationType: "750ml",
      label: "Botella 750ml",
      volumeLiters: 0.75,
      unitPrice: 12000,
      category: "pack",
      active: true,
      sortOrder: 900,
    },
    {
      id: "tonic-test:lata",
      productId: "tonic-test",
      presentationType: "lata",
      label: "Lata",
      volumeLiters: 0.354,
      unitPrice: 1800,
      category: "pack",
      active: true,
      sortOrder: 901,
    },
    {
      id: "cups-test:unidad",
      productId: "cups-test",
      presentationType: "unidad",
      label: "Unidad",
      volumeLiters: 0,
      unitPrice: 500,
      category: "pack",
      active: true,
      sortOrder: 902,
    },
  ];

  return {
    ...structuredClone(commercialSnapshot),
    products: [...commercialSnapshot.products, wine, mixer, accessory],
    productPresentations: [...commercialSnapshot.productPresentations, ...presentations],
  };
}

describe("cartStorage", () => {
  it("returns an empty cart when no stored value exists or payload is corrupt", () => {
    expect(parseCartItems(null)).toEqual([]);
    expect(parseCartItems("{bad-json")).toEqual([]);
    expect(parseCartItems(JSON.stringify({ items: [{ id: 1 }] }))).toEqual([]);
  });

  it("filters invalid stored items and normalizes excessive quantities", () => {
    const parsed = parseCartItems(JSON.stringify([
      { ...beerLine, qty: 1 },
      { ...beerLine, id: "too-many", presentationId: "blonde-ale:barril30L", qty: MAX_CART_ITEM_QTY + 1 },
      { id: "broken", name: "Broken", price: 0, qty: 0, category: "barril" },
    ]));

    expect(parsed).toEqual([
      { ...beerLine, qty: 1 },
      { ...beerLine, id: "too-many", presentationId: "blonde-ale:barril30L", qty: MAX_CART_ITEM_QTY },
    ]);
    expect(normalizeCartQuantity(1.8)).toBe(1);
    expect(normalizeCartQuantity(MAX_CART_ITEM_QTY + 10)).toBe(MAX_CART_ITEM_QTY);
  });

  it("clears corrupt persisted cart values and ignores write failures", () => {
    const storage = {
      getItem: vi.fn(() => "{bad-json"),
      removeItem: vi.fn(),
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(readCartItems(storage)).toEqual([]);
    expect(storage.removeItem).toHaveBeenCalledWith(CART_STORAGE_KEY);
    expect(() => writeCartItems(storage, [])).not.toThrow();
  });

  it("writes and restores the current versioned cart payload while reading v2 payloads", () => {
    const storage = { setItem: vi.fn() };

    writeCartItems(storage, [{ ...beerLine, qty: 1 }]);

    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toMatchObject({
      version: CURRENT_CART_STORAGE_VERSION,
      items: [{ id: beerLine.id, qty: 1 }],
    });
    expect(parseCartItems(JSON.stringify({ version: CURRENT_CART_STORAGE_VERSION, items: [{ ...beerLine, qty: 1 }] }))).toHaveLength(1);
    expect(parseCartItems(JSON.stringify({ version: 2, items: [{ ...beerLine, qty: 1 }] }))).toHaveLength(1);
  });

  it("migrates legacy beerId and beerName into generic product fields", () => {
    const parsed = parseCartItems(JSON.stringify([
      {
        id: "ipa:barril50L",
        name: "IPA - Barril 50L",
        price: 105000,
        qty: 1,
        category: "barril",
        beerId: "ipa",
        beerName: "IPA",
      },
    ]));

    expect(parsed[0]).toMatchObject({
      productCategory: "beer",
      productId: "ipa",
      productName: "IPA",
      beerId: "ipa",
      beerName: "IPA",
    });
  });

  it("uses a deterministic cart line key that ignores visible names", () => {
    const renamed = { ...beerLine, name: "Nombre visible nuevo", productName: "Otro nombre" };

    expect(getCartLineKey(beerLine)).toBe(getCartLineKey(renamed));
    expect(getCartLineKey(beerLine)).toBe(
      "category=beer|product=blonde-ale|presentation=blonde-ale:barril20L|variant=Blonde Ale",
    );
  });

  it("increments exact repeats and keeps different presentations, products, categories and variants separate", () => {
    const sameProductDifferentPresentation = {
      ...beerLine,
      id: createCartLineKey({
        category: "barril",
        productCategory: "beer",
        productId: "blonde-ale",
        presentationId: "blonde-ale:barril30L",
        variantId: "Blonde Ale",
      }),
      presentationId: "blonde-ale:barril30L",
      presentationType: "barril30L",
      presentationLabel: "Barril 30L",
      price: 54000,
    };
    const samePresentationDifferentProduct = {
      ...beerLine,
      id: createCartLineKey({
        category: "barril",
        productCategory: "beer",
        productId: "ipa",
        presentationId: "ipa:barril20L",
        variantId: "IPA",
      }),
      productId: "ipa",
      productName: "IPA",
      presentationId: "ipa:barril20L",
      variantId: "IPA",
      variantLabel: "IPA",
      price: 46000,
    };
    const genericWine = {
      ...beerLine,
      id: createCartLineKey({
        category: "pack",
        productCategory: "wine",
        productId: "malbec-test",
        presentationId: "malbec-test:750ml",
        variantId: "reserva",
      }),
      category: "pack",
      productCategory: "wine" as const,
      productId: "malbec-test",
      productName: "Malbec Test",
      presentationId: "malbec-test:750ml",
      presentationType: "750ml",
      presentationLabel: "Botella 750ml",
      variantId: "reserva",
      variantLabel: "Reserva",
      price: 12000,
    };

    const items = [beerLine, sameProductDifferentPresentation, samePresentationDifferentProduct, genericWine].reduce<StoredCartItem[]>(
      (cart, item) => addCartItemToCart(cart, item),
      addCartItemToCart([], beerLine, 2),
    );

    expect(items).toHaveLength(4);
    expect(items[0].qty).toBe(3);
    expect(items.map((item) => item.id)).toEqual([
      beerLine.id,
      sameProductDifferentPresentation.id,
      samePresentationDifferentProduct.id,
      genericWine.id,
    ]);
  });

  it("changes quantity, prevents invalid quantity and removes only the addressed line", () => {
    const other = { ...beerLine, id: "other-line", productId: "ipa", presentationId: "ipa:barril20L" };
    const items = addCartItemToCart(addCartItemToCart([], beerLine, 2), other, 1);

    expect(updateCartItemQuantity(items, beerLine.id, 4)).toMatchObject([{ id: beerLine.id, qty: 4 }, { id: other.id, qty: 1 }]);
    expect(updateCartItemQuantity(items, beerLine.id, Number.NaN)).toEqual([expect.objectContaining({ id: other.id })]);
    expect(updateCartItemQuantity(items, beerLine.id, 0)).toEqual([expect.objectContaining({ id: other.id })]);
  });

  it("calculates line subtotal and total across lines", () => {
    const growler = {
      ...beerLine,
      id: "category=beer|product=honey-wheat|presentation=honey-wheat:growler2L|variant=Honey / Wheat",
      price: 6200,
      productId: "honey-wheat",
      productName: "Honey / Wheat",
      presentationId: "honey-wheat:growler2L",
      presentationType: "growler2L",
      presentationLabel: "Growler 2L",
      variantId: "Honey / Wheat",
      variantLabel: "Honey / Wheat",
    };
    const items = addCartItemToCart(addCartItemToCart([], beerLine, 1), growler, 2);

    expect(getCartItemSubtotal(items[1])).toBe(12400);
    expect(getCartTotal(items)).toBe(50400);
  });

  it("reconciles persisted cart items with current catalog names and prices", () => {
    const snapshot = structuredClone(commercialSnapshot);
    snapshot.productPresentations = snapshot.productPresentations.map((presentation) =>
      presentation.id === "ipa:barril50L" ? { ...presentation, unitPrice: 123456, label: "Barril 50L actualizado" } : presentation,
    );

    const items = reconcileCartItemsWithSnapshot([
      { id: "ipa:barril50L", name: "Nombre viejo", price: 1, qty: 2, category: "barril" },
    ], snapshot);

    expect(items).toEqual([
      expect.objectContaining({
        id: "category=beer|product=ipa|presentation=ipa:barril50L|variant=IPA",
        name: "IPA — Barril 50L actualizado",
        price: 123456,
        qty: 2,
        productCategory: "beer",
        productId: "ipa",
        productName: "IPA",
        presentationId: "ipa:barril50L",
        presentationType: "barril50L",
        presentationLabel: "Barril 50L actualizado",
      }),
    ]);
  });

  it("drops inactive products, inactive presentations and missing catalog records", () => {
    const snapshot = {
      ...structuredClone(commercialSnapshot),
      products: commercialSnapshot.products.map((product) =>
        product.id === "ipa" ? { ...product, status: "archived" as const } : product,
      ),
      productPresentations: commercialSnapshot.productPresentations.map((presentation) =>
        presentation.id === "apa:barril20L" ? { ...presentation, active: false } : presentation,
      ),
    };

    const items = reconcileCartItemsWithSnapshot([
      { id: "ipa:barril50L", name: "IPA vieja", price: 1, qty: 1, category: "barril" },
      { id: "apa:barril20L", name: "APA vieja", price: 1, qty: 1, category: "barril" },
      { id: "missing-product:barril20L", name: "Missing", price: 1, qty: 1, category: "barril" },
    ], snapshot);

    expect(items).toEqual([]);
  });

  it("drops active persisted lines when the current presentation has no positive price", () => {
    const snapshot = {
      ...structuredClone(commercialSnapshot),
      productPresentations: commercialSnapshot.productPresentations.map((presentation) =>
        presentation.id === "ipa:barril50L" ? { ...presentation, unitPrice: 0 } : presentation,
      ),
    };

    const items = reconcileCartItemsWithSnapshot([
      { id: "ipa:barril50L", name: "IPA vieja", price: 105000, qty: 1, category: "barril" },
    ], snapshot);

    expect(items).toEqual([]);
  });

  it("reconciles generic wine, mixer and accessory fixtures without beer fields", () => {
    const snapshot = withGenericProducts();
    const items = reconcileCartItemsWithSnapshot([
      { id: "malbec-test:750ml", name: "Viejo", price: 1, qty: 1, category: "pack", productCategory: "wine" },
      { id: "tonic-test:lata", name: "Viejo", price: 1, qty: 2, category: "pack", productCategory: "mixer" },
      { id: "cups-test:unidad", name: "Viejo", price: 1, qty: 3, category: "pack", productCategory: "accessory" },
    ], snapshot);

    expect(items).toMatchObject([
      { productCategory: "wine", productName: "Malbec Test", presentationLabel: "Botella 750ml", price: 12000, beerId: undefined },
      { productCategory: "mixer", productName: "Tonica Test", presentationLabel: "Lata", price: 1800, beerId: undefined },
      { productCategory: "accessory", productName: "Vasos Test", presentationLabel: "Unidad", price: 500, beerId: undefined },
    ]);
  });

  it("merges duplicate persisted items and preserves different generic lines", () => {
    const snapshot = withGenericProducts();
    const items = reconcileCartItemsWithSnapshot([
      { id: "malbec-test:750ml", name: "Malbec viejo", price: 1, qty: 1, category: "pack", productCategory: "wine" },
      { id: "malbec-test:750ml", name: "Malbec viejo", price: 1, qty: 2, category: "pack", productCategory: "wine" },
      { id: "tonic-test:lata", name: "Tonica vieja", price: 1, qty: 1, category: "pack", productCategory: "mixer" },
    ], snapshot);

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ productId: "malbec-test", qty: 3 });
    expect(items[1]).toMatchObject({ productId: "tonic-test", qty: 1 });
  });
});
