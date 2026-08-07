import { describe, expect, it } from "vitest";
import { formatPercent, getSavingsCopy } from "./storePageFormatting";
import type { PresentationComparison } from "./storePricing";
import type { ProductPresentation } from "./commercialTypes";

describe("formatPercent", () => {
  it("returns '0%' for NaN", () => {
    expect(formatPercent(NaN)).toBe("0%");
  });

  it("returns '0%' for a negative value", () => {
    expect(formatPercent(-0.1)).toBe("0%");
  });

  it("returns '0%' for exactly zero", () => {
    expect(formatPercent(0)).toBe("0%");
  });

  it("formats a fraction as a rounded percentage", () => {
    expect(formatPercent(0.5)).toBe("50%");
  });

  it("rounds to the nearest integer percent", () => {
    expect(formatPercent(0.155)).toBe("16%");
    expect(formatPercent(0.154)).toBe("15%");
  });
});

function buildReferencePresentation(
  overrides: Partial<ProductPresentation> = {},
): ProductPresentation {
  return {
    id: "ref-presentation",
    productId: "beer-1",
    presentationType: "growler1L",
    label: "Growler 1L",
    volumeLiters: 1,
    unitPrice: 4000,
    category: "growler",
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

function buildComparison(overrides: Partial<PresentationComparison> = {}): PresentationComparison {
  return {
    presentation: buildReferencePresentation({ id: "current" }),
    effectiveUnitPrice: 3500,
    unitLabel: "unidad",
    referencePresentation: null,
    referenceCost: null,
    savings: 0,
    savingsRate: 0,
    hasSavings: false,
    promotionalSavings: 0,
    promotionalSavingsRate: 0,
    hasPromotionalSavings: false,
    isBestValue: false,
    bestValueLabel: null,
    ...overrides,
  };
}

describe("getSavingsCopy", () => {
  it("returns null when there is no comparison", () => {
    expect(getSavingsCopy(null)).toBeNull();
  });

  it("prioritizes promotional savings over volume savings even when both have values", () => {
    const comparison = buildComparison({
      hasPromotionalSavings: true,
      promotionalSavings: 1000,
      promotionalSavingsRate: 0.2,
      savings: 500,
      savingsRate: 0.1,
      referencePresentation: buildReferencePresentation(),
    });
    expect(getSavingsCopy(comparison)).toBe("Ahorras $1.000 (20%)");
  });

  it("includes the reference presentation label when there is no promotion", () => {
    const comparison = buildComparison({
      hasPromotionalSavings: false,
      savings: 500,
      savingsRate: 0.1,
      referencePresentation: buildReferencePresentation(),
    });
    // getHumanPresentationLabel derives "Growler 1 L" from presentationType "growler1L",
    // ignoring the raw `label` field when a canonical mapping exists.
    expect(getSavingsCopy(comparison)).toBe("Ahorras $500 comparado con Growler 1 L");
  });

  it("falls back to the generic percentage copy when there is no reference presentation", () => {
    const comparison = buildComparison({
      hasPromotionalSavings: false,
      savings: 500,
      savingsRate: 0.1,
      referencePresentation: null,
    });
    expect(getSavingsCopy(comparison)).toBe("Ahorras $500 (10%)");
  });

  it("returns null when savings are not positive, with or without a promotion", () => {
    expect(
      getSavingsCopy(buildComparison({ hasPromotionalSavings: true, promotionalSavings: 0 })),
    ).toBeNull();
    expect(
      getSavingsCopy(buildComparison({ hasPromotionalSavings: false, savings: 0 })),
    ).toBeNull();
  });
});
