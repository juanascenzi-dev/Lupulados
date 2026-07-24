import { barrelPresentationIds, beerCatalog, type BeerPresentationId } from "./beerCatalog";

export interface BarrelRecommendationPart {
  size: number;
  count: number;
  price: number;
  presentationId: BeerPresentationId;
}

export interface BarrelRecommendation {
  requiredLiters: number;
  coveredLiters: number;
  excessLiters: number;
  totalPrice: number;
  estimatedPrice: number;
  totalBarrels: number;
  parts: BarrelRecommendationPart[];
  label: string;
}

const barrelOptions = barrelPresentationIds.map((presentationId) => {
  const prices = beerCatalog.map((beer) => beer.precios[presentationId]);
  return {
    presentationId,
    size: Number(presentationId.match(/\d+/)?.[0] ?? 0),
    minPrice: Math.min(...prices),
  };
});

const emptyRecommendation = (requiredLiters: number): BarrelRecommendation => ({
  requiredLiters,
  coveredLiters: 0,
  excessLiters: 0,
  totalPrice: 0,
  estimatedPrice: 0,
  totalBarrels: 0,
  parts: [],
  label: "No llegamos a un barril de 20L, ¡mejor pedí packs o growlers!",
});

function compareRecommendations(a: BarrelRecommendation, b: BarrelRecommendation) {
  return (
    a.excessLiters - b.excessLiters ||
    a.estimatedPrice - b.estimatedPrice ||
    a.totalBarrels - b.totalBarrels ||
    a.label.localeCompare(b.label)
  );
}

export function calculateBarrelRecommendation(requiredLiters: number): BarrelRecommendation {
  if (!Number.isFinite(requiredLiters)) {
    throw new RangeError("requiredLiters must be a finite number");
  }

  const normalizedRequired = Math.max(0, Math.ceil(requiredLiters));
  if (normalizedRequired <= 0) {
    return emptyRecommendation(normalizedRequired);
  }

  const effectiveRequired = Math.max(20, normalizedRequired);
  const maxCount = Math.ceil(effectiveRequired / 20) + 3;
  let best: BarrelRecommendation | null = null;

  for (let b20 = 0; b20 <= maxCount; b20 += 1) {
    for (let b30 = 0; b30 <= maxCount; b30 += 1) {
      for (let b50 = 0; b50 <= maxCount; b50 += 1) {
        const counts = [b20, b30, b50];
        const coveredLiters = counts.reduce((sum, count, index) => sum + count * barrelOptions[index].size, 0);
        if (coveredLiters < effectiveRequired) continue;

        const parts = counts
          .map((count, index) => ({ count, option: barrelOptions[index] }))
          .filter(({ count }) => count > 0)
          .map(({ count, option }) => ({
            size: option.size,
            count,
            price: option.minPrice,
            presentationId: option.presentationId,
          }))
          .sort((a, b) => b.size - a.size);

        const estimatedPrice = parts.reduce((sum, part) => sum + part.count * part.price, 0);
        const totalBarrels = parts.reduce((sum, part) => sum + part.count, 0);
        const candidate: BarrelRecommendation = {
          requiredLiters: normalizedRequired,
          coveredLiters,
          excessLiters: coveredLiters - normalizedRequired,
          totalPrice: estimatedPrice,
          estimatedPrice,
          totalBarrels,
          parts,
          label: parts.map((part) => `${part.count}x ${part.size}L`).join(" + "),
        };

        if (!best || compareRecommendations(candidate, best) < 0) {
          best = candidate;
        }
      }
    }
  }

  return best ?? emptyRecommendation(normalizedRequired);
}
