import { describe, expect, it } from "vitest";
import { calculateBarrelRecommendation, type BarrelRecommendation } from "./barrelCalculator";
import {
  beerCatalog,
  createBeerCartItem,
  tastingPack,
  type Beer,
  type BeerPresentationId,
} from "./beerCatalog";
import type { StoredCartItem } from "./cartStorage";
import {
  buildRecommendedBarrelItems,
  hasCurrentSelectionInCart,
  hasTastingPack,
  preparePendingBarrelRecommendation,
} from "./orderFlow";

function planFromParts(parts: { presentationId: BeerPresentationId; size: number; count: number; price: number }[]): BarrelRecommendation {
  const coveredLiters = parts.reduce((sum, part) => sum + part.size * part.count, 0);
  return {
    requiredLiters: coveredLiters,
    coveredLiters,
    excessLiters: 0,
    totalPrice: parts.reduce((sum, part) => sum + part.price * part.count, 0),
    estimatedPrice: parts.reduce((sum, part) => sum + part.price * part.count, 0),
    totalBarrels: parts.reduce((sum, part) => sum + part.count, 0),
    parts,
    label: parts.map((part) => `${part.count}x ${part.size}L`).join(" + "),
  };
}

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

  it("builds one 30L cart item with quantity 2 for a 2x30 plan", () => {
    const ipa = beerCatalog[2];
    const plan = planFromParts([
      { presentationId: "barril30L", size: 30, count: 2, price: 54000 },
    ]);

    expect(buildRecommendedBarrelItems(ipa, plan)).toMatchObject([
      {
        id: "category=beer|product=ipa|presentation=ipa:barril30L|variant=IPA",
        name: "IPA — Barril 30L",
        price: 66000,
        qty: 2,
        category: "barril",
      },
    ]);
  });

  it("groups 50L plus repeated 20L barrels into canonical cart items", () => {
    const ipa = beerCatalog[2];
    const plan = planFromParts([
      { presentationId: "barril50L", size: 50, count: 1, price: 85000 },
      { presentationId: "barril20L", size: 20, count: 1, price: 38000 },
      { presentationId: "barril20L", size: 20, count: 1, price: 38000 },
    ]);

    expect(buildRecommendedBarrelItems(ipa, plan)).toMatchObject([
      {
        id: "category=beer|product=ipa|presentation=ipa:barril50L|variant=IPA",
        name: "IPA — Barril 50L",
        price: 105000,
        qty: 1,
        category: "barril",
      },
      {
        id: "category=beer|product=ipa|presentation=ipa:barril20L|variant=IPA",
        name: "IPA — Barril 20L",
        price: 46000,
        qty: 2,
        category: "barril",
      },
    ]);
  });

  it("uses the real price for the selected beer style", () => {
    const ipa = beerCatalog[2];
    const plan = planFromParts([
      { presentationId: "barril30L", size: 30, count: 1, price: 54000 },
    ]);

    expect(buildRecommendedBarrelItems(ipa, plan)[0].price).toBe(ipa.precios.barril30L);
  });

  it("does not copy the calculator minimum estimate into cart items", () => {
    const ipa = beerCatalog[2];
    const plan = calculateBarrelRecommendation(60);

    expect(plan.estimatedPrice).toBe(108000);
    expect(buildRecommendedBarrelItems(ipa, plan)).toMatchObject([
      expect.objectContaining({ id: "category=beer|product=ipa|presentation=ipa:barril30L|variant=IPA", price: 66000, qty: 2 }),
    ]);
  });

  it("prepares a pending recommendation without modifying existing cart items", () => {
    const cart: StoredCartItem[] = [{ ...createBeerCartItem(beerCatalog[0], "growler1L"), qty: 3 }];
    const before = JSON.stringify(cart);
    const plan = calculateBarrelRecommendation(60);

    expect(preparePendingBarrelRecommendation(plan)).toBe(plan);
    expect(JSON.stringify(cart)).toBe(before);
  });

  it("lets a new pending recommendation replace the previous pending recommendation", () => {
    const first = calculateBarrelRecommendation(60);
    const second = calculateBarrelRecommendation(90);
    let pending: BarrelRecommendation | null = preparePendingBarrelRecommendation(first);

    pending = preparePendingBarrelRecommendation(second);

    expect(pending).toBe(second);
    expect(pending).not.toBe(first);
  });

  it("keeps navigation/preparation separate from explicit application", () => {
    const existingItems: StoredCartItem[] = [{ ...createBeerCartItem(beerCatalog[0], "porron500ml"), qty: 6 }];
    const pending = preparePendingBarrelRecommendation(calculateBarrelRecommendation(90));

    expect(pending.parts).toHaveLength(2);
    expect(existingItems).toMatchObject([{ ...createBeerCartItem(beerCatalog[0], "porron500ml"), qty: 6 }]);
  });

  it("generates the exact items for explicit recommendation application", () => {
    const blonde = beerCatalog[0];
    const plan = calculateBarrelRecommendation(90);

    expect(buildRecommendedBarrelItems(blonde, plan)).toMatchObject([
      expect.objectContaining({ id: "category=beer|product=blonde-ale|presentation=blonde-ale:barril50L|variant=Blonde Ale", price: 85000, qty: 1 }),
      expect.objectContaining({ id: "category=beer|product=blonde-ale|presentation=blonde-ale:barril20L|variant=Blonde Ale", price: 38000, qty: 2 }),
    ]);
  });

  it("throws a clear error when the selected beer lacks a required barrel presentation", () => {
    const beerWithout30L: Beer = {
      ...beerCatalog[0],
      presentations: beerCatalog[0].presentations.filter((presentation) => presentation.id !== "barril30L"),
    };
    const plan = planFromParts([
      { presentationId: "barril30L", size: 30, count: 1, price: 54000 },
    ]);

    expect(() => buildRecommendedBarrelItems(beerWithout30L, plan)).toThrow(
      "Beer blonde-ale does not have required barrel presentation barril30L",
    );
  });

  it("does not mutate the selected beer or barrel plan", () => {
    const ipa = beerCatalog[2];
    const plan = calculateBarrelRecommendation(90);
    const beerBefore = JSON.stringify(ipa);
    const planBefore = JSON.stringify(plan);

    buildRecommendedBarrelItems(ipa, plan);

    expect(JSON.stringify(ipa)).toBe(beerBefore);
    expect(JSON.stringify(plan)).toBe(planBefore);
  });
});
