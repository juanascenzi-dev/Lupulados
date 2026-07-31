import { describe, expect, it } from "vitest";
import { applyDurationAndSummerAdjustment, estimateBeerLiters } from "./beerConsumptionEstimate";

describe("estimateBeerLiters", () => {
  it("aplica solo el multiplicador de intensidad cuando la duración es exactamente 4hs y no es verano", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
      }),
    ).toBe(40);
  });

  it.each([
    ["tranqui", 100, 50],
    ["normal", 100, 80],
    ["intensa", 100, 130],
    ["festival", 100, 180],
  ] as const)("aplica el multiplicador de intensidad %s", (intensity, guests, expected) => {
    expect(estimateBeerLiters({ guests, intensity, totalHoursDecimal: 4, isSummer: false })).toBe(
      expected,
    );
  });

  it("incrementa el consumo 15% por hora por encima de 4hs", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 6,
        isSummer: false,
      }),
    ).toBe(52);
  });

  it("reduce el consumo 15% por hora por debajo de 4hs", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 2,
        isSummer: false,
      }),
    ).toBe(28);
  });

  it("suma 25% en verano", () => {
    expect(
      estimateBeerLiters({ guests: 50, intensity: "normal", totalHoursDecimal: 4, isSummer: true }),
    ).toBe(50);
  });

  it("redondea siempre hacia arriba (Math.ceil)", () => {
    expect(
      estimateBeerLiters({
        guests: 17,
        intensity: "tranqui",
        totalHoursDecimal: 4,
        isSummer: false,
      }),
    ).toBe(9);
  });

  it("combina intensidad, duración extendida y verano", () => {
    expect(
      estimateBeerLiters({
        guests: 200,
        intensity: "festival",
        totalHoursDecimal: 6.5,
        isSummer: true,
      }),
    ).toBe(619);
  });

  it("litersPerPerson pisa el multiplicador de intensidad cuando se provee", () => {
    expect(
      estimateBeerLiters({
        guests: 100,
        intensity: "tranqui",
        totalHoursDecimal: 4,
        isSummer: false,
        litersPerPerson: 1.5,
      }),
    ).toBe(150);
  });

  it("litersPerPerson se sigue combinando con el ajuste por duración y verano", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 6,
        isSummer: true,
        litersPerPerson: 1,
      }),
    ).toBe(82);
  });

  it("sin litersPerPerson el comportamiento no cambia respecto al multiplicador de intensidad", () => {
    expect(
      estimateBeerLiters({
        guests: 100,
        intensity: "intensa",
        totalHoursDecimal: 4,
        isSummer: false,
      }),
    ).toBe(130);
  });

  it("genderComposition con mujeres en 0 solo aplica el multiplicador de hombres", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
        genderComposition: { men: 50, women: 0 },
      }),
    ).toBe(46);
  });

  it("genderComposition con hombres en 0 solo aplica el multiplicador de mujeres", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
        genderComposition: { men: 0, women: 50 },
      }),
    ).toBe(34);
  });

  it("genderComposition mixta pondera hombres y mujeres con sus multiplicadores respectivos", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
        genderComposition: { men: 30, women: 20 },
      }),
    ).toBe(42);
  });

  it("genderComposition se combina con el ajuste por duración extendida", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 6,
        isSummer: false,
        genderComposition: { men: 30, women: 20 },
      }),
    ).toBe(54);
  });

  it("genderComposition se combina con el bonus de verano", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: true,
        genderComposition: { men: 30, women: 20 },
      }),
    ).toBe(52);
  });

  it("genderComposition se combina con el override de litersPerPerson", () => {
    expect(
      estimateBeerLiters({
        guests: 50,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
        litersPerPerson: 1,
        genderComposition: { men: 30, women: 20 },
      }),
    ).toBe(52);
  });

  it("guests se ignora cuando genderComposition está presente", () => {
    expect(
      estimateBeerLiters({
        guests: 999,
        intensity: "normal",
        totalHoursDecimal: 4,
        isSummer: false,
        genderComposition: { men: 30, women: 20 },
      }),
    ).toBe(42);
  });
});

describe("applyDurationAndSummerAdjustment", () => {
  it("no modifica los litros cuando la duración es 4hs y no es verano", () => {
    expect(applyDurationAndSummerAdjustment(100, 4, false)).toBe(100);
  });

  it("incrementa 15% por hora por encima de 4hs", () => {
    expect(applyDurationAndSummerAdjustment(100, 6, false)).toBe(130);
  });

  it("reduce 15% por hora por debajo de 4hs", () => {
    expect(applyDurationAndSummerAdjustment(100, 2, false)).toBe(70);
  });

  it("suma 25% en verano", () => {
    expect(applyDurationAndSummerAdjustment(100, 4, true)).toBe(125);
  });

  it("combina duración extendida y verano", () => {
    expect(applyDurationAndSummerAdjustment(100, 6, true)).toBe(162.5);
  });
});
