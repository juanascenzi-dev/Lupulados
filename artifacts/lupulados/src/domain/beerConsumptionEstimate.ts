export type EventIntensity = "tranqui" | "normal" | "intensa" | "festival";

export const EVENT_INTENSITY_MULTIPLIERS: Record<EventIntensity, number> = {
  tranqui: 0.5,
  normal: 0.8,
  intensa: 1.3,
  festival: 1.8,
};

/**
 * Ratios relativos de litros/persona por género (1.0 = promedio del evento).
 * Ej.: hombres +15%, mujeres -15% sobre el litro/persona base del evento.
 */
export const GENDER_LITERS_MULTIPLIER = {
  men: 1.15,
  women: 0.85,
} as const;

export interface GenderComposition {
  men: number;
  women: number;
}

export interface BeerConsumptionEstimateInput {
  guests: number;
  intensity: EventIntensity;
  totalHoursDecimal: number;
  isSummer: boolean;
  litersPerPerson?: number;
  /** Cuando está presente, reemplaza `guests * base` por una fórmula ponderada por género; `guests` se ignora. */
  genderComposition?: GenderComposition;
}

export function applyDurationAndSummerAdjustment(
  baseLiters: number,
  totalHoursDecimal: number,
  isSummer: boolean,
): number {
  let liters = baseLiters;

  if (totalHoursDecimal > 4) {
    liters *= 1 + 0.15 * (totalHoursDecimal - 4);
  } else if (totalHoursDecimal < 4) {
    liters *= 1 - 0.15 * (4 - totalHoursDecimal);
  }

  if (isSummer) liters *= 1.25;

  return liters;
}

export function estimateBeerLiters(input: BeerConsumptionEstimateInput): number {
  const { guests, intensity, totalHoursDecimal, isSummer, litersPerPerson, genderComposition } =
    input;
  const base = litersPerPerson ?? EVENT_INTENSITY_MULTIPLIERS[intensity];
  const rawLiters = genderComposition
    ? genderComposition.men * base * GENDER_LITERS_MULTIPLIER.men +
      genderComposition.women * base * GENDER_LITERS_MULTIPLIER.women
    : guests * base;

  return Math.ceil(applyDurationAndSummerAdjustment(rawLiters, totalHoursDecimal, isSummer));
}
