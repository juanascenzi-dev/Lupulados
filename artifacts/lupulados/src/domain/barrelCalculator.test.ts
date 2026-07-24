import { describe, expect, it } from "vitest";
import { calculateBarrelRecommendation } from "./barrelCalculator";
import { barrelPresentationIds, beerCatalog, type BeerPresentationId } from "./beerCatalog";

const barrelOptions = barrelPresentationIds.map((presentationId) => ({
  presentationId,
  size: Number(presentationId.match(/\d+/)?.[0] ?? 0),
  price: Math.min(...beerCatalog.map((beer) => beer.precios[presentationId])),
}));

interface ExpectedRecommendation {
  coveredLiters: number;
  excessLiters: number;
  totalPrice: number;
  totalBarrels: number;
  parts: { count: number; price: number; presentationId: BeerPresentationId; size: number }[];
  label: string;
}

function expectedRecommendation(requiredLiters: number) {
  const normalizedRequired = Math.max(0, Math.ceil(requiredLiters));
  if (normalizedRequired <= 0) {
    return {
      coveredLiters: 0,
      excessLiters: 0,
      totalPrice: 0,
      totalBarrels: 0,
      parts: [] as { count: number; price: number; presentationId: BeerPresentationId; size: number }[],
      label: "No llegamos a un barril de 20L, ¡mejor pedí packs o growlers!",
    };
  }

  const effectiveRequired = Math.max(20, normalizedRequired);
  const maxCount = Math.ceil(effectiveRequired / 20) + 3;
  const candidates: ExpectedRecommendation[] = [];

  for (let b20 = 0; b20 <= maxCount; b20 += 1) {
    for (let b30 = 0; b30 <= maxCount; b30 += 1) {
      for (let b50 = 0; b50 <= maxCount; b50 += 1) {
        const counts = [b20, b30, b50];
        const coveredLiters = counts.reduce((sum, count, index) => sum + count * barrelOptions[index].size, 0);
        if (coveredLiters < effectiveRequired) continue;

        const parts = counts
          .map((count, index) => ({ count, option: barrelOptions[index] }))
          .filter(({ count }) => count > 0)
          .map(({ count, option }) => ({
            count,
            price: option.price,
            presentationId: option.presentationId,
            size: option.size,
          }))
          .sort((a, b) => b.size - a.size);

        const totalPrice = parts.reduce((sum, part) => sum + part.count * part.price, 0);
        const totalBarrels = parts.reduce((sum, part) => sum + part.count, 0);
        const label = parts.map((part) => `${part.count}x ${part.size}L`).join(" + ");

        candidates.push({
          coveredLiters,
          excessLiters: coveredLiters - normalizedRequired,
          totalPrice,
          totalBarrels,
          parts,
          label,
        });
      }
    }
  }

  return candidates.sort(
    (a, b) =>
      a.excessLiters - b.excessLiters ||
      a.totalPrice - b.totalPrice ||
      a.totalBarrels - b.totalBarrels ||
      a.label.localeCompare(b.label),
  )[0];
}

describe("calculateBarrelRecommendation", () => {
  it.each([1, 19, 20, 21, 30, 40, 50, 51, 59, 60, 70, 79, 80, 90, 101, 500])(
    "recommends the cheapest minimum-excess combination for %i liters",
    (liters) => {
      const result = calculateBarrelRecommendation(liters);
      const expected = expectedRecommendation(liters);

      expect(result.coveredLiters).toBeGreaterThanOrEqual(result.requiredLiters);
      expect(result.excessLiters).toBe(result.coveredLiters - result.requiredLiters);
      expect(result.excessLiters).toBe(expected.excessLiters);
      expect(result.totalPrice).toBe(expected.totalPrice);
      expect(result.estimatedPrice).toBe(expected.totalPrice);
      expect(result.totalBarrels).toBe(expected.totalBarrels);
      expect(result.label).toBe(expected.label);
      expect(result.parts).toEqual(expected.parts);
      expect(result.parts.every((part) => part.count >= 0)).toBe(true);
    },
  );

  it("covers positive requirements below the smallest barrel with at least 20L", () => {
    expect(calculateBarrelRecommendation(1).coveredLiters).toBe(20);
    expect(calculateBarrelRecommendation(19).coveredLiters).toBe(20);
  });

  it("chooses 2x 30L for exactly 60L", () => {
    const result = calculateBarrelRecommendation(60);

    expect(result.label).toBe("2x 30L");
    expect(result.coveredLiters).toBe(60);
    expect(result.totalPrice).toBe(108000);
  });

  it("lets catalog prices decide the cheapest exact 90L combination", () => {
    const result = calculateBarrelRecommendation(90);

    expect(result.label).toBe("1x 50L + 2x 20L");
    expect(result.totalPrice).toBeLessThan(3 * barrelOptions.find((option) => option.presentationId === "barril30L")!.price);
  });

  it.each([0, -1, -25])("returns an empty recommendation for non-positive requirements: %i", (liters) => {
    const result = calculateBarrelRecommendation(liters);

    expect(result.requiredLiters).toBe(0);
    expect(result.coveredLiters).toBe(0);
    expect(result.excessLiters).toBe(0);
    expect(result.totalPrice).toBe(0);
    expect(result.totalBarrels).toBe(0);
    expect(result.parts).toEqual([]);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
    "rejects non-finite requirements: %s",
    (liters) => {
      expect(() => calculateBarrelRecommendation(liters)).toThrow(RangeError);
      expect(() => calculateBarrelRecommendation(liters)).toThrow("requiredLiters must be a finite number");
    },
  );
});
