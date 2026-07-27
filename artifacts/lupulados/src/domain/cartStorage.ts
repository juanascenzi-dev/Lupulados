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
  productId?: string;
  productName?: string;
  beerId?: string;
  beerName?: string;
  presentationId?: string;
  presentationLabel?: string;
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

const CURRENT_CART_STORAGE_VERSION = 2;

interface VersionedStoredCart {
  version: 2;
  items: StoredCartItem[];
}

function isVersionedStoredCart(value: unknown): value is VersionedStoredCart {
  if (!value || typeof value !== "object") return false;
  const cart = value as Partial<VersionedStoredCart>;
  return cart.version === CURRENT_CART_STORAGE_VERSION && Array.isArray(cart.items);
}

function normalizeStoredCartItem(value: StoredCartItem): StoredCartItem | null {
  const qty = normalizeCartQuantity(value.qty);
  if (qty <= 0) return null;

  return {
    id: value.id,
    name: value.name,
    price: value.price,
    qty,
    category: value.category,
    productId: typeof value.productId === "string" ? value.productId : undefined,
    productName: typeof value.productName === "string" ? value.productName : undefined,
    beerId: typeof value.beerId === "string" ? value.beerId : undefined,
    beerName: typeof value.beerName === "string" ? value.beerName : undefined,
    presentationId: typeof value.presentationId === "string" ? value.presentationId : undefined,
    presentationLabel: typeof value.presentationLabel === "string" ? value.presentationLabel : undefined,
  };
}

function parseStoredCartPayload(parsed: unknown): StoredCartItem[] {
  const rawItems = Array.isArray(parsed)
    ? parsed
    : isVersionedStoredCart(parsed)
      ? parsed.items
      : [];

  return rawItems
    .filter(isStoredCartItem)
    .map(normalizeStoredCartItem)
    .filter((item): item is StoredCartItem => Boolean(item));
}

export function parseCartItems(rawValue: string | null): StoredCartItem[] {
  if (!rawValue) return [];

  try {
    const parsed = JSON.parse(rawValue);
    return parseStoredCartPayload(parsed);
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
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: CURRENT_CART_STORAGE_VERSION, items }));
  } catch {
    // Storage can fail in private mode or when quota is exceeded; the cart still works in memory.
  }
}

export function normalizeCartQuantity(qty: number) {
  if (!Number.isFinite(qty)) return 0;
  return Math.min(Math.max(Math.trunc(qty), 0), MAX_CART_ITEM_QTY);
}

export function getCartLineKey(item: Pick<StoredCartItem, "id" | "category">) {
  return `${item.category}:${item.id}`;
}

export function areSameCartLine(
  left: Pick<StoredCartItem, "id" | "category">,
  right: Pick<StoredCartItem, "id" | "category">,
) {
  return getCartLineKey(left) === getCartLineKey(right);
}

export function getCartItemSubtotal(item: Pick<StoredCartItem, "price" | "qty">) {
  return item.price * item.qty;
}

export function addCartItemToCart(
  items: readonly StoredCartItem[],
  item: Omit<StoredCartItem, "qty">,
  qty = 1,
) {
  const nextQty = normalizeCartQuantity(qty);
  if (nextQty <= 0) return [...items];

  const existing = items.find((current) => areSameCartLine(current, item));
  if (existing) {
    return items.map((current) =>
      areSameCartLine(current, item)
        ? { ...current, qty: normalizeCartQuantity(current.qty + nextQty) }
        : current,
    );
  }

  return [...items, { ...item, qty: nextQty }];
}

export function updateCartItemQuantity(items: readonly StoredCartItem[], id: string, qty: number) {
  const nextQty = normalizeCartQuantity(qty);
  if (nextQty <= 0) {
    return items.filter((item) => item.id !== id);
  }
  return items.map((item) => (item.id === id ? { ...item, qty: nextQty } : item));
}

export function getCartTotal(items: readonly StoredCartItem[]) {
  return items.reduce((total, item) => total + getCartItemSubtotal(item), 0);
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
    productId: product.id,
    productName: product.name,
    beerId: product.category === "beer" ? product.id : undefined,
    beerName: product.category === "beer" ? product.name : undefined,
    presentationId: presentation.presentationType,
    presentationLabel: presentation.label,
  } satisfies StoredCartItem;
}
