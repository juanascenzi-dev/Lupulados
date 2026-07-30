import type { CartCategory } from "./beerCatalog";
import { tastingPack } from "./beerCatalog";
import type { CommercialSnapshot, ProductCategory } from "./commercialTypes";
import { createCartLineKey, isProductCategory } from "./productCatalog";
import {
  buildConfigurablePackCartItem,
  isConfigurableBeerPackItem,
  isPackLineMetadata,
  listPackAvailableProducts,
  type PackLineMetadata,
} from "./configurableBeerPack";

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
  promotional?: boolean;
  promotionLabel?: string;
  pack?: PackLineMetadata;
}

const LEGACY_MOJIBAKE_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ["Degustaci\u00c3\u00b3n", "Degustación"],
  ["Degustaci\u00c3\u0192\u00c2\u00b3n", "Degustación"],
  ["porr\u00c3\u00b3n", "porrón"],
  ["Porr\u00c3\u00b3n", "Porrón"],
  ["porr\u00c3\u0192\u00c2\u00b3n", "porrón"],
  ["Porr\u00c3\u0192\u00c2\u00b3n", "Porrón"],
  ["Porr\u00c3n", "Porrón"],
  ["porr\u00c3n", "porrón"],
  [" \u00e2\u20ac\u201d ", " — "],
  [" \u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d ", " — "],
];

const legacyBeerCategories = new Set(["barril", "growler", "porron", "porrón"]);

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
    name: normalizeLegacyCatalogText(value.name),
    price: value.price,
    qty,
    category: normalizeLegacyCatalogText(value.category),
    productCategory: getStoredProductCategory(value),
    productId: typeof value.productId === "string" ? value.productId : typeof value.beerId === "string" ? value.beerId : undefined,
    productName:
      typeof value.productName === "string" ? normalizeLegacyCatalogText(value.productName) : typeof value.beerName === "string" ? normalizeLegacyCatalogText(value.beerName) : undefined,
    beerId: typeof value.beerId === "string" ? value.beerId : undefined,
    beerName: typeof value.beerName === "string" ? normalizeLegacyCatalogText(value.beerName) : undefined,
    presentationId: typeof value.presentationId === "string" ? value.presentationId : undefined,
    presentationLabel: typeof value.presentationLabel === "string" ? normalizeLegacyCatalogText(value.presentationLabel) : undefined,
    presentationType: typeof value.presentationType === "string" ? value.presentationType : undefined,
    presentationCategory: typeof value.presentationCategory === "string" ? normalizeLegacyCatalogText(value.presentationCategory) : undefined,
    variantId: typeof value.variantId === "string" ? value.variantId : undefined,
    variantLabel: typeof value.variantLabel === "string" ? normalizeLegacyCatalogText(value.variantLabel) : undefined,
    promotional: value.promotional === true ? true : undefined,
    promotionLabel: typeof value.promotionLabel === "string" ? value.promotionLabel : undefined,
    pack: isPackLineMetadata(value.pack)
      ? {
          ...value.pack,
          compositionLabel: normalizeLegacyCatalogText(value.pack.compositionLabel),
          composition: value.pack.composition.map((selection) => ({
            ...selection,
            name: typeof selection.name === "string" ? normalizeLegacyCatalogText(selection.name) : undefined,
          })),
        }
      : undefined,
  };
}

function normalizeLegacyCatalogText(value: string) {
  return LEGACY_MOJIBAKE_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.split(pattern).join(replacement),
    value,
  );
}

function getStoredProductCategory(value: Partial<StoredCartItem>): ProductCategory | undefined {
  const category = typeof value.category === "string" ? normalizeLegacyCatalogText(value.category) : undefined;
  if (isProductCategory(value.productCategory)) return value.productCategory;
  if (isProductCategory(category)) return category;
  if (category === "pack") return "pack";
  if (typeof value.beerId === "string" || typeof value.beerName === "string" || legacyBeerCategories.has(String(category))) {
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
        : isConfigurableBeerPackItem(item)
          ? reconcileConfigurablePackItem(item, qty, snapshot)
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

function reconcileConfigurablePackItem(
  item: StoredCartItem,
  qty: number,
  snapshot: CommercialSnapshot,
): StoredCartItem | null {
  if (!isPackLineMetadata(item.pack)) return null;
  const products = listPackAvailableProductsFromSnapshot(snapshot);
  if (products.length === 0) return null;
  const line = buildConfigurablePackCartItem(
    { capacity: item.pack.capacity, selections: item.pack.composition },
    products,
  );
  if (!isPackLineMetadata(line.pack) || line.pack.canonicalKey !== item.pack.canonicalKey) return null;
  return { ...line, qty };
}

function listPackAvailableProductsFromSnapshot(snapshot: CommercialSnapshot) {
  const activeProducts = snapshot.products.filter((product) => product.status === "active" && product.category === "beer");
  const beers = activeProducts.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    desc: product.description,
    abv: product.abv ?? 0,
    ibu: product.ibu ?? 0,
    badge: product.badge,
    image: product.image,
    img: product.image,
    precios: {} as never,
    presentations: snapshot.productPresentations
      .filter((presentation) =>
        presentation.productId === product.id &&
        presentation.active &&
        presentation.presentationType === "porron500ml" &&
        Number.isFinite(presentation.unitPrice) &&
        presentation.unitPrice > 0
      )
      .map((presentation) => ({
        id: "porron500ml" as const,
        label: presentation.label,
        price: presentation.unitPrice,
        category: presentation.category as CartCategory,
        liters: presentation.volumeLiters,
        description: presentation.description,
      })),
  }));
  return listPackAvailableProducts(beers);
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
    promotional: presentation.promotional,
    promotionLabel: presentation.promotionLabel,
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
