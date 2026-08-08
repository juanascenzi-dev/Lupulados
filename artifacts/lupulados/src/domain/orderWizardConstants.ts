import type { OrderType } from "@/domain/orderFlow";
import type { ProductCategory } from "@/domain/commercialTypes";

export type Step = 1 | 2 | 3 | 4 | 5;

export const PHASE_LABELS = ["Productos", "Datos", "Confirmacion"];

export const WHATSAPP_ACTIVATION_GUARD_MS = 1500;

export const QUICK_ORDER_CATEGORIES: ProductCategory[] = [
  "beer",
  "wine",
  "fernet",
  "gin",
  "vodka",
  "whisky",
  "rum",
  "tequila",
  "mixer",
  "soft-drink",
  "pack",
  "accessory",
];

export const CONFIGURABLE_PACK_ORDER_TYPE: Exclude<OrderType, null> = "porrón";

export const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 8 + Math.random() * 18,
  left: 5 + Math.random() * 90,
  delay: Math.random() * 8,
  duration: 5 + Math.random() * 6,
}));

const SKIP_STEP_TWO_ORDER_TYPES: OrderType[] = ["paquete", "porrón"];

/** Agrupa los 5 steps internos del wizard en las 3 fases visibles de `PHASE_LABELS`. */
export function getWizardPhase(step: Step): 1 | 2 | 3 {
  return step <= 3 ? 1 : step === 4 ? 2 : 3;
}

export function getNextWizardStep(step: Step, isBeerCategory: boolean, orderType: OrderType): Step {
  if (isBeerCategory && step === 1 && SKIP_STEP_TWO_ORDER_TYPES.includes(orderType)) {
    return 3;
  }
  return Math.min(step + 1, 5) as Step;
}

export function getPrevWizardStep(step: Step, isBeerCategory: boolean, orderType: OrderType): Step {
  if (isBeerCategory && step === 3 && SKIP_STEP_TWO_ORDER_TYPES.includes(orderType)) {
    return 1;
  }
  return Math.max(step - 1, 1) as Step;
}
