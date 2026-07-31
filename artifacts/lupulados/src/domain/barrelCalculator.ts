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

const smallestBarrelIndex = barrelOptions.reduce(
  (minIndex, option, index) => (option.size < barrelOptions[minIndex].size ? index : minIndex),
  0,
);
const minimumBarrelSize = barrelOptions[smallestBarrelIndex].size;
const otherBarrelIndexes = barrelOptions.map((_, index) => index).filter((index) => index !== smallestBarrelIndex);

const emptyRecommendation = (requiredLiters: number): BarrelRecommendation => ({
  requiredLiters,
  coveredLiters: 0,
  excessLiters: 0,
  totalPrice: 0,
  estimatedPrice: 0,
  totalBarrels: 0,
  parts: [],
  label: `No llegamos a un barril de ${minimumBarrelSize}L, ¡mejor pedí packs o growlers!`,
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

  const effectiveRequired = Math.max(minimumBarrelSize, normalizedRequired);
  const maxCount = Math.ceil(effectiveRequired / minimumBarrelSize) + 3;
  let best: BarrelRecommendation | null = null;

  // Para conteos fijos de los "otros" tamaños, los litros cubiertos crecen estrictamente
  // con la cantidad del barril más chico, así que su excedente también crece estrictamente.
  // compareRecommendations ordena primero por excedente, así que el único conteo del barril
  // más chico que puede ganar es el mínimo necesario para cubrir el requerimiento: se calcula
  // en forma cerrada en vez de recorrerlo con un tercer loop. Asume exactamente 3 presentaciones
  // de barril (2 loops + 1 fórmula cerrada); un 4° tamaño requeriría un loop adicional.
  for (let countA = 0; countA <= maxCount; countA += 1) {
    for (let countB = 0; countB <= maxCount; countB += 1) {
      const otherCounts = [countA, countB];
      const otherCoveredLiters = otherCounts.reduce(
        (sum, count, i) => sum + count * barrelOptions[otherBarrelIndexes[i]].size,
        0,
      );

      const remaining = effectiveRequired - otherCoveredLiters;
      const smallestCount = Math.max(0, Math.ceil(remaining / minimumBarrelSize));

      const counts = new Array(barrelOptions.length).fill(0) as number[];
      counts[smallestBarrelIndex] = smallestCount;
      otherBarrelIndexes.forEach((optionIndex, i) => {
        counts[optionIndex] = otherCounts[i];
      });

      const coveredLiters = counts.reduce((sum, count, index) => sum + count * barrelOptions[index].size, 0);

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

  return best ?? emptyRecommendation(normalizedRequired);
}
