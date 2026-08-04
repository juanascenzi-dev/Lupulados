import { commercialSnapshot } from "./commercialData";
import { getActivePromotion } from "./commercialSelectors";
import type { CommercialSnapshot, Promotion } from "./commercialTypes";

/**
 * Normaliza un código promocional (espacios incidentales + mayúsculas) para
 * poder compararlo de forma consistente sin importar cómo lo haya tipeado o
 * pegado el usuario.
 */
export function normalizePromoCode(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Compara el input crudo del usuario contra el código de una promoción,
 * normalizando ambos lados. Única fuente de verdad para este matching —
 * antes duplicado (con reglas ligeramente distintas) entre el wizard y el
 * checkout de la tienda.
 */
export function matchesPromotionCode(
  promotion: Pick<Promotion, "code"> | null | undefined,
  rawInput: string,
): boolean {
  if (!promotion?.code) return false;
  return normalizePromoCode(rawInput) === normalizePromoCode(promotion.code);
}

/**
 * Resuelve a qué promoción (si alguna) aplica el input actual del usuario:
 * toma la promoción activa vigente hoy (respetando startDate/endDate vía
 * getActivePromotion) y la devuelve solo si el código matchea.
 */
export function resolveAppliedPromotion(
  rawInput: string,
  snapshot: CommercialSnapshot = commercialSnapshot,
): Promotion | null {
  const active = getActivePromotion(snapshot);
  return matchesPromotionCode(active, rawInput) ? active : null;
}
