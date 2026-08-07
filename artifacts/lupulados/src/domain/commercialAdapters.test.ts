import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  buildBeerCatalog,
  buildBusinessConfig,
  buildOrderTypeOptions,
  getCartItemLitersFromSnapshot,
  getDeliveryOptionFromSnapshot,
} from "./commercialAdapters";
import type { CommercialSnapshot, Product, ProductPresentation } from "./commercialTypes";

function cloneSnapshot(overrides: Partial<CommercialSnapshot> = {}): CommercialSnapshot {
  return {
    ...structuredClone(commercialSnapshot),
    ...overrides,
  };
}

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "beer-1",
    slug: "beer-1",
    name: "Test Beer",
    description: "Cerveza de prueba",
    category: "beer",
    image: "beer.png",
    status: "active",
    sortOrder: 0,
    ...overrides,
  };
}

function buildPresentation(overrides: Partial<ProductPresentation> = {}): ProductPresentation {
  return {
    id: "presentation-1",
    productId: "beer-1",
    presentationType: "barril20L",
    label: "Barril 20L",
    volumeLiters: 20,
    unitPrice: 10000,
    category: "barril",
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("buildBeerCatalog", () => {
  it("only includes active beer products and fills missing presentation prices with 0", () => {
    const snapshot = cloneSnapshot({
      products: [
        buildProduct({ id: "beer-1", category: "beer" }),
        buildProduct({ id: "wine-1", category: "wine" as Product["category"] }),
        buildProduct({ id: "beer-archived", category: "beer", status: "archived" }),
      ],
      productPresentations: [
        buildPresentation({
          id: "p1",
          productId: "beer-1",
          presentationType: "barril20L",
          unitPrice: 8000,
        }),
      ],
    });

    const catalog = buildBeerCatalog(snapshot);
    expect(catalog).toHaveLength(1);
    expect(catalog[0].id).toBe("beer-1");
    expect(catalog[0].precios.barril20L).toBe(8000);
    expect(catalog[0].precios.barril30L).toBe(0);
    expect(catalog[0].precios.porron500ml).toBe(0);
  });
});

describe("buildOrderTypeOptions", () => {
  it("recomputes the barrel/growler/porrón starting prices from the snapshot", () => {
    const snapshot = cloneSnapshot({
      products: [buildProduct({ id: "beer-1", category: "beer" })],
      productPresentations: [
        buildPresentation({
          id: "p1",
          productId: "beer-1",
          presentationType: "barril20L",
          unitPrice: 5000,
        }),
        buildPresentation({
          id: "p2",
          productId: "beer-1",
          presentationType: "growler1L",
          unitPrice: 3000,
          category: "growler",
        }),
        buildPresentation({
          id: "p3",
          productId: "beer-1",
          presentationType: "porron500ml",
          unitPrice: 900,
          category: "porrón",
        }),
      ],
    });

    const options = buildOrderTypeOptions(snapshot);
    expect(options.find((option) => option.id === "barril")?.desdePrice).toBe(5000);
    expect(options.find((option) => option.id === "growler")?.desdePrice).toBe(3000);
    expect(options.find((option) => option.id === "porrón")?.desdePrice).toBe(900);
  });

  it("keeps the pack degustación price hardcoded regardless of the snapshot (documented debt)", () => {
    const snapshot = cloneSnapshot({
      products: [buildProduct({ id: "beer-1", category: "beer" })],
      productPresentations: [
        buildPresentation({
          id: "p1",
          productId: "beer-1",
          presentationType: "barril20L",
          unitPrice: 99999,
        }),
      ],
    });
    const options = buildOrderTypeOptions(snapshot);
    expect(options.find((option) => option.id === "paquete")?.desdePrice).toBe(10500);
  });

  it("falls back to 0, not Infinity, when no presentation of a group has a price above 0", () => {
    const snapshot = cloneSnapshot({
      products: [buildProduct({ id: "beer-1", category: "beer" })],
      productPresentations: [],
    });
    const options = buildOrderTypeOptions(snapshot);
    expect(options.find((option) => option.id === "barril")?.desdePrice).toBe(0);
  });
});

describe("buildBusinessConfig", () => {
  it("uses documented defaults when there is no active promotion or WhatsApp channel", () => {
    const snapshot = cloneSnapshot({ promotions: [], whatsappChannels: [] });
    const config = buildBusinessConfig(snapshot);
    expect(config.promotionConfig).toEqual({
      code: "",
      type: "percentage",
      value: 0,
      bannerClosedStorageKey: "promoBannerClosed",
    });
    expect(config.whatsappNumber).toBe("");
    expect(config.whatsappDisplayLabel).toBe("WhatsApp no disponible");
  });
});

describe("getDeliveryOptionFromSnapshot", () => {
  it("returns the matching option, or falls back to the first one for an unknown id", () => {
    const [first] = buildBusinessConfig().deliveryOptions;
    expect(getDeliveryOptionFromSnapshot("does-not-exist")).toEqual(first);
  });
});

describe("getCartItemLitersFromSnapshot", () => {
  const snapshot = cloneSnapshot({
    productPresentations: [
      buildPresentation({
        id: "presentation-direct",
        productId: "beer-1",
        presentationType: "barril20L",
        volumeLiters: 20,
      }),
    ],
  });

  it("matches directly by presentation id", () => {
    expect(getCartItemLitersFromSnapshot("presentation-direct", snapshot)).toBe(20);
  });

  it("matches via the presentation=X:Y query-like pattern", () => {
    expect(getCartItemLitersFromSnapshot("beer|presentation=beer-1:barril20L", snapshot)).toBe(20);
  });

  it("matches by splitting itemId on ':' when there is no presentation= pattern", () => {
    expect(getCartItemLitersFromSnapshot("beer-1:barril20L", snapshot)).toBe(20);
  });

  it("returns 0 when the itemId matches nothing", () => {
    expect(getCartItemLitersFromSnapshot("unrecognized-id", snapshot)).toBe(0);
  });
});
