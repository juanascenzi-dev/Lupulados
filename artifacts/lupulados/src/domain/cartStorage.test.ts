import { describe, expect, it, vi } from "vitest";
import { CART_STORAGE_KEY, parseCartItems, readCartItems, writeCartItems } from "./cartStorage";

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
});
