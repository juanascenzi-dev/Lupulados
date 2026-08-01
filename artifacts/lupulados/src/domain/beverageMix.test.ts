import { describe, expect, it } from "vitest";
import { estimateBeerLiters } from "./beerConsumptionEstimate";
import {
  calculateBeverageMixEstimate,
  getBeerSharePercentage,
  isDefaultBeverageMix,
  normalizeBeverageMixShares,
  updateBeverageMixShare,
} from "./beverageMix";

describe("normalizeBeverageMixShares", () => {
  it("fusiona entradas duplicadas del mismo tipo sumando sus porcentajes", () => {
    expect(
      normalizeBeverageMixShares([
        { type: "fernet", percentage: 20 },
        { type: "fernet", percentage: 30 },
      ]),
    ).toEqual([{ type: "fernet", percentage: 50 }]);
  });

  it("descarta entradas con porcentaje <= 0", () => {
    expect(
      normalizeBeverageMixShares([
        { type: "fernet", percentage: 0 },
        { type: "whisky", percentage: -5 },
      ]),
    ).toEqual([]);
  });

  it("acota el acumulado a 100 en el orden del array", () => {
    expect(
      normalizeBeverageMixShares([
        { type: "fernet", percentage: 60 },
        { type: "whisky", percentage: 60 },
      ]),
    ).toEqual([
      { type: "fernet", percentage: 60 },
      { type: "whisky", percentage: 40 },
    ]);
  });
});

describe("updateBeverageMixShare", () => {
  it("clampea el nuevo porcentaje al remanente disponible", () => {
    expect(updateBeverageMixShare([{ type: "fernet", percentage: 60 }], "whisky", 60)).toEqual([
      { type: "fernet", percentage: 60 },
      { type: "whisky", percentage: 40 },
    ]);
  });

  it("elimina la entrada cuando se fija en 0", () => {
    expect(
      updateBeverageMixShare(
        [
          { type: "fernet", percentage: 60 },
          { type: "whisky", percentage: 20 },
        ],
        "fernet",
        0,
      ),
    ).toEqual([{ type: "whisky", percentage: 20 }]);
  });
});

describe("getBeerSharePercentage", () => {
  it("devuelve 100 sin shares activos", () => {
    expect(getBeerSharePercentage([])).toBe(100);
  });

  it("devuelve 100 menos la suma de los shares activos", () => {
    expect(
      getBeerSharePercentage([
        { type: "fernet", percentage: 30 },
        { type: "whisky", percentage: 20 },
      ]),
    ).toBe(50);
  });
});

describe("isDefaultBeverageMix", () => {
  it("es true sin shares", () => {
    expect(isDefaultBeverageMix([])).toBe(true);
  });

  it("es true cuando todos los shares quedan en 0", () => {
    expect(isDefaultBeverageMix([{ type: "fernet", percentage: 0 }])).toBe(true);
  });

  it("es false con algún share no-cerveza activo", () => {
    expect(isDefaultBeverageMix([{ type: "fernet", percentage: 10 }])).toBe(false);
  });
});

describe("calculateBeverageMixEstimate", () => {
  it("con shares vacíos devuelve solo cerveza, idéntico a estimateBeerLiters directo", () => {
    const input = {
      guests: 50,
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
    } as const;
    const direct = estimateBeerLiters(input);

    const result = calculateBeverageMixEstimate({ ...input, shares: [] });

    expect(result).toEqual([
      { type: "beer", percentage: 100, liters: direct, approxBottles: null },
    ]);
  });

  it("reparte 70% cerveza / 30% fernet con los litros esperados", () => {
    const result = calculateBeverageMixEstimate({
      guests: 100,
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "fernet", percentage: 30 }],
    });

    expect(result).toEqual([
      { type: "beer", percentage: 70, liters: 56, approxBottles: null },
      { type: "fernet", percentage: 30, liters: 6, approxBottles: 8 },
    ]);
  });

  it("aplica el mismo ajuste de duración y verano a la fila de cerveza y a una no-cerveza", () => {
    const result = calculateBeverageMixEstimate({
      guests: 100,
      intensity: "normal",
      totalHoursDecimal: 6,
      isSummer: true,
      shares: [{ type: "fernet", percentage: 50 }],
    });

    const beer = result.find((item) => item.type === "beer");
    const fernet = result.find((item) => item.type === "fernet");
    expect(beer?.liters).toBe(65);
    expect(fernet?.liters).toBe(17);
  });

  it("propaga genderComposition a las bebidas no-cerveza con el mismo multiplicador", () => {
    const result = calculateBeverageMixEstimate({
      guests: 100,
      genderComposition: { men: 40, women: 60 },
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "whisky", percentage: 50 }],
    });

    const beer = result.find((item) => item.type === "beer");
    const whisky = result.find((item) => item.type === "whisky");
    expect(beer?.liters).toBe(39);
    expect(whisky?.liters).toBe(8);
  });

  it("calcula approxBottles como Math.ceil(liters / tamaño de botella)", () => {
    const vodkaResult = calculateBeverageMixEstimate({
      guests: 100,
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "vodka", percentage: 40 }],
    });
    expect(vodkaResult.find((item) => item.type === "vodka")?.approxBottles).toBe(9);
  });

  it("approxBottles de cerveza siempre es null", () => {
    const result = calculateBeverageMixEstimate({
      guests: 100,
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "wine", percentage: 20 }],
    });
    expect(result.find((item) => item.type === "beer")?.approxBottles).toBeNull();
  });

  it("escala la porción no-cerveza por intensidad del evento, igual que la cerveza", () => {
    const base = {
      guests: 100,
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "gin" as const, percentage: 50 }],
    };

    const tranqui = calculateBeverageMixEstimate({ ...base, intensity: "tranqui" });
    const normal = calculateBeverageMixEstimate({ ...base, intensity: "normal" });
    const festival = calculateBeverageMixEstimate({ ...base, intensity: "festival" });

    const ginLiters = (result: ReturnType<typeof calculateBeverageMixEstimate>) =>
      result.find((item) => item.type === "gin")?.liters;

    expect(ginLiters(tranqui)).toBe(5);
    expect(ginLiters(normal)).toBe(8);
    expect(ginLiters(festival)).toBe(17);
  });

  it("caso límite: 100% en una sola bebida no-cerveza deja la cerveza en 0%", () => {
    const result = calculateBeverageMixEstimate({
      guests: 100,
      intensity: "normal",
      totalHoursDecimal: 4,
      isSummer: false,
      shares: [{ type: "fernet", percentage: 100 }],
    });

    expect(result).toEqual([
      { type: "beer", percentage: 0, liters: 0, approxBottles: null },
      { type: "fernet", percentage: 100, liters: 20, approxBottles: 27 },
    ]);
  });
});
