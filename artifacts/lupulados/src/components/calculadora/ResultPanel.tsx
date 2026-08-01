import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import type { Beer } from "@/domain/beerCatalog";
import {
  BEVERAGE_LABELS,
  BEVERAGE_TYPE_ORDER,
  type BeverageMixItemEstimate,
} from "@/domain/beverageMix";
import { formatPrice } from "@/domain/format";

interface ResultPanelProps {
  mixIsDefault: boolean;
  totalLiters: number;
  barrelPlan: BarrelRecommendation;
  selectedBeer: Beer | null;
  priceDisclaimer: string;
  mixResult: BeverageMixItemEstimate[];
  beerSharePercentage: number;
  onUseRecommendation: (recommendation: BarrelRecommendation) => void;
}

export function ResultPanel({
  mixIsDefault,
  totalLiters,
  barrelPlan,
  selectedBeer,
  priceDisclaimer,
  mixResult,
  beerSharePercentage,
  onUseRecommendation,
}: ResultPanelProps) {
  return (
    <div className="lg:col-span-5">
      <div className="calculator-result-card bg-black/40 rounded-3xl p-4 lg:p-5 xl:p-6 border border-primary/20 flex flex-col items-center justify-start text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 w-full" role="status" aria-live="polite" aria-atomic="true">
          {mixIsDefault ? (
            <>
              <span className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-semibold mb-1.5 block">
                Vas a necesitar
              </span>
              <div className="text-[clamp(3rem,6vw,4.75rem)] leading-none font-display font-bold text-white mb-1 tracking-tighter">
                {totalLiters}
                <span className="text-2xl md:text-3xl text-primary ml-1">L</span>
              </div>

              <div className="calculator-result-divider h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-3 lg:my-4" />

              <span className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-semibold mb-2 block">
                Sugerencia de barriles
              </span>
              <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-2.5 mb-3 lg:mb-4 font-mono font-bold text-base md:text-lg w-full">
                {barrelPlan.label}
              </div>

              <div className="calculator-result-price mb-4 lg:mb-5">
                <span className="text-white/40 text-xs block mb-1">
                  {selectedBeer ? `Precio para ${selectedBeer.name}` : "Estimado desde"}
                </span>
                <span className="text-white font-bold text-2xl">
                  {formatPrice(barrelPlan.estimatedPrice)}
                </span>
                <span className="text-white/35 text-xs block mt-1.5">{priceDisclaimer}</span>
              </div>
            </>
          ) : (
            <div className="mb-4 lg:mb-5 text-left space-y-2.5">
              <span className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-semibold mb-1 block text-center">
                Desglose por bebida
              </span>
              {BEVERAGE_TYPE_ORDER.filter((bevType) =>
                mixResult.some((item) => item.type === bevType && item.percentage > 0),
              ).map((bevType) => {
                const item = mixResult.find((i) => i.type === bevType);
                if (!item) return null;
                return (
                  <div
                    key={bevType}
                    className="bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-white font-bold text-sm">
                        {BEVERAGE_LABELS[bevType]} ({item.percentage}%)
                      </span>
                      <span className="text-primary font-mono font-bold text-sm">
                        {item.liters} L
                      </span>
                    </div>
                    {bevType === "beer" ? (
                      <div className="flex items-center justify-between gap-2 text-xs text-white/60">
                        <span className="font-mono">{barrelPlan.label}</span>
                        <span>{formatPrice(barrelPlan.estimatedPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-white/60">
                        ≈ {item.approxBottles} botellas (estimación aproximada)
                      </span>
                    )}
                  </div>
                );
              })}
              <span className="text-white/35 text-xs block">{priceDisclaimer}</span>
            </div>
          )}

          {beerSharePercentage === 0 && !mixIsDefault && (
            <p className="text-xs text-amber-400/90 mb-2.5">
              Esta función todavía no arma pedidos de bebidas espirituosas — agregá cerveza a la
              mezcla para poder usar la recomendación.
            </p>
          )}

          <button
            onClick={() => onUseRecommendation(barrelPlan)}
            disabled={barrelPlan.parts.length === 0}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-base md:text-lg shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:-translate-y-1 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            Usar esta recomendación
          </button>
        </div>
      </div>
    </div>
  );
}
