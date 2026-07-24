import {
  barrelPresentationIds,
  getCartItemPresentationId,
  growlerPresentationIds,
  packagedPresentationIds,
  tastingPack,
  type Beer,
  type CartCategory,
} from "./beerCatalog";
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
    if (!item.id.startsWith(`${selectedBeer.id}:`) && !item.name.startsWith(selectedBeer.name)) return false;
    const presentationId = getCartItemPresentationId(item.id);
    return Boolean(presentationId && expectedIds.includes(presentationId));
  });
}

export function hasTastingPack(items: StoredCartItem[]) {
  return items.some((item) => item.id === tastingPack.id && item.qty > 0);
}
