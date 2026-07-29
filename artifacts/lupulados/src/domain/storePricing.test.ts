import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { commercialSnapshot } from "./commercialData";
import { createCommercialCartItem } from "./productCatalog";
import {
  STORE_PRICE_RANGE_LABELS,
  buildStoreCatalog,
  filterStoreCatalog,
  getActiveStoreFilterCount,
  getStoreImageSource,
  sortStoreCatalog,
} from "./storeCatalog";
import {
  buildPresentationComparison,
  getBestValuePresentation,
  getEffectiveUnitPrice,
  getPresentationSavings,
  getProductMaxSavings,
} from "./storePricing";
import type { ProductPresentation } from "./commercialTypes";

function product(id: string) {
  const item = buildStoreCatalog(commercialSnapshot).find((candidate) => candidate.product.id === id);
  if (!item) throw new Error(`Missing product ${id}`);
  return item;
}

function presentation(productId: string, presentationType: string) {
  const item = product(productId);
  const found = item.presentations.find((candidate) => candidate.presentationType === presentationType);
  if (!found) throw new Error(`Missing presentation ${productId}:${presentationType}`);
  return { item, found };
}

describe("store pricing comparisons", () => {
  it("uses the smallest bottle as base for Malbec caja x6 and calculates effective price, savings and percentage", () => {
    const { item, found } = presentation("demo-wine-malbec", "caja6");
    const comparison = buildPresentationComparison(found, item.presentations);

    expect(comparison?.referencePresentation?.presentationType).toBe("750ml");
    expect(comparison?.effectiveUnitPrice).toBeCloseTo(41000 / 6);
    expect(comparison?.referenceCost).toBe(43200);
    expect(comparison?.savings).toBe(2200);
    expect(comparison?.savingsRate).toBeCloseTo(2200 / 43200);
  });

  it("compares barrels by liter with 20 L as base and identifies best value", () => {
    const item = product("blonde-ale");
    const barrel20 = item.presentations.find((candidate) => candidate.presentationType === "barril20L");
    const barrel30 = item.presentations.find((candidate) => candidate.presentationType === "barril30L");
    const barrel50 = item.presentations.find((candidate) => candidate.presentationType === "barril50L");

    expect(barrel20 && buildPresentationComparison(barrel20, item.presentations)?.referencePresentation?.presentationType).toBe("barril20L");
    expect(barrel30 && getEffectiveUnitPrice(barrel30)).toBe(1800);
    expect(barrel50 && getEffectiveUnitPrice(barrel50)).toBe(1700);
    expect(getBestValuePresentation(item.presentations)?.presentationType).toBe("barril50L");
  });

  it("compares growlers by liter and porrones without inventing savings", () => {
    const item = product("blonde-ale");
    const growler1 = item.presentations.find((candidate) => candidate.presentationType === "growler1L");
    const growler2 = item.presentations.find((candidate) => candidate.presentationType === "growler2L");
    const porron = item.presentations.find((candidate) => candidate.presentationType === "porron500ml");

    expect(growler1 && buildPresentationComparison(growler1, item.presentations)?.referencePresentation?.presentationType).toBe("growler1L");
    expect(growler2 && getPresentationSavings(growler2, item.presentations)).toBe(600);
    expect(porron && buildPresentationComparison(porron, item.presentations)?.hasSavings).toBe(false);
  });

  it("returns null for missing metadata and avoids Infinity, NaN and false savings", () => {
    const invalid: ProductPresentation = {
      id: "invalid",
      productId: "invalid",
      presentationType: "unit",
      label: "Unit",
      volumeLiters: 1,
      unitPrice: 0,
      category: "pack",
      comparisonGroup: "invalid",
      comparisonQuantity: 0,
      comparisonUnit: "unidad",
      active: true,
      sortOrder: 1,
    };
    const expensive: ProductPresentation = { ...invalid, id: "expensive", unitPrice: 3000, comparisonQuantity: 2 };
    const base: ProductPresentation = { ...invalid, id: "base", unitPrice: 1000, comparisonQuantity: 1 };

    expect(buildPresentationComparison({ ...invalid, comparisonGroup: undefined }, [])).toBeNull();
    expect(getEffectiveUnitPrice(invalid)).toBeNull();
    expect(buildPresentationComparison(invalid, [invalid])?.effectiveUnitPrice).not.toBe(Number.POSITIVE_INFINITY);
    expect(Number.isNaN(buildPresentationComparison(invalid, [invalid])?.effectiveUnitPrice)).toBe(false);
    expect(buildPresentationComparison(expensive, [base, expensive])?.hasSavings).toBe(false);
  });

  it("allows a smaller promoted presentation to be best value and does not mutate inputs", () => {
    const original: ProductPresentation[] = [
      { ...presentation("demo-tonic", "lata354").found, unitPrice: 900, promotional: true, compareAtPrice: 1400 },
      presentation("demo-tonic", "pack6").found,
    ];
    const before = JSON.stringify(original);

    expect(getBestValuePresentation(original)?.presentationType).toBe("lata354");
    expect(buildPresentationComparison(original[0], original)?.hasPromotionalSavings).toBe(true);
    expect(JSON.stringify(original)).toBe(before);
  });
});

describe("store filters, sorting and imagery", () => {
  it("all demo products have non-empty local images and combos have their own images", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);
    const demo = catalog.filter((item) => item.isDemo);
    const combo = demo.filter((item) => item.mainCategory === "combo");

    expect(demo).toHaveLength(25);
    expect(combo).toHaveLength(4);
    for (const item of demo) {
      const source = getStoreImageSource(item.product);
      expect(source).toMatch(/^\/store\/(products|combos|accessories)\/.+\.png$/);
      const filePath = join(process.cwd(), "public", source!.replace(/^\//, ""));
      expect(existsSync(filePath)).toBe(true);
      expect(statSync(filePath).size).toBeGreaterThan(0);
      expect(source).not.toContain("example.com");
    }
  });

  it("filters promotions, volume savings, price ranges and combinations", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);

    expect(filterStoreCatalog(catalog, { onlyPromotions: true }).map((item) => item.product.id)).toContain("demo-combo-fernet");
    expect(filterStoreCatalog(catalog, { onlyVolumeSavings: true }).map((item) => item.product.id)).toContain("demo-wine-malbec");
    expect(filterStoreCatalog(catalog, { priceRange: "lte-10000" }).every((item) => item.priceFrom <= 10000)).toBe(true);
    expect(filterStoreCatalog(catalog, { mainCategory: "combo", onlyPromotions: true })).toHaveLength(4);
    expect(filterStoreCatalog(catalog, { query: "tonica", priceRange: "lte-10000" }).map((item) => item.product.id)).toEqual(["demo-tonic"]);
    expect(filterStoreCatalog(catalog, { query: "", mainCategory: "all", subcategory: "all", presentationType: "all", priceRange: "all" })).toHaveLength(catalog.length);
    expect(getActiveStoreFilterCount({ query: "gin", onlyPromotions: true, priceRange: "10000-25000" })).toBe(3);
    expect(STORE_PRICE_RANGE_LABELS["25000-50000"]).toContain("$25.000");
  });

  it("sorts by price, savings, names and recommended order without mutating", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);
    const before = catalog.map((item) => item.product.id).join(",");
    const asc = sortStoreCatalog(catalog, "price-asc");
    const desc = sortStoreCatalog(catalog, "price-desc");
    const savings = sortStoreCatalog(catalog, "savings-desc");
    const nameAsc = sortStoreCatalog(catalog, "name-asc");
    const nameDesc = sortStoreCatalog(catalog, "name-desc");
    const recommended = sortStoreCatalog(catalog, "recommended");

    expect(asc[0].priceFrom).toBeLessThanOrEqual(asc[1].priceFrom);
    expect(desc[0].priceFrom).toBeGreaterThanOrEqual(desc[1].priceFrom);
    expect(getProductMaxSavings(savings[0].presentations)).toBeGreaterThan(0);
    expect(nameAsc[0].product.name.localeCompare(nameAsc[1].product.name, "es")).toBeLessThanOrEqual(0);
    expect(nameDesc[0].product.name.localeCompare(nameDesc[1].product.name, "es")).toBeGreaterThanOrEqual(0);
    expect(recommended.map((item) => item.product.sortOrder)).toEqual([...recommended.map((item) => item.product.sortOrder)].sort((a, b) => a - b));
    expect(catalog.map((item) => item.product.id).join(",")).toBe(before);
  });

  it("keeps promotional unitPrice as the cart price without compareAtPrice leakage", () => {
    const { found } = presentation("demo-combo-fernet", "combo");
    const line = createCommercialCartItem(product("demo-combo-fernet").product, found);

    expect(line.price).toBe(found.unitPrice);
    expect(line.promotional).toBe(true);
    expect(JSON.stringify(line)).not.toContain("compareAtPrice");
  });
});
