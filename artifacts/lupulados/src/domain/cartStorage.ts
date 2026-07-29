import type { CartCategory } from "./beerCatalog";
import { tastingPack } from "./beerCatalog";
import type { CommercialSnapshot, ProductCategory } from "./commercialTypes";
import { createCartLineKey, isProductCategory } from "./productCatalog";

export const CART_STORAGE_KEY = "lupulados-cart";
export const MAX_CART_ITEM_QTY = 999;
export const CURRENT_CART_STORAGE_VERSION = 3;

export interface StoredCartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: CartCategory | ProductCategory | string;
  productCategory?: ProductCategory;
  productId?: string;
  productName?: string;
  /** Legacy beer fields are read for compatibility with persisted carts. */
  beerId?: string;
  /** Legacy beer fields are read for compatibility with persisted carts. */
  beerName?: string;
  presentationId?: string;
  presentationLabel?: string;
  presentationType?: string;
  presentationCategory?: string;
  variantId?: string;
  variantLabel?: string;
}

const legacyBeerCategories = new Set(["barril", "growler", "porron", "porrÃ³n"]);

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
    typeof item.category === "string" &&
    item.category.trim().length > 0
  );
}

interface VersionedStoredCart {
  version: 2 | 3;
  items: StoredCartItem[];
}

function isVersionedStoredCart(value: unknown): value is VersionedStoredCart {
  if (!value || typeof value !== "object") return false;
  const cart = value as Partial<VersionedStoredCart>;
  return (cart.version === 2 || cart.version === CURRENT_CART_STORAGE_VERSION) && Array.isArray(cart.items);
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
    productCategory: getStoredProductCategory(value),
    productId: typeof value.productId === "string" ? value.productId : typeof value.beerId === "string" ? value.beerId : undefined,
    productName:
      typeof value.productName === "string" ? value.productName : typeof value.beerName === "string" ? value.beerName : undefined,
    beerId: typeof value.beerId === "string" ? value.beerId : undefined,
    beerName: typeof value.beerName === "string" ? value.beerName : undefined,
    presentationId: typeof value.presentationId === "string" ? value.presentationId : undefined,
    presentationLabel: typeof value.presentationLabel === "string" ? value.presentationLabel : undefined,
    presentationType: typeof value.presentationType === "string" ? value.presentationType : undefined,
    presentationCategory: typeof value.presentationCategory === "string" ? value.presentationCategory : undefined,
    variantId: typeof value.variantId === "string" ? value.variantId : undefined,
    variantLabel: typeof value.variantLabel === "string" ? value.variantLabel : undefined,
  };
}

function getStoredProductCategory(value: Partial<StoredCartItem>): ProductCategory | undefined {
  if (isProductCategory(value.productCategory)) return value.productCategory;
  if (isProductCategory(value.category)) return value.category;
  if (value.category === "pack") return "pack";
  if (typeof value.beerId === "string" || typeof value.beerName === "string" || legacyBeerCategories.has(String(value.category))) {
    return "beer";
  }
  return undefined;
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
  const line = item as Partial<StoredCartItem>;
  const productId = line.productId ?? line.beerId ?? getLegacyProductId(line.id);
  const presentationId = getStablePresentationId(line);

  if (productId && presentationId) {
    return createCartLineKey({
      category: line.category ?? "product",
      productCategory: line.productCategory,
      productId,
      presentationId,
      variantId: line.variantId,
    });
  }

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
      .filter((presentation) => presentation.active && activeProducts.has(presentation.productId) && presentation.unitPrice > 0)
      .map((presentation) => [presentation.id, presentation]),
  );
  const reconciled = new Map<string, StoredCartItem>();

  items.forEach((item) => {
    const qty = normalizeCartQuantity(item.qty);
    if (qty <= 0) return;

    const next =
      isTastingPackLine(item)
        ? { ...tastingPack, productCategory: "pack" as const, qty }
        : reconcilePresentationItem(item, qty, activeProducts, activePresentations);
    if (!next) return;

    const key = getCartLineKey(next);
    const existing = reconciled.get(key);
    reconciled.set(key, existing ? { ...next, qty: normalizeCartQuantity(existing.qty + next.qty) } : next);
  });

  return Array.from(reconciled.values());
}

function isTastingPackLine(item: StoredCartItem) {
  return item.id === tastingPack.id || item.productId === tastingPack.productId;
}

function reconcilePresentationItem(
  item: StoredCartItem,
  qty: number,
  activeProducts: Map<string, CommercialSnapshot["products"][number]>,
  activePresentations: Map<string, CommercialSnapshot["productPresentations"][number]>,
) {
  const presentation = activePresentations.get(getStablePresentationId(item));
  if (!presentation) return null;
  const product = activeProducts.get(presentation.productId);
  if (!product) return null;

  const variantLabel = item.variantLabel ?? product.style;
  const variantId = item.variantId ?? variantLabel;

  return {
    id: createCartLineKey({
      category: presentation.category,
      productCategory: product.category,
      productId: product.id,
      presentationId: presentation.id,
      variantId,
    }),
    name: [product.name, presentation.label].filter(Boolean).join(" — "),
    price: presentation.unitPrice,
    qty,
    category: presentation.category as CartCategory,
    productCategory: product.category,
    productId: product.id,
    productName: product.name,
    beerId: product.category === "beer" ? product.id : undefined,
    beerName: product.category === "beer" ? product.name : undefined,
    presentationId: presentation.id,
    presentationLabel: presentation.label,
    presentationType: presentation.presentationType,
    presentationCategory: presentation.category,
    variantId,
    variantLabel,
  } satisfies StoredCartItem;
}

function getLegacyProductId(id: string | undefined) {
  return typeof id === "string" && id.includes(":") ? id.split(":")[0] : undefined;
}

function getStablePresentationId(item: Partial<StoredCartItem>) {
  if (typeof item.presentationId === "string" && item.presentationId.includes(":")) {
    return item.presentationId;
  }

  const productId = item.productId ?? item.beerId ?? getLegacyProductId(item.id);
  const presentationType =
    item.presentationType ??
    (typeof item.presentationId === "string" ? item.presentationId : undefined) ??
    (typeof item.id === "string" && item.id.includes(":") ? item.id.split(":")[1] : undefined);

  return productId && presentationType ? `${productId}:${presentationType}` : item.id ?? "";
}
