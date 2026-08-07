import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  getActivePromotion,
  getFreeGlassesThreshold,
  isValidWhatsAppPhone,
  listActiveDeliveryOptions,
  listActiveExtraOptions,
  listActivePromotions,
  listActiveProductPresentations,
  listActiveProducts,
  listActiveWhatsAppChannels,
} from "./commercialSelectors";
import type { CommercialSnapshot, Promotion } from "./commercialTypes";

function cloneSnapshot(overrides: Partial<CommercialSnapshot> = {}): CommercialSnapshot {
  return {
    ...structuredClone(commercialSnapshot),
    ...overrides,
  };
}

function buildPromotion(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: "promo-1",
    code: "VERANO10",
    type: "percentage",
    value: 0.1,
    active: true,
    startDate: null,
    endDate: null,
    ...overrides,
  };
}

describe("listActiveProductPresentations", () => {
  it("returns an empty array when the parent product is not active, even with matching presentations", () => {
    const [firstProduct, ...rest] = commercialSnapshot.products;
    const snapshot = cloneSnapshot({
      products: [{ ...firstProduct, status: "archived" }, ...rest],
    });
    expect(listActiveProductPresentations(firstProduct.id, snapshot)).toEqual([]);
  });

  it("returns an empty array for an unknown product id", () => {
    expect(listActiveProductPresentations("does-not-exist")).toEqual([]);
  });
});

describe("getActivePromotion / listActivePromotions", () => {
  it("excludes a promotion whose startDate is in the future", () => {
    const snapshot = cloneSnapshot({
      promotions: [buildPromotion({ startDate: "2999-01-01" })],
    });
    expect(listActivePromotions(snapshot)).toEqual([]);
    expect(getActivePromotion(snapshot)).toBeNull();
  });

  it("excludes a promotion whose endDate is in the past", () => {
    const snapshot = cloneSnapshot({
      promotions: [buildPromotion({ endDate: "2000-01-01" })],
    });
    expect(listActivePromotions(snapshot)).toEqual([]);
    expect(getActivePromotion(snapshot)).toBeNull();
  });

  it("treats a promotion without startDate/endDate as always in window", () => {
    const snapshot = cloneSnapshot({
      promotions: [buildPromotion({ startDate: null, endDate: null })],
    });
    expect(listActivePromotions(snapshot)).toHaveLength(1);
    expect(getActivePromotion(snapshot)?.code).toBe("VERANO10");
  });

  it("returns the first in-window promotion, or null when none qualify", () => {
    const snapshot = cloneSnapshot({
      promotions: [
        buildPromotion({ id: "expired", code: "OLD", endDate: "2000-01-01" }),
        buildPromotion({ id: "current", code: "NEW" }),
      ],
    });
    expect(getActivePromotion(snapshot)?.code).toBe("NEW");
    expect(getActivePromotion(cloneSnapshot({ promotions: [] }))).toBeNull();
  });
});

describe("isValidWhatsAppPhone", () => {
  it("accepts a real-format Argentina WhatsApp number", () => {
    expect(isValidWhatsAppPhone("5491133971210")).toBe(true);
  });

  it("rejects a number missing the expected prefix", () => {
    expect(isValidWhatsAppPhone("1133971210")).toBe(false);
  });

  it("rejects a number with the wrong length", () => {
    expect(isValidWhatsAppPhone("549113397121")).toBe(false);
  });
});

describe("listActiveWhatsAppChannels / listActiveDeliveryOptions / listActiveExtraOptions", () => {
  it("exclude inactive entries and sort by sortOrder", () => {
    const channels = listActiveWhatsAppChannels();
    expect(channels.every((channel) => channel.active)).toBe(true);
    expect([...channels].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(channels);

    const deliveryOptions = listActiveDeliveryOptions();
    expect(deliveryOptions.every((option) => option.active)).toBe(true);
    expect([...deliveryOptions].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(deliveryOptions);

    const extraOptions = listActiveExtraOptions();
    expect(extraOptions.every((option) => option.active)).toBe(true);
    expect([...extraOptions].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(extraOptions);
  });
});

describe("getFreeGlassesThreshold", () => {
  it("reads the threshold from the snapshot instead of a hardcoded value", () => {
    const snapshot = cloneSnapshot({
      pricingRules: { ...commercialSnapshot.pricingRules, freeGlassesThreshold: 12345 },
    });
    expect(getFreeGlassesThreshold(snapshot)).toBe(12345);
  });
});

describe("selector copies do not mutate the snapshot", () => {
  it("mutating a returned delivery option, extra option or promotion leaves the snapshot untouched", () => {
    const before = JSON.stringify(commercialSnapshot);

    const delivery = listActiveDeliveryOptions()[0];
    if (delivery) delivery.label = "Changed";

    const extra = listActiveExtraOptions()[0];
    if (extra) extra.label = "Changed";

    const promotion = listActivePromotions()[0];
    if (promotion) promotion.code = "Changed";

    expect(JSON.stringify(commercialSnapshot)).toBe(before);
  });
});

// listActiveProducts is exercised indirectly by listActiveProductPresentations above and by
// commercialData.test.ts; kept here as a light guard on the active/sort contract used elsewhere.
describe("listActiveProducts", () => {
  it("only returns active products, sorted by sortOrder", () => {
    const products = listActiveProducts();
    expect(products.every((product) => product.status === "active")).toBe(true);
    expect([...products].sort((a, b) => a.sortOrder - b.sortOrder)).toEqual(products);
  });
});
