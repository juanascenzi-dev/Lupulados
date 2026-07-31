import type { ProductCategory } from "./commercialTypes";
import {
  GENDER_LITERS_MULTIPLIER,
  applyDurationAndSummerAdjustment,
  estimateBeerLiters,
  type EventIntensity,
  type GenderComposition,
} from "./beerConsumptionEstimate";

export type NonBeerBeverageType = Extract<
  ProductCategory,
  "fernet" | "whisky" | "wine" | "gin" | "vodka" | "rum" | "tequila"
>;

export type BeverageType = "beer" | NonBeerBeverageType;

export const BEVERAGE_TYPE_ORDER: BeverageType[] = [
  "beer",
  "fernet",
  "whisky",
  "wine",
  "gin",
  "vodka",
  "rum",
  "tequila",
];

export const BEVERAGE_LABELS: Record<BeverageType, string> = {
  beer: "Cerveza",
  fernet: "Fernet",
  whisky: "Whisky",
  wine: "Vino",
  gin: "Gin",
  vodka: "Vodka",
  rum: "Ron",
  tequila: "Tequila",
};

/**
 * PLACEHOLDER — litros/persona estimados a ojo, sin contrastar contra benchmarks reales.
 * Pendiente de una pasada de calibración como la que tuvo la cerveza (ver docs/barrel-calculator-consumption-calibration.md).
 */
export const BEVERAGE_LITERS_PER_PERSON: Record<NonBeerBeverageType, number> = {
  fernet: 0.35,
  wine: 0.4,
  gin: 0.2,
  vodka: 0.2,
  rum: 0.2,
  whisky: 0.15,
  tequila: 0.15,
};

/** PLACEHOLDER — tamaño de botella genérico para aproximar cantidad, no un SKU real del catálogo. */
export const BEVERAGE_BOTTLE_SIZE_LITERS: Record<NonBeerBeverageType, number> = {
  fernet: 0.75,
  wine: 0.75,
  whisky: 0.75,
  gin: 0.7,
  vodka: 0.7,
  rum: 0.7,
  tequila: 0.7,
};

export interface BeverageMixShare {
  type: NonBeerBeverageType;
  percentage: number;
}

/**
 * Normaliza una lista de shares: fusiona tipos duplicados sumando sus porcentajes,
 * descarta los que quedan en 0 o menos, y acota el acumulado a 100 en el orden del array.
 * La cerveza nunca aparece acá: es siempre el remanente implícito (ver getBeerSharePercentage).
 */
export function normalizeBeverageMixShares(shares: BeverageMixShare[]): BeverageMixShare[] {
  const totals = new Map<NonBeerBeverageType, number>();
  for (const share of shares) {
    totals.set(share.type, (totals.get(share.type) ?? 0) + share.percentage);
  }

  const result: BeverageMixShare[] = [];
  let used = 0;
  for (const [type, rawPercentage] of totals) {
    if (rawPercentage <= 0) continue;
    const percentage = Math.min(rawPercentage, 100 - used);
    if (percentage <= 0) continue;
    result.push({ type, percentage });
    used += percentage;
  }

  return result;
}

/**
 * Fija el porcentaje de `type`, clampeado a lo que quede disponible una vez descontado
 * el resto de las bebidas activas. Al no poder superar el remanente, nunca hace falta
 * validar "que sume 100": lo no asignado explícitamente queda en cerveza.
 */
export function updateBeverageMixShare(
  shares: BeverageMixShare[],
  type: NonBeerBeverageType,
  percentage: number,
): BeverageMixShare[] {
  const normalized = normalizeBeverageMixShares(shares);
  const others = normalized.filter((share) => share.type !== type);
  const otherTotal = others.reduce((sum, share) => sum + share.percentage, 0);
  const clamped = Math.min(Math.max(percentage, 0), 100 - otherTotal);

  if (clamped <= 0) return others;
  return [...others, { type, percentage: clamped }];
}

export function getBeerSharePercentage(shares: BeverageMixShare[]): number {
  const otherTotal = normalizeBeverageMixShares(shares).reduce(
    (sum, share) => sum + share.percentage,
    0,
  );
  return Math.max(100 - otherTotal, 0);
}

export function isDefaultBeverageMix(shares: BeverageMixShare[]): boolean {
  return normalizeBeverageMixShares(shares).length === 0;
}

export interface BeverageMixCalculationInput {
  guests: number;
  genderComposition?: GenderComposition;
  intensity: EventIntensity;
  /** Override manual de litros/persona; solo aplica a la porción de cerveza. */
  litersPerPerson?: number;
  totalHoursDecimal: number;
  isSummer: boolean;
  /** No incluye cerveza; la cerveza es 100 - suma(shares). */
  shares: BeverageMixShare[];
}

export interface BeverageMixItemEstimate {
  type: BeverageType;
  percentage: number;
  liters: number;
  /** null para "beer": el plan de barriles lo calcula el caller con el catálogo real. */
  approxBottles: number | null;
}

function scaleGenderComposition(
  genderComposition: GenderComposition | undefined,
  fraction: number,
): GenderComposition | undefined {
  if (!genderComposition) return undefined;
  return {
    men: genderComposition.men * fraction,
    women: genderComposition.women * fraction,
  };
}

function estimateNonBeerLiters(
  type: NonBeerBeverageType,
  fraction: number,
  input: BeverageMixCalculationInput,
): number {
  const { guests, genderComposition, totalHoursDecimal, isSummer } = input;
  const rate = BEVERAGE_LITERS_PER_PERSON[type];

  const rawLiters = genderComposition
    ? genderComposition.men * fraction * rate * GENDER_LITERS_MULTIPLIER.men +
      genderComposition.women * fraction * rate * GENDER_LITERS_MULTIPLIER.women
    : guests * fraction * rate;

  return Math.ceil(applyDurationAndSummerAdjustment(rawLiters, totalHoursDecimal, isSummer));
}

export function calculateBeverageMixEstimate(
  input: BeverageMixCalculationInput,
): BeverageMixItemEstimate[] {
  const {
    guests,
    genderComposition,
    intensity,
    litersPerPerson,
    totalHoursDecimal,
    isSummer,
    shares,
  } = input;
  const normalizedShares = normalizeBeverageMixShares(shares);
  const beerPercentage = getBeerSharePercentage(normalizedShares);
  const beerFraction = beerPercentage / 100;

  const beerLiters = estimateBeerLiters({
    guests: guests * beerFraction,
    intensity,
    totalHoursDecimal,
    isSummer,
    litersPerPerson,
    genderComposition: scaleGenderComposition(genderComposition, beerFraction),
  });

  const results: BeverageMixItemEstimate[] = [
    { type: "beer", percentage: beerPercentage, liters: beerLiters, approxBottles: null },
  ];

  for (const share of normalizedShares) {
    const fraction = share.percentage / 100;
    const liters = estimateNonBeerLiters(share.type, fraction, input);
    const approxBottles = Math.ceil(liters / BEVERAGE_BOTTLE_SIZE_LITERS[share.type]);
    results.push({ type: share.type, percentage: share.percentage, liters, approxBottles });
  }

  const order = new Map(BEVERAGE_TYPE_ORDER.map((type, index) => [type, index]));
  return results.sort((a, b) => (order.get(a.type) ?? 0) - (order.get(b.type) ?? 0));
}
