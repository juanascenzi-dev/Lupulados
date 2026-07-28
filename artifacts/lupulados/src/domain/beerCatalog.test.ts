import { describe, expect, it } from "vitest";
import {
  barrelPresentationIds,
  beerCatalog,
  createBeerCartItem,
  growlerPresentationIds,
  orderTypeOptions,
  packagedPresentationIds,
  tastingPack,
} from "./beerCatalog";
import { formatPrice } from "./format";

describe("beerCatalog", () => {
  it("has unique stable beer ids", () => {
    const ids = beerCatalog.map((beer) => beer.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has valid prices and presentations for every beer", () => {
    for (const beer of beerCatalog) {
      expect(beer.presentations.length).toBeGreaterThan(0);
      expect(new Set(beer.presentations.map((presentation) => presentation.id)).size).toBe(beer.presentations.length);

      for (const presentation of beer.presentations) {
        expect(presentation.price).toBeGreaterThan(0);
        expect(beer.precios[presentation.id]).toBe(presentation.price);
      }
    }
  });

  it("uses Porrón 500ml as the packaged beer presentation", () => {
    const blonde = beerCatalog[0];
    const porron = blonde.presentations.find((presentation) => presentation.id === packagedPresentationIds[0]);

    expect(porron?.label).toBe("Porrón 500ml");
    expect(porron?.price).toBe(1800);
    expect(blonde.precios.porron500ml).toBe(1800);
  });

  it("creates stable cart ids from beer and presentation ids", () => {
    const item = createBeerCartItem(beerCatalog[0], "barril30L");

    expect(item).toMatchObject({
      id: "category=beer|product=blonde-ale|presentation=blonde-ale:barril30L|variant=Blonde Ale",
      name: "Blonde Ale — Barril 30L",
      price: 54000,
      category: "barril",
      productCategory: "beer",
      presentationId: "blonde-ale:barril30L",
      presentationType: "barril30L",
    });
  });

  it("derives order type starting prices from canonical numeric prices", () => {
    const minimumPrice = (presentationIds: typeof barrelPresentationIds) =>
      Math.min(...beerCatalog.flatMap((beer) => presentationIds.map((presentationId) => beer.precios[presentationId])));

    expect(orderTypeOptions.find((option) => option.id === "barril")).toMatchObject({
      desdePrice: minimumPrice(barrelPresentationIds),
      desde: `Desde ${formatPrice(minimumPrice(barrelPresentationIds))}`,
    });
    expect(orderTypeOptions.find((option) => option.id === "growler")).toMatchObject({
      desdePrice: minimumPrice(growlerPresentationIds),
      desde: `Desde ${formatPrice(minimumPrice(growlerPresentationIds))}`,
    });
    expect(orderTypeOptions.find((option) => option.id === "porrón")).toMatchObject({
      desdePrice: minimumPrice(packagedPresentationIds),
      desde: `Desde ${formatPrice(minimumPrice(packagedPresentationIds))} c/u`,
    });
    expect(orderTypeOptions.find((option) => option.id === "paquete")).toMatchObject({
      desdePrice: tastingPack.price,
      desde: formatPrice(tastingPack.price),
    });
  });
});
