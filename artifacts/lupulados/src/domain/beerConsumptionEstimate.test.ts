import { describe, expect, it } from "vitest";
import { estimateBeerLiters } from "./beerConsumptionEstimate";

describe("estimateBeerLiters", () => {
  it("aplica solo el multiplicador de intensidad cuando la duración es exactamente 4hs y no es verano", () => {
    expect(estimateBeerLiters({ guests: 50, intensity: "normal", totalHoursDecimal: 4, isSummer: false })).toBe(50);
  });

  it.each([
    ["tranqui", 100, 60],
    ["normal", 100, 100],
    ["intensa", 100, 140],
    ["festival", 100, 180],
  ] as const)("aplica el multiplicador de intensidad %s", (intensity, guests, expected) => {
    expect(estimateBeerLiters({ guests, intensity, totalHoursDecimal: 4, isSummer: false })).toBe(expected);
  });

  it("incrementa el consumo 15% por hora por encima de 4hs", () => {
    expect(estimateBeerLiters({ guests: 50, intensity: "normal", totalHoursDecimal: 6, isSummer: false })).toBe(65);
  });

  it("reduce el consumo 15% por hora por debajo de 4hs", () => {
    expect(estimateBeerLiters({ guests: 50, intensity: "normal", totalHoursDecimal: 2, isSummer: false })).toBe(35);
  });

  it("suma 20% en verano", () => {
    expect(estimateBeerLiters({ guests: 50, intensity: "normal", totalHoursDecimal: 4, isSummer: true })).toBe(60);
  });

  it("redondea siempre hacia arriba (Math.ceil)", () => {
    expect(estimateBeerLiters({ guests: 17, intensity: "tranqui", totalHoursDecimal: 4, isSummer: false })).toBe(11);
  });

  it("combina intensidad, duración extendida y verano", () => {
    expect(estimateBeerLiters({ guests: 200, intensity: "festival", totalHoursDecimal: 6.5, isSummer: true })).toBe(594);
  });
});
