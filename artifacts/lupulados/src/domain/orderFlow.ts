import {
  barrelPresentationIds,
  createBeerCartItem,
  getCartItemPresentationId,
  growlerPresentationIds,
  packagedPresentationIds,
  tastingPack,
  type Beer,
  type CartCategory,
} from "./beerCatalog";
import type { BarrelRecommendation } from "./barrelCalculator";
import type { StoredCartItem } from "./cartStorage";

export type OrderType = CartCategory | "paquete" | null;

const idsByOrderType = {
  barril: barrelPresentationIds,
  growler: growlerPresentationIds,
  porrón: packagedPresentationIds,
};

export function hasCurrentSelectionInCart(
  items: StoredCartItem[],
  selectedBeer: Beer | null,
  orderType: OrderType,
) {
  if (orderType === "paquete") {
    return items.some((item) => item.id === tastingPack.id && item.qty > 0);
  }

  if (!selectedBeer || !orderType || orderType === "pack") return false;

  const expectedIds = idsByOrderType[orderType];
  return items.some((item) => {
    const itemProductId = item.productId ?? item.beerId;
    if (itemProductId !== selectedBeer.id && !item.id.startsWith(`${selectedBeer.id}:`) && !item.name.startsWith(selectedBeer.name)) {
      return false;
    }
    const presentationId = (item.presentationType as ReturnType<typeof getCartItemPresentationId>) ?? getCartItemPresentationId(item.id);
    return Boolean(presentationId && expectedIds.includes(presentationId));
  });
}

export function hasTastingPack(items: StoredCartItem[]) {
  return items.some((item) => item.id === tastingPack.id && item.qty > 0);
}

export function buildRecommendedBarrelItems(
  beer: Beer,
  barrelPlan: BarrelRecommendation,
): StoredCartItem[] {
  const itemsById = new Map<string, StoredCartItem>();

  barrelPlan.parts.forEach((part) => {
    const presentation = beer.presentations.find((item) => item.id === part.presentationId);
    if (!presentation) {
      throw new Error(`Beer ${beer.id} does not have required barrel presentation ${part.presentationId}`);
    }

    if (presentation.category !== "barril") {
      throw new Error(`Presentation ${part.presentationId} is not a barrel presentation`);
    }

    const draft = createBeerCartItem(beer, part.presentationId);
    const existing = itemsById.get(draft.id);
    if (existing) {
      itemsById.set(draft.id, { ...existing, qty: existing.qty + part.count });
      return;
    }

    itemsById.set(draft.id, { ...draft, qty: part.count });
  });

  return Array.from(itemsById.values());
}

export function preparePendingBarrelRecommendation(
  next: BarrelRecommendation,
) {
  return next;
}
