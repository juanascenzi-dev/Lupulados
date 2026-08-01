import { formatPrice } from "@/domain/format";
import { getHumanPresentationLabel } from "@/domain/storeCatalog";
import type { buildPresentationComparison } from "@/domain/storePricing";

export function formatPercent(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0%";
  return `${Math.round(value * 100)}%`;
}

export function getSavingsCopy(comparison: ReturnType<typeof buildPresentationComparison>) {
  if (!comparison) return null;
  const savings = comparison.hasPromotionalSavings
    ? comparison.promotionalSavings
    : comparison.savings;
  const rate = comparison.hasPromotionalSavings
    ? comparison.promotionalSavingsRate
    : comparison.savingsRate;
  if (savings <= 0) return null;
  if (comparison.hasPromotionalSavings) {
    return `Ahorras ${formatPrice(savings)} (${formatPercent(rate)})`;
  }
  if (comparison.referencePresentation) {
    const referenceLabel = getHumanPresentationLabel(comparison.referencePresentation);
    return `Ahorras ${formatPrice(savings)} comparado con ${referenceLabel}`;
  }
  return `Ahorras ${formatPrice(savings)} (${formatPercent(rate)})`;
}
