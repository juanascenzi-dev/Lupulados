import type { ProductPresentation } from "./commercialTypes";

export interface PresentationComparison {
  presentation: ProductPresentation;
  effectiveUnitPrice: number;
  unitLabel: string;
  referencePresentation: ProductPresentation | null;
  referenceCost: number | null;
  savings: number;
  savingsRate: number;
  hasSavings: boolean;
  promotionalSavings: number;
  promotionalSavingsRate: number;
  hasPromotionalSavings: boolean;
  isBestValue: boolean;
  bestValueLabel: string | null;
}

function isPositiveFinite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function getComparisonQuantity(presentation: ProductPresentation) {
  return isPositiveFinite(presentation.comparisonQuantity) ? presentation.comparisonQuantity : null;
}

export function getComparisonUnitLabel(unit: ProductPresentation["comparisonUnit"] | undefined) {
  return unit?.trim() || "unidad";
}

export function getEffectiveUnitPrice(presentation: ProductPresentation) {
  const quantity = getComparisonQuantity(presentation);
  if (!quantity || !isPositiveFinite(presentation.unitPrice)) return null;
  const value = presentation.unitPrice / quantity;
  return Number.isFinite(value) ? value : null;
}

export function getPromotionalSavings(presentation: ProductPresentation) {
  if (!presentation.promotional || !isPositiveFinite(presentation.compareAtPrice) || !isPositiveFinite(presentation.unitPrice)) {
    return null;
  }

  const savings = presentation.compareAtPrice - presentation.unitPrice;
  if (!Number.isFinite(savings) || savings <= 0) return null;
  return {
    savings,
    savingsRate: savings / presentation.compareAtPrice,
  };
}

export function getBestValuePresentation(presentations: readonly ProductPresentation[]) {
  const comparable = presentations
    .map((presentation) => ({ presentation, effectiveUnitPrice: getEffectiveUnitPrice(presentation) }))
    .filter((item): item is { presentation: ProductPresentation; effectiveUnitPrice: number } => item.effectiveUnitPrice !== null)
    .sort((left, right) => left.effectiveUnitPrice - right.effectiveUnitPrice || left.presentation.sortOrder - right.presentation.sortOrder);

  return comparable[0]?.presentation ?? null;
}

export function buildPresentationComparison(
  presentation: ProductPresentation,
  presentations: readonly ProductPresentation[],
): PresentationComparison | null {
  const promotional = getPromotionalSavings(presentation);
  const effectiveUnitPrice = getEffectiveUnitPrice(presentation);
  const unitLabel = getComparisonUnitLabel(presentation.comparisonUnit);
  const quantity = getComparisonQuantity(presentation);

  if (effectiveUnitPrice === null || quantity === null) {
    if (!promotional) return null;
    return {
      presentation,
      effectiveUnitPrice: presentation.unitPrice,
      unitLabel,
      referencePresentation: null,
      referenceCost: presentation.compareAtPrice ?? null,
      savings: 0,
      savingsRate: 0,
      hasSavings: false,
      promotionalSavings: promotional.savings,
      promotionalSavingsRate: promotional.savingsRate,
      hasPromotionalSavings: true,
      isBestValue: false,
      bestValueLabel: null,
    };
  }

  const comparable = presentation.comparisonGroup
    ? presentations
      .filter((candidate) => candidate.comparisonGroup === presentation.comparisonGroup)
      .map((candidate) => ({
        presentation: candidate,
        quantity: getComparisonQuantity(candidate),
        effectiveUnitPrice: getEffectiveUnitPrice(candidate),
      }))
      .filter((item): item is { presentation: ProductPresentation; quantity: number; effectiveUnitPrice: number } =>
        item.quantity !== null && item.effectiveUnitPrice !== null,
      )
      .sort((left, right) => left.quantity - right.quantity || left.presentation.sortOrder - right.presentation.sortOrder)
    : [];

  const reference = comparable[0] ?? null;
  const referenceCost = reference ? reference.effectiveUnitPrice * quantity : null;
  const rawSavings = referenceCost === null ? 0 : referenceCost - presentation.unitPrice;
  const savings = Number.isFinite(rawSavings) ? rawSavings : 0;
  const savingsRate = referenceCost && referenceCost > 0 && savings > 0 ? savings / referenceCost : 0;
  const bestValue = comparable
    .slice()
    .sort((left, right) => left.effectiveUnitPrice - right.effectiveUnitPrice || left.presentation.sortOrder - right.presentation.sortOrder)[0];

  return {
    presentation,
    effectiveUnitPrice,
    unitLabel,
    referencePresentation: reference?.presentation ?? null,
    referenceCost,
    savings,
    savingsRate,
    hasSavings: savings > 0,
    promotionalSavings: promotional?.savings ?? 0,
    promotionalSavingsRate: promotional?.savingsRate ?? 0,
    hasPromotionalSavings: Boolean(promotional),
    isBestValue: bestValue?.presentation.id === presentation.id,
    bestValueLabel: bestValue?.presentation.id === presentation.id ? `Mejor precio por ${unitLabel}` : null,
  };
}

export function getPresentationSavings(
  presentation: ProductPresentation,
  presentations: readonly ProductPresentation[],
) {
  const comparison = buildPresentationComparison(presentation, presentations);
  return comparison?.hasSavings ? comparison.savings : 0;
}

export function getProductMaxSavings(presentations: readonly ProductPresentation[]) {
  return presentations.reduce((max, presentation) => {
    const comparisonSavings = getPresentationSavings(presentation, presentations);
    const promotionalSavings = getPromotionalSavings(presentation)?.savings ?? 0;
    return Math.max(max, comparisonSavings, promotionalSavings);
  }, 0);
}

export function hasVolumeSavings(presentations: readonly ProductPresentation[]) {
  return presentations.some((presentation) => getPresentationSavings(presentation, presentations) > 0);
}

export function hasPromotion(presentations: readonly ProductPresentation[]) {
  return presentations.some((presentation) => presentation.promotional === true && (getPromotionalSavings(presentation) || presentation.promotionLabel));
}
