import { formatPrice } from "./format";
import type { Promotion } from "./commercialTypes";

export type PromotionValueInput = Pick<Promotion, "type" | "value"> | null | undefined;

/**
 * Calcula el monto a descontar de un subtotal para una promoción dada.
 * "percentage" descuenta una fracción del subtotal; "fixed" descuenta su
 * valor en pesos tal cual. En ambos casos el resultado se clampea a
 * [0, subtotal] para que el total nunca pueda quedar negativo.
 *
 * A diferencia de otros cálculos de dominio (ver barrelCalculator.ts), esta
 * función no tira excepción ante inputs inválidos: corre en cada render de
 * cualquier consumidor de useCart() vía calculateOrderSummary, y un input
 * fuera de rango debe degradar a "sin descuento", no romper el checkout.
 */
export function calculateDiscountAmount(subtotal: number, promotion: PromotionValueInput): number {
  if (!promotion) return 0;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  if (!Number.isFinite(promotion.value) || promotion.value <= 0) return 0;

  const rawAmount = promotion.type === "percentage" ? subtotal * promotion.value : promotion.value;
  return Math.min(Math.max(rawAmount, 0), subtotal);
}

/**
 * Formatea el valor de una promoción para mostrarlo en UI/mensajes:
 * "percentage" como porcentaje ("10%"), "fixed" como precio ("$1.000").
 * Única fuente de verdad para este formato — antes cada consumidor
 * hardcodeaba `${value * 100}% OFF`, asumiendo que siempre era percentage.
 */
export function formatPromotionValue(promotion: Pick<Promotion, "type" | "value">): string {
  return promotion.type === "percentage"
    ? `${promotion.value * 100}%`
    : formatPrice(promotion.value);
}
