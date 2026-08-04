import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  matchesPromotionCode,
  normalizePromoCode,
  resolveAppliedPromotion,
} from "./promotionMatching";
import type { Promotion } from "./commercialTypes";

const activePromotion: Promotion = {
  id: "primerabirra",
  code: "PRIMERABIRRA",
  type: "percentage",
  value: 0.1,
  active: true,
};

describe("normalizePromoCode", () => {
  it("trims incidental whitespace and uppercases", () => {
    expect(normalizePromoCode("  primerabirra  ")).toBe("PRIMERABIRRA");
  });
});

describe("matchesPromotionCode", () => {
  it("matches an exact code", () => {
    expect(matchesPromotionCode(activePromotion, "PRIMERABIRRA")).toBe(true);
  });

  it("matches despite leading/trailing whitespace", () => {
    expect(matchesPromotionCode(activePromotion, "  PRIMERABIRRA  ")).toBe(true);
  });

  it("matches regardless of case", () => {
    expect(matchesPromotionCode(activePromotion, "primerabirra")).toBe(true);
  });

  it("rejects a wrong code", () => {
    expect(matchesPromotionCode(activePromotion, "OTROCODIGO")).toBe(false);
  });

  it("rejects when there is no promotion to match against", () => {
    expect(matchesPromotionCode(null, "PRIMERABIRRA")).toBe(false);
    expect(matchesPromotionCode(undefined, "PRIMERABIRRA")).toBe(false);
  });
});

describe("resolveAppliedPromotion", () => {
  it("resolves the active promotion when the code matches, even with stray whitespace", () => {
    const snapshot = { ...commercialSnapshot, promotions: [activePromotion] };
    expect(resolveAppliedPromotion("  primerabirra  ", snapshot)?.code).toBe("PRIMERABIRRA");
  });

  it("returns null when the code does not match", () => {
    const snapshot = { ...commercialSnapshot, promotions: [activePromotion] };
    expect(resolveAppliedPromotion("OTROCODIGO", snapshot)).toBeNull();
  });

  it("returns null for an expired promotion even if the code matches", () => {
    const expired: Promotion = { ...activePromotion, endDate: "2020-01-01" };
    const snapshot = { ...commercialSnapshot, promotions: [expired] };
    expect(resolveAppliedPromotion("PRIMERABIRRA", snapshot)).toBeNull();
  });

  it("returns null for a promotion that has not started yet", () => {
    const future: Promotion = { ...activePromotion, startDate: "2099-01-01" };
    const snapshot = { ...commercialSnapshot, promotions: [future] };
    expect(resolveAppliedPromotion("PRIMERABIRRA", snapshot)).toBeNull();
  });

  it("returns null when there are no promotions in the snapshot", () => {
    const snapshot = { ...commercialSnapshot, promotions: [] };
    expect(resolveAppliedPromotion("PRIMERABIRRA", snapshot)).toBeNull();
  });
});
