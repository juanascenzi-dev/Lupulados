import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import { addCartItemToCart, parseCartItems, writeCartItems, type StoredCartItem } from "./cartStorage";
import { getDefaultWhatsAppChannelId, listOrderWhatsAppChannels, validateCheckout } from "./checkout";
import { buildWhatsAppOrderMessage } from "./whatsAppOrder";
import { calculateOrderSummary } from "./orderSummary";
import { createCommercialCartItem } from "./productCatalog";
import {
  buildStoreCatalog,
  filterStoreCatalog,
  getStoreResultLabel,
  listStoreSubcategories,
  normalizeSearchText,
} from "./storeCatalog";

function line(productId: string, presentationId?: string) {
  const product = commercialSnapshot.products.find((item) => item.id === productId);
  if (!product) throw new Error(`Missing product ${productId}`);
  const presentation = commercialSnapshot.productPresentations.find((item) => item.productId === product.id && (!presentationId || item.id === presentationId));
  if (!presentation) throw new Error(`Missing presentation for ${productId}`);
  return createCommercialCartItem(product, presentation);
}

describe("storeCatalog", () => {
  it("builds a mixed demo catalog with visible main categories and demo identification", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);

    expect(catalog.length).toBeGreaterThanOrEqual(25);
    expect(catalog.length).toBeLessThanOrEqual(45);
    expect(filterStoreCatalog(catalog, { mainCategory: "beer" }).length).toBeGreaterThan(0);
    expect(filterStoreCatalog(catalog, { mainCategory: "alcohol" }).length).toBeGreaterThan(0);
    expect(filterStoreCatalog(catalog, { mainCategory: "non-alcohol" }).length).toBeGreaterThan(0);
    expect(filterStoreCatalog(catalog, { mainCategory: "combo" }).some((item) => item.product.components?.length)).toBe(true);
    expect(catalog.filter((item) => item.isDemo).length).toBeGreaterThan(15);
    expect(catalog.find((item) => item.product.id === "blonde-ale")?.isDemo).toBe(false);
  });

  it("filters by subcategory, product category, presentation and accent-insensitive text", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);

    expect(filterStoreCatalog(catalog, { subcategory: "Whiskies y bourbons" }).map((item) => item.product.id)).toContain("demo-whisky-blend");
    expect(filterStoreCatalog(catalog, { productCategory: "gin" }).map((item) => item.product.id)).toContain("demo-gin-dry");
    expect(filterStoreCatalog(catalog, { presentationType: "750ml" }).length).toBeGreaterThan(5);
    expect(filterStoreCatalog(catalog, { query: "tonica" }).map((item) => item.product.id)).toContain("demo-tonic");
    expect(filterStoreCatalog(catalog, { query: "GASEOSA" }).map((item) => item.product.id)).toContain("demo-cola");
    expect(normalizeSearchText("Cerveza Tónica")).toBe("cerveza tonica");
  });

  it("clears filters by returning the full catalog and reports empty state labels", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);
    const empty = filterStoreCatalog(catalog, { query: "producto-inexistente" });

    expect(empty).toEqual([]);
    expect(filterStoreCatalog(catalog, { query: "", mainCategory: "all", subcategory: "all" })).toHaveLength(catalog.length);
    expect(listStoreSubcategories(catalog, "alcohol")).toContain("Fernet y amargos");
    expect(getStoreResultLabel(0)).toBe("0 resultados");
    expect(getStoreResultLabel(1)).toBe("1 resultado");
  });
});
describe("shared cart and checkout domain", () => {
  it("keeps beer, alcoholic drinks, non alcoholic drinks and combos together with stable line behavior", () => {
    const beer = line("blonde-ale", "blonde-ale:barril20L");
    const beerGrowler = line("session-ipa", "session-ipa:growler1L");
    const wine = line("demo-wine-malbec", "demo-wine-malbec:750ml");
    const whisky = line("demo-whisky-blend");
    const gin = line("demo-gin-dry");
    const cola = line("demo-cola");
    const ice = line("demo-ice");
    const combo = line("demo-combo-fernet");

    const items = [beer, beerGrowler, wine, whisky, gin, cola, ice, combo].reduce<StoredCartItem[]>(
      (cart, item) => addCartItemToCart(cart, item, item.productId === "blonde-ale" ? 2 : 1),
      [],
    );
    const withRepeat = addCartItemToCart(items, beer, 1);
    const withDifferentPresentation = addCartItemToCart(withRepeat, line("blonde-ale", "blonde-ale:growler1L"), 1);

    expect(withRepeat.find((item) => item.productId === "blonde-ale" && item.presentationType === "barril20L")?.qty).toBe(3);
    expect(withDifferentPresentation.filter((item) => item.productId === "blonde-ale")).toHaveLength(2);
    expect(new Set(withDifferentPresentation.map((item) => item.productCategory))).toEqual(
      new Set(["beer", "wine", "whisky", "gin", "soft-drink", "ice", "pack"]),
    );
  });

  it("persists demo lines and normalizes invalid quantities when reloaded", () => {
    const storage = new Map<string, string>();
    const adapter = {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.get(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
    };
    const item = { ...line("demo-combo-gin"), qty: 1200 };

    writeCartItems(adapter, [item]);
    const restored = parseCartItems(adapter.getItem("lupulados-cart"));

    expect(restored[0]).toMatchObject({ productId: "demo-combo-gin", qty: 999, productCategory: "pack" });
  });

  it("validates checkout data, channels and WhatsApp message content", () => {
    const items = [line("blonde-ale", "blonde-ale:barril20L"), line("demo-wine-malbec"), line("demo-cola")].map((item) => ({ ...item, qty: 1 }));
    const summary = calculateOrderSummary(items, { chopera: true, delivery: "norte", hielo: 1, vasos: 12, promoCode: "PRIMERABIRRA", discount: 0.1 }, commercialSnapshot);
    const message = buildWhatsAppOrderMessage({
      customer: {
        name: "Cliente Demo",
        eventDate: "2026-08-20",
        timeSlot: "Tarde",
        address: "Direccion demo",
        notes: "Sin enviar realmente",
      },
      summary,
      snapshot: commercialSnapshot,
    });

    expect(validateCheckout({ formData: { name: "", eventDate: "", timeSlot: "Tarde", delivery: "norte", address: "", notes: "" }, totalItems: 0, today: "2026-07-29", deliveryRequiresAddress: true }).valid).toBe(false);
    expect(validateCheckout({ formData: { name: "Cliente", eventDate: "2026-08-20", timeSlot: "Tarde", delivery: "norte", address: "Direccion", notes: "" }, totalItems: 1, today: "2026-07-29", deliveryRequiresAddress: true }).valid).toBe(true);
    expect(listOrderWhatsAppChannels(commercialSnapshot.whatsappChannels)).toHaveLength(2);
    expect(getDefaultWhatsAppChannelId(commercialSnapshot.whatsappChannels)).toBe("whatsapp-principal");
    expect(message).toContain("Blonde Ale");
    expect(message).toContain("Vino Malbec demo");
    expect(message).toContain("Gaseosa cola demo");
    expect(message).toContain("Hielo");
    expect(message).toContain("Total estimado");
    expect(message).toContain("Sin enviar realmente");
    expect(message).not.toMatch(/undefined|null|NaN|\[object Object\]|productId|presentationId|SKU|tabla/i);
  });
});
