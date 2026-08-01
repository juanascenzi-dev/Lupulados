import type { EventIntensity } from "./beerConsumptionEstimate";
import type { NonBeerBeverageType } from "./beverageMix";

export const NON_BEER_TYPES: NonBeerBeverageType[] = [
  "fernet",
  "whisky",
  "wine",
  "gin",
  "vodka",
  "rum",
  "tequila",
];

export interface EventTypeDef {
  id: EventIntensity;
  emoji: string;
  label: string;
  desc: string;
}

export const EVENT_TYPES: EventTypeDef[] = [
  {
    id: "tranqui",
    emoji: "🍽️",
    label: "Tranqui / Almuerzo",
    desc: "Consumo moderado",
  },
  {
    id: "normal",
    emoji: "🎉",
    label: "Fiesta Normal",
    desc: "Cumple o juntada",
  },
  {
    id: "intensa",
    emoji: "🔥",
    label: "Fiesta Intensa",
    desc: "Más consumo por persona",
  },
  {
    id: "festival",
    emoji: "🎪",
    label: "Festival",
    desc: "Evento largo y activo",
  },
];

export interface DurationChipDef {
  label: string;
  hours: number;
  minutes: number;
}

export const DURATION_CHIPS: DurationChipDef[] = [
  { label: "2hs", hours: 2, minutes: 0 },
  { label: "2:30", hours: 2, minutes: 30 },
  { label: "3hs", hours: 3, minutes: 0 },
  { label: "3:30", hours: 3, minutes: 30 },
  { label: "4hs", hours: 4, minutes: 0 },
  { label: "5hs", hours: 5, minutes: 0 },
  { label: "6hs", hours: 6, minutes: 0 },
];
