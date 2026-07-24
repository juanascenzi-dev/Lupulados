import { describe, expect, it } from "vitest";
import { beerCatalog, createBeerCartItem, tastingPack } from "./beerCatalog";
import { hasCurrentSelectionInCart, hasTastingPack } from "./orderFlow";

describe("orderFlow", () => {
  it("validates step 3 against the current beer and order type", () => {
    const blonde = beerCatalog[0];
    const ipa = beerCatalog[2];
    const items = [{ ...createBeerCartItem(blonde, "barril20L"), qty: 1 }];

    expect(hasCurrentSelectionInCart(items, blonde, "barril")).toBe(true);
    expect(hasCurrentSelectionInCart(items, ipa, "barril")).toBe(false);
    expect(hasCurrentSelectionInCart(items, blonde, "growler")).toBe(false);
  });

  it("detects the tasting pack without adding duplicate quantities", () => {
    const items = [{ ...tastingPack, qty: 1 }];

    expect(hasTastingPack(items)).toBe(true);
    expect(hasCurrentSelectionInCart(items, null, "paquete")).toBe(true);
  });
});
