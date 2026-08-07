import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { commercialSnapshot } from "./commercialData";
import {
  addCartItemToCart,
  parseCartItems,
  writeCartItems,
  type StoredCartItem,
} from "./cartStorage";
import {
  getDefaultWhatsAppChannelId,
  listOrderWhatsAppChannels,
  validateCheckout,
} from "./checkout";
import { buildWhatsAppOrderMessage } from "./whatsAppOrder";
import { calculateOrderSummary } from "./orderSummary";
import { createCommercialCartItem } from "./productCatalog";
import {
  buildStoreCatalog,
  buildStoreCatalogWithDemo,
  buildStoreSnapshot,
  filterStoreCatalog,
  getHumanPresentationLabel,
  getStoreImageSource,
  getStoreResultLabel,
  listStorePresentationOptions,
  listStoreSubcategories,
  normalizeSearchText,
} from "./storeCatalog";
import { listVisibleCatalogCategories } from "./productCatalog";
import type { CommercialSnapshot } from "./commercialTypes";

function realBeerSnapshot(): CommercialSnapshot {
  const products = commercialSnapshot.products.filter((product) => product.category === "beer");
  const productIds = new Set(products.map((product) => product.id));
  return {
    ...structuredClone(commercialSnapshot),
    products,
    productPresentations: commercialSnapshot.productPresentations.filter((presentation) =>
      productIds.has(presentation.productId),
    ),
  };
}

function line(productId: string, presentationId?: string) {
  const product = commercialSnapshot.products.find((item) => item.id === productId);
  if (!product) throw new Error(`Missing product ${productId}`);
  const presentation = commercialSnapshot.productPresentations.find(
    (item) => item.productId === product.id && (!presentationId || item.id === presentationId),
  );
  if (!presentation) throw new Error(`Missing presentation for ${productId}`);
  return createCommercialCartItem(product, presentation);
}

describe("storeCatalog", () => {
  it("combines a Supabase beer snapshot with local demo store products without mutating the original", () => {
    const snapshot = realBeerSnapshot();
    const before = JSON.stringify(snapshot);
    const catalog = buildStoreCatalogWithDemo(snapshot);
    const ids = catalog.map((item) => item.product.id);

    expect(catalog).toHaveLength(33);
    expect(filterStoreCatalog(catalog, { mainCategory: "beer" })).toHaveLength(8);
    expect(filterStoreCatalog(catalog, { mainCategory: "alcohol" })).toHaveLength(11);
    expect(filterStoreCatalog(catalog, { mainCategory: "non-alcohol" })).toHaveLength(7);
    expect(filterStoreCatalog(catalog, { mainCategory: "combo" })).toHaveLength(4);
    expect(filterStoreCatalog(catalog, { mainCategory: "accessory" })).toHaveLength(3);
    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("keeps real products and presentations ahead of demo records with the same IDs", () => {
    const snapshot = realBeerSnapshot();
    const demoCola = commercialSnapshot.products.find((product) => product.id === "demo-cola");
    const demoColaPresentation = commercialSnapshot.productPresentations.find(
      (presentation) => presentation.id === "demo-cola:2-25l",
    );
    if (!demoCola || !demoColaPresentation) throw new Error("Missing demo cola fixture");
    const realCola = { ...demoCola, name: "Gaseosa cola real", demo: false, sortOrder: 12 };
    const realPresentation = {
      ...demoColaPresentation,
      label: "Botella real 2,25 L",
      unitPrice: 1,
    };

    const storeSnapshot = buildStoreSnapshot({
      ...snapshot,
      products: [...snapshot.products, realCola],
      productPresentations: [...snapshot.productPresentations, realPresentation],
    });
    const catalog = buildStoreCatalog(storeSnapshot);
    const cola = catalog.find((item) => item.product.id === "demo-cola");

    expect(cola?.product.name).toBe("Gaseosa cola real");
    expect(cola?.isDemo).toBe(false);
    expect(cola?.presentations).toEqual([
      expect.objectContaining({ id: "demo-cola:2-25l", unitPrice: 1 }),
    ]);
    expect(
      new Set(storeSnapshot.productPresentations.map((presentation) => presentation.id)).size,
    ).toBe(storeSnapshot.productPresentations.length);
  });

  it("does not expand quick-order categories when only the real beer snapshot is active", () => {
    expect(listVisibleCatalogCategories(realBeerSnapshot()).map((category) => category.id)).toEqual(
      ["beer"],
    );
  });

  it("builds a mixed demo catalog with visible main categories and demo identification", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);

    expect(catalog.length).toBeGreaterThanOrEqual(25);
    expect(catalog.length).toBeLessThanOrEqual(45);
    expect(filterStoreCatalog(catalog, { mainCategory: "beer" }).length).toBeGreaterThan(0);
    expect(filterStoreCatalog(catalog, { mainCategory: "alcohol" }).length).toBeGreaterThan(0);
    expect(filterStoreCatalog(catalog, { mainCategory: "non-alcohol" }).length).toBeGreaterThan(0);
    expect(
      filterStoreCatalog(catalog, { mainCategory: "combo" }).some(
        (item) => item.product.components?.length,
      ),
    ).toBe(true);
    expect(catalog.filter((item) => item.isDemo).length).toBeGreaterThan(15);
    expect(catalog.find((item) => item.product.id === "blonde-ale")?.isDemo).toBe(false);
  });

  it("filters by subcategory, product category, presentation and accent-insensitive text", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);

    expect(
      filterStoreCatalog(catalog, { subcategory: "Whiskies y bourbons" }).map(
        (item) => item.product.id,
      ),
    ).toContain("demo-whisky-blend");
    expect(
      filterStoreCatalog(catalog, { productCategory: "gin" }).map((item) => item.product.id),
    ).toContain("demo-gin-dry");
    expect(filterStoreCatalog(catalog, { presentationType: "750ml" }).length).toBeGreaterThan(5);
    expect(
      filterStoreCatalog(catalog, { presentationType: "porron500ml" }).every((item) =>
        item.presentations.some((presentation) => presentation.presentationType === "porron500ml"),
      ),
    ).toBe(true);
    expect(
      filterStoreCatalog(catalog, { query: "tonica" }).map((item) => item.product.id),
    ).toContain("demo-tonic");
    expect(
      filterStoreCatalog(catalog, { query: "GASEOSA" }).map((item) => item.product.id),
    ).toContain("demo-cola");
    expect(normalizeSearchText("Cerveza Tónica")).toBe("cerveza tonica");
  });

  it("clears filters by returning the full catalog and reports empty state labels", () => {
    const catalog = buildStoreCatalog(commercialSnapshot);
    const empty = filterStoreCatalog(catalog, { query: "producto-inexistente" });

    expect(empty).toEqual([]);
    expect(
      filterStoreCatalog(catalog, { query: "", mainCategory: "all", subcategory: "all" }),
    ).toHaveLength(catalog.length);
    expect(listStoreSubcategories(catalog, "alcohol")).toContain("Fernet y amargos");
    expect(getStoreResultLabel(0)).toBe("0 resultados");
    expect(getStoreResultLabel(1)).toBe("1 resultado");
  });

  it("builds stable presentation options with human labels and filters by the technical value", () => {
    const catalog = buildStoreCatalogWithDemo(realBeerSnapshot());
    const options = listStorePresentationOptions(catalog);
    const labelsByValue = new Map(options.map((option) => [option.value, option.label]));

    expect(labelsByValue.get("barril20L")).toBe("Barril 20 L");
    expect(labelsByValue.get("porron500ml")).toBe("Porrón 500 ml");
    expect(labelsByValue.get("750ml")).toBe("Botella 750 ml");
    expect(labelsByValue.get("pack6")).toBe("Pack x6");
    expect(options.some((option) => option.label === option.value)).toBe(false);
    expect(filterStoreCatalog(catalog, { presentationType: "barril20L" })).toHaveLength(8);
    expect(
      getHumanPresentationLabel({ presentationType: "evento", label: "Evento", sortOrder: 1 }),
    ).toBe("Por evento");
  });

  it("uses product images only when they are valid and treats demo placeholders as missing", () => {
    expect(
      getStoreImageSource({
        ...commercialSnapshot.products[0],
        image: "https://cdn.example.test/beer.jpg",
      }),
    ).toBe("https://cdn.example.test/beer.jpg");
    expect(getStoreImageSource({ ...commercialSnapshot.products[0], image: "" })).toBeNull();
    expect(getStoreImageSource({ ...commercialSnapshot.products[0], image: "   " })).toBeNull();
    expect(
      getStoreImageSource({
        ...commercialSnapshot.products[0],
        image: "https://example.com/lupulados-demo-placeholder",
      }),
    ).toBeNull();
  });

  it("keeps StorePage on accessible Select controls, image fallback and add feedback", () => {
    const source = readFileSync(resolve(process.cwd(), "src/pages/StorePage.tsx"), "utf8");

    expect(source).toContain("@/components/ui/select");
    expect(source).toContain("ConfigurableBeerPackBuilder");
    expect(source).toContain("Pack de porrones x6");
    expect(source).toContain("Personalizar pack");
    expect(source).not.toContain("<select");
    expect(source).toContain("onError={() => setFailedSource(imageSource)}");
    expect(source).toContain('role="status"');
    expect(source).toContain('aria-live="polite"');
    expect(source).toContain("Agregaste");
    expect(source).toContain("getHumanPresentationLabel");
  });

  it("keeps the new checkout and order wizard off native selects where the store flow reaches them", () => {
    const checkout = readFileSync(
      resolve(process.cwd(), "src/components/commercial/SharedCheckoutPanel.tsx"),
      "utf8",
    );
    const orderWizard = readFileSync(
      resolve(process.cwd(), "src/components/ArmaTuPedido.tsx"),
      "utf8",
    );
    const customerDetailsForm = readFileSync(
      resolve(process.cwd(), "src/components/order-wizard/CustomerDetailsForm.tsx"),
      "utf8",
    );
    const beerQuantityStep = readFileSync(
      resolve(process.cwd(), "src/components/order-wizard/BeerQuantityStep.tsx"),
      "utf8",
    );

    expect(checkout).toContain("@/components/ui/select");
    expect(checkout).not.toContain("<select");
    expect(customerDetailsForm).toContain("@/components/ui/select");
    expect(customerDetailsForm).not.toContain("<select");
    expect(orderWizard).not.toContain("<select");
    expect(beerQuantityStep).toContain("ConfigurableBeerPackBuilder");
    expect(beerQuantityStep).toContain('orderType === "porrón"');
    expect(beerQuantityStep).toContain('orderType === "paquete" &&');
  });

  it("keeps the beer-category step skip (paquete/porrón jump straight to step 3) working via the pure wizard-step helpers", () => {
    const orderWizardConstants = readFileSync(
      resolve(process.cwd(), "src/domain/orderWizardConstants.ts"),
      "utf8",
    );
    const orderWizardConstantsTest = readFileSync(
      resolve(process.cwd(), "src/domain/orderWizardConstants.test.ts"),
      "utf8",
    );

    expect(orderWizardConstants).toContain("getNextWizardStep");
    expect(orderWizardConstants).toContain("getPrevWizardStep");
    expect(orderWizardConstantsTest).toContain("skips step 2 for paquete/porrón");
  });

  it("keeps configurable beer pack layout and step navigation behavior scoped to the shared builder", () => {
    const orderWizard = readFileSync(
      resolve(process.cwd(), "src/components/ArmaTuPedido.tsx"),
      "utf8",
    );
    const useOrderWizardState = readFileSync(
      resolve(process.cwd(), "src/hooks/useOrderWizardState.ts"),
      "utf8",
    );
    const beerQuantityStep = readFileSync(
      resolve(process.cwd(), "src/components/order-wizard/BeerQuantityStep.tsx"),
      "utf8",
    );
    const storePage = readFileSync(resolve(process.cwd(), "src/pages/StorePage.tsx"), "utf8");
    const builder = readFileSync(
      resolve(process.cwd(), "src/components/ConfigurableBeerPackBuilder.tsx"),
      "utf8",
    );
    const packProductList = readFileSync(
      resolve(process.cwd(), "src/components/configurable-beer-pack/PackProductList.tsx"),
      "utf8",
    );
    const packSummaryPanel = readFileSync(
      resolve(process.cwd(), "src/components/configurable-beer-pack/PackSummaryPanel.tsx"),
      "utf8",
    );

    expect(useOrderWizardState).toContain("CONFIGURABLE_PACK_ORDER_TYPE");
    expect(orderWizard).toContain("isConfigurablePackStep");
    expect(orderWizard).toContain("!isConfigurablePackStep &&");
    expect(useOrderWizardState).toContain("scrollIntoView");
    expect(useOrderWizardState).toContain("prefers-reduced-motion: reduce");
    expect(beerQuantityStep).toContain('layout="wide"');
    expect(orderWizard).toContain("WizardActionBar");
    expect(orderWizard).toContain("MobileCartSummary");
    expect(orderWizard).toContain("getCompactCartLineDescription");
    expect(orderWizard).toContain('detailed && item.pack?.type === "configurable-beer-pack"');
    expect(orderWizard).toContain("--wizard-action-bottom-inset");
    expect(orderWizard).toContain("lg:min-h-[min(620px,var(--wizard-viewport-height))]");
    expect(orderWizard).toContain("lg:h-[var(--wizard-viewport-height)]");
    expect(orderWizard).toContain(
      'isConfigurablePackStep ? "overflow-visible" : "overflow-hidden"',
    );
    expect(orderWizard).toContain('"overflow-y-auto overscroll-contain"');
    expect(orderWizard).not.toContain("hover:scale-[1.02]");
    expect(storePage).toContain("ConfigurableBeerPackBuilder");
    expect(storePage).toContain("Personalizar pack");
    expect(storePage).not.toContain('layout="wide"');
    expect(builder).toContain('layout?: "default" | "wide"');
    expect(builder).toContain("minmax(0,1fr)");
    expect(builder).toContain("grid-rows-[auto_auto_minmax(0,1fr)]");
    expect(packProductList).toContain("lg:overflow-y-auto");
    expect(packSummaryPanel).toContain("Completa todos los packs");
    expect(builder).not.toContain("position:absolute");
  });

  it("uses a local event image for weddings and keeps an image fallback", () => {
    const events = readFileSync(resolve(process.cwd(), "src/components/Eventos.tsx"), "utf8");

    expect(events).toContain("/events/wedding-reception.jpg");
    expect(events).toContain("EventImage");
    expect(events).toContain("onError={() => setFailed(true)}");
    expect(events).toContain("aria-label={alt}");
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
    const withDifferentPresentation = addCartItemToCart(
      withRepeat,
      line("blonde-ale", "blonde-ale:growler1L"),
      1,
    );

    expect(
      withRepeat.find(
        (item) => item.productId === "blonde-ale" && item.presentationType === "barril20L",
      )?.qty,
    ).toBe(3);
    expect(
      withDifferentPresentation.filter((item) => item.productId === "blonde-ale"),
    ).toHaveLength(2);
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

    expect(restored[0]).toMatchObject({
      productId: "demo-combo-gin",
      qty: 999,
      productCategory: "pack",
    });
  });

  it("validates checkout data, channels and WhatsApp message content", () => {
    const items = [
      line("blonde-ale", "blonde-ale:barril20L"),
      line("demo-wine-malbec"),
      line("demo-cola"),
    ].map((item) => ({ ...item, qty: 1 }));
    const summary = calculateOrderSummary(
      items,
      {
        chopera: true,
        delivery: "norte",
        hielo: 1,
        vasos: 12,
        promoCode: "PRIMERABIRRA",
        discount: 0.1,
      },
      commercialSnapshot,
    );
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

    expect(
      validateCheckout({
        formData: {
          name: "",
          eventDate: "",
          timeSlot: "Tarde",
          delivery: "norte",
          address: "",
          notes: "",
        },
        totalItems: 0,
        today: "2026-07-29",
        deliveryRequiresAddress: true,
      }).valid,
    ).toBe(false);
    expect(
      validateCheckout({
        formData: {
          name: "Cliente",
          eventDate: "2026-08-20",
          timeSlot: "Tarde",
          delivery: "norte",
          address: "Direccion",
          notes: "",
        },
        totalItems: 1,
        today: "2026-07-29",
        deliveryRequiresAddress: true,
      }).valid,
    ).toBe(true);
    expect(listOrderWhatsAppChannels(commercialSnapshot.whatsappChannels)).toHaveLength(2);
    expect(getDefaultWhatsAppChannelId(commercialSnapshot.whatsappChannels)).toBe(
      "whatsapp-principal",
    );
    expect(message).toContain("Blonde Ale");
    expect(message).toContain("Vino Malbec demo");
    expect(message).toContain("Gaseosa cola demo");
    expect(message).toContain("Hielo");
    expect(message).toContain("Total estimado");
    expect(message).toContain("Sin enviar realmente");
    expect(message).not.toMatch(
      /undefined|null|NaN|\[object Object\]|productId|presentationId|SKU|tabla/i,
    );
  });
});
