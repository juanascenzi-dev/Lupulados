import type { CartCategory } from "./beerCatalog";

export const CART_STORAGE_KEY = "lupulados-cart";

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
