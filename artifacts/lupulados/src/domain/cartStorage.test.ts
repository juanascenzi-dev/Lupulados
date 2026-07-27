import { describe, expect, it, vi } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  CART_STORAGE_KEY,
  MAX_CART_ITEM_QTY,
  normalizeCartQuantity,
  parseCartItems,
  readCartItems,
  reconcileCartItemsWithSnapshot,
  addCartItemToCart,
  updateCartItemQuantity,
  getCartItemSubtotal,
  getCartTotal,
  writeCartItems,
} from "./cartStorage";
import type { StoredCartItem } from "./cartStorage";

describe("cartStorage", () => {
  it("returns an empty cart when no stored value exists", () => {
    expect(parseCartItems(null)).toEqual([]);
  });

  it("returns an empty cart for corrupt JSON", () => {
    expect(parseCartItems("{bad-json")).toEqual([]);
  });

  it.each(["null", "{}", JSON.stringify("not-a-cart"), JSON.stringify([{ id: 1 }, null, "bad-item"])])(
    "returns an empty cart for unexpected JSON values: %s",
    (rawValue) => {
      expect(parseCartItems(rawValue)).toEqual([]);
    },
  );

  it("filters invalid stored items", () => {
    const parsed = parseCartItems(JSON.stringify([
      { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, qty: 1, category: "barril" },
      { id: "broken", name: "Broken", price: 0, qty: 0, category: "barril" },
    ]));

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe("blonde-ale:barril20L");
  });

  it("clears corrupt persisted cart values", () => {
    const storage = {
      getItem: vi.fn(() => "{bad-json"),
      removeItem: vi.fn(),
    };

    expect(readCartItems(storage)).toEqual([]);
    expect(storage.removeItem).toHaveBeenCalledWith(CART_STORAGE_KEY);
  });

  it("does not throw if storage write fails", () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error("quota");
      }),
    };

    expect(() => writeCartItems(storage, [])).not.toThrow();
  });

  it("writes a versioned cart payload", () => {
    const storage = { setItem: vi.fn() };

    writeCartItems(storage, [
      { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, qty: 1, category: "barril" },
    ]);

    expect(JSON.parse(storage.setItem.mock.calls[0][1])).toMatchObject({
      version: 2,
      items: [{ id: "blonde-ale:barril20L", qty: 1 }],
    });
  });

  it("restores the versioned cart payload", () => {
    expect(parseCartItems(JSON.stringify({
      version: 2,
      items: [{ id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, qty: 1, category: "barril" }],
    }))).toHaveLength(1);
  });

  it("normalizes invalid or excessive quantities", () => {
    expect(normalizeCartQuantity(Number.NaN)).toBe(0);
    expect(normalizeCartQuantity(-2)).toBe(0);
    expect(normalizeCartQuantity(1.8)).toBe(1);
    expect(normalizeCartQuantity(MAX_CART_ITEM_QTY + 10)).toBe(MAX_CART_ITEM_QTY);
  });

  it("creates an empty cart and adds one line", () => {
    const items = addCartItemToCart([], {
      id: "blonde-ale:barril20L",
      name: "Blonde Ale — Barril 20L",
      price: 38000,
      category: "barril",
    });

    expect(items).toMatchObject([
      expect.objectContaining({ id: "blonde-ale:barril20L", qty: 1 }),
    ]);
  });

  it("adds several independent lines for different formats, beers and sizes", () => {
    const items = [
      { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, category: "barril" as const },
      { id: "session-ipa:barril30L", name: "Session IPA — Barril 30L", price: 60000, category: "barril" as const },
      { id: "honey-wheat:growler2L", name: "Honey / Wheat — Growler 2L", price: 6200, category: "growler" as const },
      { id: "stout:porron500ml", name: "Stout — Porrón 500ml", price: 2100, category: "porrÃ³n" as const },
    ].reduce<StoredCartItem[]>((cart, item) => addCartItemToCart(cart, item), []);

    expect(items.map((item) => item.id)).toEqual([
      "blonde-ale:barril20L",
      "session-ipa:barril30L",
      "honey-wheat:growler2L",
      "stout:porron500ml",
    ]);
  });

  it("increments quantity for an exactly repeated line", () => {
    const draft = { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, category: "barril" as const };
    const items = addCartItemToCart(addCartItemToCart([], draft, 2), draft, 3);

    expect(items).toEqual([expect.objectContaining({ id: draft.id, qty: 5 })]);
  });

  it("changes quantity, prevents invalid quantity and removes at zero", () => {
    const draft = { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, category: "barril" as const };
    const items = addCartItemToCart([], draft, 2);

    expect(updateCartItemQuantity(items, draft.id, 4)[0].qty).toBe(4);
    expect(updateCartItemQuantity(items, draft.id, Number.NaN)[0]).toBeUndefined();
    expect(updateCartItemQuantity(items, draft.id, 0)).toEqual([]);
  });

  it("calculates line subtotal and total across lines", () => {
    const items = addCartItemToCart(
      addCartItemToCart([], { id: "blonde-ale:barril20L", name: "Blonde Ale — Barril 20L", price: 38000, category: "barril" }, 1),
      { id: "honey-wheat:growler2L", name: "Honey / Wheat — Growler 2L", price: 6200, category: "growler" },
      2,
    );

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
      {
        id: "ipa:barril50L",
        name: "IPA — Barril 50L actualizado",
        price: 123456,
        qty: 2,
        category: "barril",
        productId: "ipa",
        productName: "IPA",
        beerId: "ipa",
        beerName: "IPA",
        presentationId: "barril50L",
        presentationLabel: "Barril 50L actualizado",
      },
    ]);
  });

  it("drops archived products and merges duplicate persisted items", () => {
    const snapshot = {
      ...structuredClone(commercialSnapshot),
      products: commercialSnapshot.products.map((product) =>
        product.id === "ipa" ? { ...product, status: "archived" as const } : product,
      ),
    };

    const items = reconcileCartItemsWithSnapshot([
      { id: "ipa:barril50L", name: "IPA vieja", price: 1, qty: 1, category: "barril" },
      { id: "apa:barril20L", name: "APA vieja", price: 1, qty: 1, category: "barril" },
      { id: "apa:barril20L", name: "APA vieja", price: 1, qty: 2, category: "barril" },
    ], snapshot);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: "apa:barril20L", price: 42000, qty: 3 });
  });

  it("drops nonexistent products, nonexistent presentations and presentations without active price", () => {
    const snapshot = {
      ...structuredClone(commercialSnapshot),
      productPresentations: commercialSnapshot.productPresentations.filter((presentation) => presentation.id !== "apa:barril20L"),
    };

    const items = reconcileCartItemsWithSnapshot([
      { id: "missing-product:barril20L", name: "Missing", price: 1, qty: 1, category: "barril" },
      { id: "apa:barril20L", name: "APA", price: 1, qty: 1, category: "barril" },
    ], snapshot);

    expect(items).toEqual([]);
  });

  it("keeps compatibility with the previous single-product behavior", () => {
    const legacy = JSON.stringify([
      { id: "ipa:barril50L", name: "IPA — Barril 50L", price: 105000, qty: 1, category: "barril" },
    ]);

    expect(reconcileCartItemsWithSnapshot(parseCartItems(legacy), commercialSnapshot)).toEqual([
      expect.objectContaining({ id: "ipa:barril50L", price: 105000, qty: 1 }),
    ]);
  });
});
