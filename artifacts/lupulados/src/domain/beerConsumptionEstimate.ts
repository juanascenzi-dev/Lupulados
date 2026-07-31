export type EventIntensity = "tranqui" | "normal" | "intensa" | "festival";

export const EVENT_INTENSITY_MULTIPLIERS: Record<EventIntensity, number> = {
  tranqui: 0.5,
  normal: 0.8,
  intensa: 1.3,
  festival: 1.8,
};

export interface BeerConsumptionEstimateInput {
  guests: number;
  intensity: EventIntensity;
  totalHoursDecimal: number;
  isSummer: boolean;
}

export function estimateBeerLiters(input: BeerConsumptionEstimateInput): number {
  const { guests, intensity, totalHoursDecimal, isSummer } = input;
  let liters = guests * EVENT_INTENSITY_MULTIPLIERS[intensity];

  if (totalHoursDecimal > 4) {
    liters *= 1 + 0.15 * (totalHoursDecimal - 4);
  } else if (totalHoursDecimal < 4) {
    liters *= 1 - 0.15 * (4 - totalHoursDecimal);
  }

  if (isSummer) liters *= 1.25;

  return Math.ceil(liters);
}
