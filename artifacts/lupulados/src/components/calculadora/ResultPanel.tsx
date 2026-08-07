import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import { BEVERAGE_LABELS, type BeverageMixItemEstimate } from "@/domain/beverageMix";
import { formatPrice } from "@/domain/format";

interface ResultPanelProps {
  mixIsDefault: boolean;
  totalLiters: number;
  barrelPlan: BarrelRecommendation;
  selectedBeerName: string | null;
  priceDisclaimer: string;
  mixResult: BeverageMixItemEstimate[];
  durationValidationMessage: string | null;
  onUseRecommendation: (
    recommendation: BarrelRecommendation,
    mixResult: BeverageMixItemEstimate[],
  ) => void;
}

export function ResultPanel({
  mixIsDefault,
  totalLiters,
  barrelPlan,
  selectedBeerName,
  priceDisclaimer,
  mixResult,
  durationValidationMessage,
  onUseRecommendation,
}: ResultPanelProps) {
  const nonBeerItems = mixResult.filter((item) => item.type !== "beer" && item.percentage > 0);
  const mixSummary = mixIsDefault
    ? "100% cerveza"
    : `Cerveza ${mixResult.find((item) => item.type === "beer")?.percentage ?? 0}%${
        nonBeerItems.length > 0
          ? ` + ${nonBeerItems
              .slice(0, 2)
              .map((item) => BEVERAGE_LABELS[item.type])
              .join(", ")}${nonBeerItems.length > 2 ? ` +${nonBeerItems.length - 2}` : ""}`
          : ""
      }`;
  const canUseRecommendation =
    !durationValidationMessage &&
    (barrelPlan.parts.length > 0 ||
      mixResult.some((item) => item.type !== "beer" && item.percentage > 0));

  return (
    <div className="calculator-result-column min-h-0 lg:col-span-5">
      <div className="calculator-result-card relative flex h-full min-h-0 flex-col overflow-hidden rounded-3xl border border-primary/20 bg-black/40 p-4 text-center lg:p-4 xl:p-5">
        <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-28 w-28 rounded-full bg-amber-500/10 blur-3xl" />

        <div
          className="relative z-10 flex min-h-0 w-full flex-col gap-3"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {durationValidationMessage ? (
            <div className="flex min-h-44 flex-col items-center justify-center">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-widest text-white/60">
                Falta un dato
              </span>
              <p className="max-w-sm text-balance text-lg font-bold text-white">
                {durationValidationMessage}
              </p>
            </div>
          ) : (
            <>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-widest text-white/60">
                  Vas a necesitar
                </span>
                <div className="font-display text-[clamp(3.25rem,5vw,4.4rem)] font-bold leading-none text-white">
                  {totalLiters}
                  <span className="ml-1 text-2xl text-primary md:text-3xl">L</span>
                </div>
                <span className="text-xs text-white/45">Litros estimados de cerveza</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="min-w-0 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2.5">
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-widest text-white/45">
                    Sugerencia
                  </span>
                  <span className="mt-1 block truncate font-mono text-base font-bold text-primary">
                    {barrelPlan.label}
                  </span>
                </div>
                <div className="min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5">
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-widest text-white/45">
                    Mezcla actual
                  </span>
                  <span className="mt-1 block truncate text-sm font-semibold text-white/75">
                    {mixSummary}
                  </span>
                </div>
              </div>

              <div className="flex items-end justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left">
                <span className="text-xs text-white/45">
                  {selectedBeerName ? `Precio para ${selectedBeerName}` : "Estimado desde"}
                </span>
                <span className="shrink-0 text-2xl font-bold leading-none text-white">
                  {formatPrice(barrelPlan.estimatedPrice)}
                </span>
              </div>
              <span className="-mt-2 block truncate text-xs text-white/35">{priceDisclaimer}</span>
            </>
          )}

          <button
            type="button"
            onClick={() => onUseRecommendation(barrelPlan, mixResult)}
            disabled={!canUseRecommendation}
            className="w-full rounded-xl bg-gradient-to-r from-primary to-amber-500 py-3 text-base font-bold text-black shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(217,119,6,0.45)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Usar esta recomendacion
          </button>
        </div>
      </div>
    </div>
  );
}
