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
  "whisky",
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
