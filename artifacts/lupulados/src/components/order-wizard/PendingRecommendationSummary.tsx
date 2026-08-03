import type { Beer as CatalogBeer } from "@/domain/beerCatalog";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import { formatPrice } from "@/domain/format";

interface PendingRecommendationSummaryProps {
  recommendation: BarrelRecommendation;
  selectedBeer: CatalogBeer | null;
  pendingBeerPreferenceNames: string[];
}

export function PendingRecommendationSummary({
  recommendation,
  selectedBeer,
  pendingBeerPreferenceNames,
}: PendingRecommendationSummaryProps) {
  return (
    <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-primary/20 bg-primary/10 p-3">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            Recomendación calculada
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Necesitás</p>
              <p className="text-white font-bold text-sm">{recommendation.requiredLiters} L</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Sugerimos</p>
              <p className="text-white font-bold text-sm">{recommendation.label}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Total</p>
              <p className="text-white font-bold text-sm">{recommendation.coveredLiters} L</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">Excedente</p>
              <p className="text-white font-bold text-sm">{recommendation.excessLiters} L</p>
            </div>
          </div>
          {pendingBeerPreferenceNames.length > 0 && (
            <p className="mt-3 text-xs text-white/55">
              Preferencias de estilo: {pendingBeerPreferenceNames.slice(0, 3).join(", ")}
              {pendingBeerPreferenceNames.length > 3
                ? ` +${pendingBeerPreferenceNames.length - 3}`
                : ""}
            </p>
          )}
        </div>
        <div className="md:text-right shrink-0">
          <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
            {recommendation.beerId && selectedBeer
              ? `Precio para ${selectedBeer.name}`
              : "Estimado desde"}
          </p>
          <p className="text-primary font-mono font-bold text-lg">
            {formatPrice(recommendation.estimatedPrice)}
          </p>
        </div>
      </div>
    </div>
  );
}
