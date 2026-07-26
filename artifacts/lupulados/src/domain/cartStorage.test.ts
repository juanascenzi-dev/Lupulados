import { describe, expect, it, vi } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  CART_STORAGE_KEY,
  MAX_CART_ITEM_QTY,
  normalizeCartQuantity,
  parseCartItems,
  readCartItems,
  reconcileCartItemsWithSnapshot,
  writeCartItems,
} from "./cartStorage";

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

  it("normalizes invalid or excessive quantities", () => {
    expect(normalizeCartQuantity(Number.NaN)).toBe(0);
    expect(normalizeCartQuantity(-2)).toBe(0);
    expect(normalizeCartQuantity(1.8)).toBe(1);
    expect(normalizeCartQuantity(MAX_CART_ITEM_QTY + 10)).toBe(MAX_CART_ITEM_QTY);
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
});
