import { describe, expect, it } from "vitest";
import { beerCatalog, createBeerCartItem } from "./beerCatalog";
import { calculateOrderSummary, type OrderSummaryExtras, type OrderSummaryItem } from "./orderSummary";

const baseExtras: OrderSummaryExtras = {
  chopera: false,
  delivery: "fabrica",
  hielo: 0,
  vasos: 0,
  promoCode: "",
  discount: 0,
};

describe("orderSummary", () => {
  it("summarizes the current beer order with correct units, liters and totals", () => {
    const items = [
      { ...createBeerCartItem(beerCatalog[2], "barril50L"), qty: 1 },
      { ...createBeerCartItem(beerCatalog[1], "barril20L"), qty: 2 },
    ];

    const summary = calculateOrderSummary(items, baseExtras);

    expect(summary.totalItems).toBe(3);
    expect(summary.totalLiters).toBe(90);
    expect(summary.itemsSubtotal).toBe(189000);
    expect(summary.total).toBe(189000);
    expect(summary.items.map((item) => item.productName)).toEqual(["IPA", "American Pale Ale (APA)"]);
  });

  it("summarizes a mixed generic test order with variants, optional presentations and accessories", () => {
    const items: OrderSummaryItem[] = [
      {
        id: "category=wine|product=malbec-test|presentation=malbec-test:750ml|variant=reserva",
        name: "Malbec Test - Reserva - Botella 750ml",
        price: 12000,
        qty: 2,
        category: "pack",
        productCategory: "wine",
        productId: "malbec-test",
        productName: "Malbec Test",
        presentationId: "malbec-test:750ml",
        presentationLabel: "Botella 750ml",
        variantId: "reserva",
        variantLabel: "Reserva",
      },
      {
        id: "category=accessory|product=cups-test|presentation=cups-test:unidad",
        name: "Vasos Test - Unidad",
        price: 500,
        qty: 10,
        category: "pack",
        productCategory: "accessory",
        productId: "cups-test",
        productName: "Vasos Test",
        presentationId: "cups-test:unidad",
        presentationLabel: "Unidad",
      },
    ];

    const summary = calculateOrderSummary(items, baseExtras);
    const serialized = JSON.stringify(summary);

    expect(summary.totalItems).toBe(12);
    expect(summary.itemsSubtotal).toBe(29000);
    expect(summary.total).toBe(29000);
    expect(summary.items[0]).toMatchObject({ variantLabel: "Reserva", presentationLabel: "Botella 750ml" });
    expect(summary.items[1]).toMatchObject({ productCategory: "accessory" });
    expect(summary.items[1]).not.toHaveProperty("variantLabel");
    expect(serialized).not.toContain("undefined");
    expect(serialized).not.toContain("null");
    expect(serialized).not.toContain("NaN");
    expect(serialized).not.toContain("[object Object]");
  });
});
