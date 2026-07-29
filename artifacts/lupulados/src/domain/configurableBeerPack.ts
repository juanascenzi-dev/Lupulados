import type { Beer } from "./beerCatalog";
import type { StoredCartItem } from "./cartStorage";

export const CONFIGURABLE_BEER_PACK_CAPACITY = 6;
export const CONFIGURABLE_BEER_PACK_MAX_PACKS = 12;
export const CONFIGURABLE_BEER_PACK_VERSION = 1;
export const CONFIGURABLE_BEER_PACK_PRODUCT_ID = "pack-porrones-configurable";
export const CONFIGURABLE_BEER_PACK_PRESENTATION_ID = "pack-porrones-x6";

export interface PackSelection {
  productId: string;
  quantity: number;
  name?: string;
}

export interface ConfigurablePackComposition {
  type: "configurable-beer-pack";
  version: number;
  capacity: number;
  selections: PackSelection[];
}

export interface PackDraft {
  id: string;
  capacity: number;
  selections: PackSelection[];
}

export interface PackAvailableProduct {
  productId: string;
  name: string;
  price: number;
}

export interface PackLineMetadata {
  type: "configurable-beer-pack";
  version: number;
  capacity: number;
  totalBottles: number;
  canonicalKey: string;
  composition: PackSelection[];
  compositionLabel: string;
  unitPrice: number;
}

export interface GroupedConfigurablePack {
  key: string;
  draft: PackDraft;
  qty: number;
  unitPrice: number;
}

export function normalizePackCount(value: number, max = CONFIGURABLE_BEER_PACK_MAX_PACKS) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(max, Math.trunc(value) || 1));
}

export function createEmptyPackDraft(index = 0, capacity = CONFIGURABLE_BEER_PACK_CAPACITY): PackDraft {
  return {
    id: `pack-${index + 1}`,
    capacity: normalizeCapacity(capacity),
    selections: [],
  };
}

export function normalizePackSelection(selection: PackSelection): PackSelection | null {
  const productId = typeof selection.productId === "string" ? selection.productId.trim() : "";
  const quantity = normalizeSelectionQuantity(selection.quantity);
  if (!productId || quantity <= 0) return null;
  const name = typeof selection.name === "string" && selection.name.trim() ? selection.name.trim() : undefined;
  return { productId, quantity, name };
}

export function normalizePackComposition(
  draft: Pick<PackDraft, "capacity" | "selections">,
  validProductIds?: ReadonlySet<string>,
): ConfigurablePackComposition {
  const capacity = normalizeCapacity(draft.capacity);
  const byProduct = new Map<string, number>();

  draft.selections.forEach((selection) => {
    const normalized = normalizePackSelection(selection);
    if (!normalized) return;
    if (validProductIds && !validProductIds.has(normalized.productId)) return;
    byProduct.set(normalized.productId, Math.min(capacity, (byProduct.get(normalized.productId) ?? 0) + normalized.quantity));
  });

  let used = 0;
  const selections = Array.from(byProduct.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([productId, quantity]) => {
      const nextQuantity = Math.min(quantity, capacity - used);
      used += nextQuantity;
      return nextQuantity > 0 ? [{ productId, quantity: nextQuantity }] : [];
    });

  return {
    type: "configurable-beer-pack",
    version: CONFIGURABLE_BEER_PACK_VERSION,
    capacity,
    selections,
  };
}

export function getPackSelectedCount(draft: Pick<PackDraft, "capacity" | "selections">) {
  return normalizePackComposition(draft).selections.reduce((total, selection) => total + selection.quantity, 0);
}

export function getPackRemainingCount(draft: Pick<PackDraft, "capacity" | "selections">) {
  return Math.max(0, normalizeCapacity(draft.capacity) - getPackSelectedCount(draft));
}

export function isPackComplete(draft: Pick<PackDraft, "capacity" | "selections">) {
  return getPackSelectedCount(draft) === normalizeCapacity(draft.capacity);
}

export function updatePackSelection(
  draft: PackDraft,
  productId: string,
  quantity: number,
  validProductIds?: ReadonlySet<string>,
): PackDraft {
  const normalizedProductId = productId.trim();
  if (!normalizedProductId || (validProductIds && !validProductIds.has(normalizedProductId))) {
    return copyPackComposition(draft);
  }

  const capacity = normalizeCapacity(draft.capacity);
  const current = normalizePackComposition(draft, validProductIds);
  const otherSelections = current.selections.filter((selection) => selection.productId !== normalizedProductId);
  const otherTotal = otherSelections.reduce((total, selection) => total + selection.quantity, 0);
  const nextQuantity = Math.max(0, Math.min(normalizeSelectionQuantity(quantity), capacity - otherTotal));

  return {
    ...draft,
    capacity,
    selections: nextQuantity > 0
      ? [...otherSelections, { productId: normalizedProductId, quantity: nextQuantity }]
      : otherSelections,
  };
}

export function copyPackComposition(draft: Pick<PackDraft, "capacity" | "selections">, id = "pack-copy"): PackDraft {
  return {
    id,
    capacity: normalizeCapacity(draft.capacity),
    selections: normalizePackComposition(draft).selections.map((selection) => ({ ...selection })),
  };
}

export function resizePackDrafts(
  drafts: readonly PackDraft[],
  requestedCount: number,
  options: { allowDiscardConfigured?: boolean; max?: number } = {},
) {
  const count = normalizePackCount(requestedCount, options.max);
  if (count >= drafts.length) {
    return {
      drafts: [
        ...drafts.map((draft, index) => copyPackComposition(draft, `pack-${index + 1}`)),
        ...Array.from({ length: count - drafts.length }, (_, index) => createEmptyPackDraft(drafts.length + index)),
      ],
      needsConfirmation: false,
    };
  }

  const removed = drafts.slice(count);
  const needsConfirmation = removed.some((draft) => getPackSelectedCount(draft) > 0);
  if (needsConfirmation && !options.allowDiscardConfigured) {
    return { drafts: drafts.map((draft, index) => copyPackComposition(draft, `pack-${index + 1}`)), needsConfirmation: true };
  }

  return { drafts: drafts.slice(0, count).map((draft, index) => copyPackComposition(draft, `pack-${index + 1}`)), needsConfirmation: false };
}

export function applyCompositionToAllPacks(drafts: readonly PackDraft[], sourceIndex: number) {
  const source = drafts[sourceIndex];
  if (!source) return drafts.map((draft, index) => copyPackComposition(draft, `pack-${index + 1}`));
  return drafts.map((_, index) => copyPackComposition(source, `pack-${index + 1}`));
}

export function canonicalizePackComposition(composition: Pick<ConfigurablePackComposition, "capacity" | "selections">) {
  const normalized = normalizePackComposition(composition);
  const selectionKey = normalized.selections.map((selection) => `${selection.productId}=${selection.quantity}`).join("|");
  return [
    "pack=configurable-beer-pack",
    `version=${CONFIGURABLE_BEER_PACK_VERSION}`,
    `capacity=${normalized.capacity}`,
    selectionKey,
  ].filter(Boolean).join("|");
}

export function listPackAvailableProducts(beers: readonly Beer[]): PackAvailableProduct[] {
  return beers
    .flatMap((beer) => {
      const presentation = beer.presentations.find((item) => item.id === "porron500ml" && item.price > 0);
      if (!presentation || !Number.isFinite(presentation.price)) return [];
      return [{ productId: beer.id, name: beer.name, price: presentation.price }];
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function calculatePackPrice(
  composition: Pick<ConfigurablePackComposition, "capacity" | "selections">,
  products: readonly PackAvailableProduct[],
) {
  const prices = new Map(products.map((product) => [product.productId, product.price]));
  return normalizePackComposition(composition, new Set(prices.keys())).selections.reduce((total, selection) => {
    const price = prices.get(selection.productId);
    return total + (Number.isFinite(price) && price ? price * selection.quantity : 0);
  }, 0);
}

export function groupIdenticalPacks(drafts: readonly PackDraft[], products: readonly PackAvailableProduct[]): GroupedConfigurablePack[] {
  const validProductIds = new Set(products.map((product) => product.productId));
  const grouped = new Map<string, GroupedConfigurablePack>();

  drafts.forEach((draft) => {
    const composition = normalizePackComposition(draft, validProductIds);
    if (composition.selections.reduce((total, selection) => total + selection.quantity, 0) !== composition.capacity) return;
    const key = canonicalizePackComposition(composition);
    const current = grouped.get(key);
    const normalizedDraft = { ...draft, selections: composition.selections };
    if (current) {
      grouped.set(key, { ...current, qty: current.qty + 1 });
      return;
    }
    grouped.set(key, {
      key,
      draft: normalizedDraft,
      qty: 1,
      unitPrice: calculatePackPrice(composition, products),
    });
  });

  return Array.from(grouped.values());
}

export function formatPackComposition(
  composition: Pick<ConfigurablePackComposition, "capacity" | "selections">,
  products: readonly PackAvailableProduct[],
) {
  const names = new Map(products.map((product) => [product.productId, product.name]));
  return normalizePackComposition(composition, new Set(names.keys())).selections
    .map((selection) => `${selection.quantity} ${names.get(selection.productId) ?? selection.productId}`)
    .join(", ");
}

export function buildConfigurablePackCartItem(
  composition: Pick<ConfigurablePackComposition, "capacity" | "selections">,
  products: readonly PackAvailableProduct[],
): Omit<StoredCartItem, "qty"> {
  const validProductIds = new Set(products.map((product) => product.productId));
  const names = new Map(products.map((product) => [product.productId, product.name]));
  const normalized = normalizePackComposition(composition, validProductIds);
  const namedSelections = normalized.selections.map((selection) => ({ ...selection, name: names.get(selection.productId) }));
  const canonicalKey = canonicalizePackComposition(normalized);
  const unitPrice = calculatePackPrice(normalized, products);
  const compositionLabel = formatPackComposition(normalized, products);
  const metadata: PackLineMetadata = {
    type: "configurable-beer-pack",
    version: CONFIGURABLE_BEER_PACK_VERSION,
    capacity: normalized.capacity,
    totalBottles: normalized.capacity,
    canonicalKey,
    composition: namedSelections,
    compositionLabel,
    unitPrice,
  };

  return {
    id: canonicalKey,
    name: "Pack de 6 porrones",
    price: Number.isFinite(unitPrice) ? unitPrice : 0,
    category: "pack",
    productCategory: "pack",
    productId: CONFIGURABLE_BEER_PACK_PRODUCT_ID,
    productName: "Pack de 6 porrones",
    presentationId: CONFIGURABLE_BEER_PACK_PRESENTATION_ID,
    presentationLabel: "Pack configurable x6",
    presentationType: "pack-porrones-x6",
    presentationCategory: "pack",
    variantId: canonicalKey,
    variantLabel: compositionLabel,
    pack: metadata,
  };
}

export function isConfigurableBeerPackItem(item: { productId?: string; pack?: unknown }) {
  return item.productId === CONFIGURABLE_BEER_PACK_PRODUCT_ID || isPackLineMetadata(item.pack);
}

export function isPackLineMetadata(value: unknown): value is PackLineMetadata {
  if (!value || typeof value !== "object") return false;
  const metadata = value as Partial<PackLineMetadata>;
  return (
    metadata.type === "configurable-beer-pack" &&
    metadata.version === CONFIGURABLE_BEER_PACK_VERSION &&
    typeof metadata.capacity === "number" &&
    metadata.capacity === CONFIGURABLE_BEER_PACK_CAPACITY &&
    typeof metadata.canonicalKey === "string" &&
    Array.isArray(metadata.composition) &&
    metadata.composition.length > 0 &&
    metadata.composition.every((selection) => Boolean(normalizePackSelection(selection))) &&
    typeof metadata.compositionLabel === "string" &&
    typeof metadata.unitPrice === "number" &&
    Number.isFinite(metadata.unitPrice)
  );
}

function normalizeCapacity(value: number) {
  if (!Number.isFinite(value)) return CONFIGURABLE_BEER_PACK_CAPACITY;
  return Math.max(1, Math.trunc(value) || CONFIGURABLE_BEER_PACK_CAPACITY);
}

function normalizeSelectionQuantity(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.trunc(value) || 0);
}
