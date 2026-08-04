import { describe, expect, it } from "vitest";
import {
  calculateDiscountAmount,
  formatPromotionValue,
  type PromotionValueInput,
} from "./promotionDiscount";

describe("calculateDiscountAmount", () => {
  it("calculates a percentage discount over the subtotal", () => {
    expect(calculateDiscountAmount(90000, { type: "percentage", value: 0.1 })).toBe(9000);
  });

  it("calculates a fixed discount as the raw peso value", () => {
    expect(calculateDiscountAmount(90000, { type: "fixed", value: 1000 })).toBe(1000);
  });

  it("caps a fixed discount at the subtotal so the total never goes negative", () => {
    expect(calculateDiscountAmount(500, { type: "fixed", value: 10000 })).toBe(500);
  });

  it("caps a fixed discount that exactly equals the subtotal", () => {
    expect(calculateDiscountAmount(1000, { type: "fixed", value: 1000 })).toBe(1000);
  });

  const invalidCases: Array<[string, number, PromotionValueInput]> = [
    ["no promotion", 90000, null],
    ["undefined promotion", 90000, undefined],
    ["zero subtotal", 0, { type: "percentage", value: 0.1 }],
    ["negative subtotal", -100, { type: "percentage", value: 0.1 }],
    ["zero value", 90000, { type: "fixed", value: 0 }],
    ["negative value", 90000, { type: "fixed", value: -100 }],
    ["NaN subtotal", NaN, { type: "percentage", value: 0.1 }],
    ["NaN value", 90000, { type: "fixed", value: NaN }],
    ["Infinity subtotal", Infinity, { type: "percentage", value: 0.1 }],
  ];

  it.each(invalidCases)("returns 0 for %s", (_label, subtotal, promotion) => {
    expect(calculateDiscountAmount(subtotal, promotion)).toBe(0);
  });
});

describe("formatPromotionValue", () => {
  it("formats a percentage promotion as a percent string", () => {
    expect(formatPromotionValue({ type: "percentage", value: 0.1 })).toBe("10%");
  });

  it("formats a fixed promotion as a formatted price", () => {
    expect(formatPromotionValue({ type: "fixed", value: 1000 })).toBe("$1.000");
  });
});
