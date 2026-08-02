import type { Beer } from "./beerCatalog";

export function normalizeBeerStyleSelection(selectedIds: string[], catalog: Beer[]): string[] {
  const catalogIds = new Set(catalog.map((beer) => beer.id));
  const result: string[] = [];

  for (const id of selectedIds) {
    if (!catalogIds.has(id) || result.includes(id)) continue;
    result.push(id);
  }

  return result;
}

export function toggleBeerStyleSelection(
  selectedIds: string[],
  beerId: string,
  catalog: Beer[],
): string[] {
  const normalized = normalizeBeerStyleSelection(selectedIds, catalog);
  if (!catalog.some((beer) => beer.id === beerId)) return normalized;
  if (normalized.includes(beerId)) return normalized.filter((id) => id !== beerId);
  return [...normalized, beerId];
}

export function summarizeBeerStyleSelection(selectedIds: string[], catalog: Beer[]): string {
  const normalized = normalizeBeerStyleSelection(selectedIds, catalog);
  if (normalized.length === 0) return "Cualquiera";
  if (normalized.length === 1) {
    return catalog.find((beer) => beer.id === normalized[0])?.name ?? "1 estilo seleccionado";
  }
  return `${normalized.length} estilos seleccionados`;
}
