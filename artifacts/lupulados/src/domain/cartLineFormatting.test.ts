import { describe, expect, it } from "vitest";
import {
  getCartLineBeer,
  getCartLinePresentation,
  getCartLineTitle,
  getCompactCartLineDescription,
  getPresentationDetails,
} from "./cartLineFormatting";
import type { ProductPresentation } from "@/domain/commercialTypes";

describe("getCartLineTitle", () => {
  it("uses productName for a pack item when available", () => {
    expect(
      getCartLineTitle({ category: "pack", productName: "Pack degustación", name: "fallback" }),
    ).toBe("Pack degustación");
  });

  it("falls back to name for a pack item without productName", () => {
    expect(getCartLineTitle({ category: "pack", name: "Pack degustación" })).toBe(
      "Pack degustación",
    );
  });

  it("prefers productName over beerName and name for non-pack items", () => {
    expect(
      getCartLineTitle({
        category: "beer",
        productName: "IPA Artesanal",
        beerName: "IPA",
        name: "fallback",
      }),
    ).toBe("IPA Artesanal");
  });

  it("falls back to beerName when productName is missing", () => {
    expect(getCartLineTitle({ category: "beer", beerName: "IPA", name: "fallback" })).toBe("IPA");
  });

  it("falls back to name when neither productName nor beerName exist", () => {
    expect(getCartLineTitle({ category: "beer", name: "IPA — Barril 20L" })).toBe(
      "IPA — Barril 20L",
    );
  });
});

describe("getCartLineBeer", () => {
  it("returns the category label for a known non-beer category without a variant label", () => {
    expect(
      getCartLineBeer({ category: "product", productCategory: "wine", name: "Vino Malbec" }),
    ).toBe("Vinos");
  });

  it("returns the variant label when it differs from the product name", () => {
    expect(
      getCartLineBeer({
        category: "product",
        productCategory: "wine",
        productName: "Vino",
        variantLabel: "Malbec",
        name: "Vino Malbec",
      }),
    ).toBe("Malbec");
  });

  it("ignores the variant label when it equals the product name", () => {
    expect(
      getCartLineBeer({
        category: "product",
        productCategory: "wine",
        productName: "Vino Malbec",
        variantLabel: "Vino Malbec",
        name: "Vino Malbec",
      }),
    ).toBe("Vinos");
  });

  it("falls back to the beer branch for an unrecognized productCategory", () => {
    expect(
      getCartLineBeer({
        category: "beer",
        productCategory: "unknown-category",
        beerName: "IPA",
        name: "fallback",
      }),
    ).toBe("IPA");
  });

  it("returns null for a pack item", () => {
    expect(getCartLineBeer({ category: "pack", name: "Pack degustación" })).toBeNull();
  });

  it("parses the style out of a legacy name with an em dash", () => {
    expect(getCartLineBeer({ category: "beer", name: "IPA — Barril 20L" })).toBe("IPA");
  });

  it("returns the full name when there is no em dash to split on", () => {
    expect(getCartLineBeer({ category: "beer", name: "IPA Artesanal" })).toBe("IPA Artesanal");
  });
});

describe("getCartLinePresentation", () => {
  it("uses presentationLabel when available", () => {
    expect(
      getCartLinePresentation({ presentationLabel: "Barril 20L", name: "IPA — Barril 20L" }),
    ).toBe("Barril 20L");
  });

  it("parses the suffix after the em dash when presentationLabel is missing", () => {
    expect(getCartLinePresentation({ name: "IPA — Barril 20L" })).toBe("Barril 20L");
  });

  it("returns null when there is neither presentationLabel nor an em dash", () => {
    expect(getCartLinePresentation({ name: "IPA Artesanal" })).toBeNull();
  });
});

describe("getCompactCartLineDescription", () => {
  it("counts unique styles in a configurable beer pack, deduplicating repeated products", () => {
    const description = getCompactCartLineDescription({
      category: "pack",
      qty: 2,
      name: "Pack porrones",
      pack: {
        type: "configurable-beer-pack",
        capacity: 6,
        composition: [{ productId: "ipa" }, { productId: "ipa" }, { productId: "stout" }],
      },
    });
    expect(description).toBe("12 porrones · 2 estilos");
  });

  it("uses singular 'estilo' when the pack has exactly one distinct style", () => {
    const description = getCompactCartLineDescription({
      category: "pack",
      qty: 1,
      name: "Pack porrones",
      pack: {
        type: "configurable-beer-pack",
        capacity: 6,
        composition: [{ productId: "ipa" }],
      },
    });
    expect(description).toBe("6 porrones · 1 estilo");
  });

  it("returns a fixed description for the tasting pack", () => {
    expect(
      getCompactCartLineDescription({ category: "pack", qty: 1, name: "Pack degustación" }),
    ).toBe("6 estilos surtidos");
  });

  it("prefers presentationLabel over the rest of the fallback cascade", () => {
    expect(
      getCompactCartLineDescription({
        category: "beer",
        qty: 1,
        name: "fallback",
        presentationLabel: "Barril 20L",
        variantLabel: "IPA",
      }),
    ).toBe("Barril 20L");
  });

  it("falls back to variantLabel when presentationLabel is missing", () => {
    expect(
      getCompactCartLineDescription({
        category: "beer",
        qty: 1,
        name: "fallback",
        variantLabel: "IPA",
      }),
    ).toBe("IPA");
  });

  it("falls back to the parsed presentation, then to the category", () => {
    expect(
      getCompactCartLineDescription({ category: "beer", qty: 1, name: "IPA — Barril 20L" }),
    ).toBe("Barril 20L");
    expect(getCompactCartLineDescription({ category: "beer", qty: 1, name: "IPA" })).toBe("beer");
  });
});

function buildPresentation(overrides: Partial<ProductPresentation> = {}): ProductPresentation {
  return {
    id: "presentation-1",
    productId: "product-1",
    label: "Barril 20L",
    presentationType: "Barril",
    volumeLiters: 20,
    unitPrice: 10000,
    category: "barril",
    description: "Barril de 20 litros",
    ...overrides,
  };
}

describe("getPresentationDetails", () => {
  it("includes description, volume and presentationType when all are meaningful", () => {
    expect(getPresentationDetails(buildPresentation())).toEqual([
      "Barril de 20 litros",
      "20 L",
      "Barril",
    ]);
  });

  it("omits the volume when volumeLiters is 0", () => {
    expect(getPresentationDetails(buildPresentation({ volumeLiters: 0 }))).toEqual([
      "Barril de 20 litros",
      "Barril",
    ]);
  });

  it("does not duplicate presentationType when it equals the label", () => {
    expect(getPresentationDetails(buildPresentation({ presentationType: "Barril 20L" }))).toEqual([
      "Barril de 20 litros",
      "20 L",
    ]);
  });
});
