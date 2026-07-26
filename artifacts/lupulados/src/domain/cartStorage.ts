import type { CartCategory } from "./beerCatalog";
import { tastingPack } from "./beerCatalog";
import type { CommercialSnapshot } from "./commercialTypes";

export const CART_STORAGE_KEY = "lupulados-cart";
export const MAX_CART_ITEM_QTY = 999;

export interface StoredCartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: CartCategory;
}

const validCategories: CartCategory[] = ["barril", "growler", "porrón", "pack"];

function isStoredCartItem(value: unknown): value is StoredCartItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<StoredCartItem>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.price === "number" &&
    Number.isFinite(item.price) &&
    typeof item.qty === "number" &&
    Number.isInteger(item.qty) &&
    item.qty > 0 &&
    item.qty <= MAX_CART_ITEM_QTY &&
    validCategories.includes(item.category as CartCategory)
  );
}

export function parseCartItems(rawValue: string | null): StoredCartItem[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return Array.isArray(parsed) ? parsed.filter(isStoredCartItem) : [];
  } catch {
    return [];
  }
}

export function readCartItems(storage: Pick<Storage, "getItem" | "removeItem">): StoredCartItem[] {
  try {
    const rawValue = storage.getItem(CART_STORAGE_KEY);
    const items = parseCartItems(rawValue);
    if (rawValue && items.length === 0) {
      storage.removeItem(CART_STORAGE_KEY);
    }
    return items;
  } catch {
    return [];
  }
}

export function writeCartItems(storage: Pick<Storage, "setItem">, items: StoredCartItem[]) {
  try {
    storage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can fail in private mode or when quota is exceeded; the cart still works in memory.
  }
}

export function normalizeCartQuantity(qty: number) {
  if (!Number.isFinite(qty)) return 0;
  return Math.min(Math.max(Math.trunc(qty), 0), MAX_CART_ITEM_QTY);
}

export function reconcileCartItemsWithSnapshot(
  items: readonly StoredCartItem[],
  snapshot: CommercialSnapshot,
): StoredCartItem[] {
  const activeProducts = new Map(
    snapshot.products
      .filter((product) => product.status === "active")
      .map((product) => [product.id, product]),
  );
  const activePresentations = new Map(
    snapshot.productPresentations
      .filter((presentation) => presentation.active && activeProducts.has(presentation.productId))
      .map((presentation) => [presentation.id, presentation]),
  );
  const reconciled = new Map<string, StoredCartItem>();

  items.forEach((item) => {
    const qty = normalizeCartQuantity(item.qty);
    if (qty <= 0) return;

    const next =
      item.id === tastingPack.id
        ? { ...tastingPack, qty }
        : reconcilePresentationItem(item.id, qty, activeProducts, activePresentations);
    if (!next) return;

    const existing = reconciled.get(next.id);
    reconciled.set(next.id, existing ? { ...next, qty: normalizeCartQuantity(existing.qty + next.qty) } : next);
  });

  return Array.from(reconciled.values());
}

function reconcilePresentationItem(
  id: string,
  qty: number,
  activeProducts: Map<string, CommercialSnapshot["products"][number]>,
  activePresentations: Map<string, CommercialSnapshot["productPresentations"][number]>,
) {
  const presentation = activePresentations.get(id);
  if (!presentation) return null;
  const product = activeProducts.get(presentation.productId);
  if (!product) return null;

  return {
    id: presentation.id,
    name: `${product.name} — ${presentation.label}`,
    price: presentation.unitPrice,
    qty,
    category: presentation.category as CartCategory,
  } satisfies StoredCartItem;
}
