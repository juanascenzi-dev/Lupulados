import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import { validateCommercialSnapshot } from "./commercialSchemas";
import {
  getBusinessProfile,
  getPricingConfig,
  getPrimaryOrderWhatsAppChannel,
  getPrimaryOrderWhatsAppChannelFromSnapshot,
  listActiveProductPresentations,
  listActiveProducts,
} from "./commercialSelectors";
import { beerCatalog } from "./beerCatalog";
import { buildWhatsAppOrderUrl } from "./whatsAppOrder";
import { primaryOrderWhatsAppChannel, publicContactEmail, whatsappChannels } from "./businessConfig";
import type { CommercialSnapshot, WhatsAppChannel } from "./commercialTypes";

function cloneSnapshot(overrides: Partial<CommercialSnapshot> = {}): CommercialSnapshot {
  return {
    ...structuredClone(commercialSnapshot),
    ...overrides,
  };
}

describe("commercialData", () => {
  it("contains the confirmed public business profile", () => {
    const profile = getBusinessProfile();

    expect(profile.businessName).toBe("Lupulados");
    expect(profile.address).toBe("Primera Junta 2614");
    expect(profile.openingHours).toBe("Atención las 24 horas, todos los días.");
    expect(profile.email).toBeNull();
    expect(publicContactEmail).toBeNull();
  });

  it("contains the confirmed primary and alternative WhatsApp channels", () => {
    expect(whatsappChannels).toEqual([
      expect.objectContaining({
        label: "WhatsApp principal",
        phoneDisplay: "11 3397-1210",
        phoneE164: "5491133971210",
        isPrimary: true,
      }),
      expect.objectContaining({
        label: "WhatsApp alternativo",
        phoneDisplay: "11 6546-0294",
        phoneE164: "5491165460294",
        isPrimary: false,
      }),
    ]);
  });

  it("selects the active primary order WhatsApp channel", () => {
    expect(getPrimaryOrderWhatsAppChannel(commercialSnapshot.whatsappChannels)).toMatchObject({
      id: "whatsapp-principal",
      phoneE164: "5491133971210",
    });
  });

  it("falls back to the next active valid order channel when the primary is inactive", () => {
    const channels: WhatsAppChannel[] = [
      { ...commercialSnapshot.whatsappChannels[0], active: false },
      { ...commercialSnapshot.whatsappChannels[1], purpose: "orders_and_contact" },
    ];

    expect(getPrimaryOrderWhatsAppChannel(channels)).toMatchObject({
      id: "whatsapp-alternativo",
      phoneE164: "5491165460294",
    });
  });

  it("returns null when no WhatsApp channel can receive orders", () => {
    const channels = commercialSnapshot.whatsappChannels.map((channel) => ({
      ...channel,
      active: channel.id === "whatsapp-alternativo",
      purpose: "contact" as const,
      isPrimary: false,
    }));

    expect(getPrimaryOrderWhatsAppChannel(channels)).toBeNull();
  });

  it("keeps product ids unique and stable for the real beer catalog while exposing demo products", () => {
    const productIds = commercialSnapshot.products.map((product) => product.id);
    const realBeerIds = commercialSnapshot.products.filter((product) => product.category === "beer" && !product.demo).map((product) => product.id);
    const demoIds = commercialSnapshot.products.filter((product) => product.demo).map((product) => product.id);

    expect(new Set(productIds).size).toBe(productIds.length);
    expect(realBeerIds).toEqual([
      "blonde-ale",
      "apa",
      "ipa",
      "red-ale",
      "stout",
      "honey-wheat",
      "session-ipa",
      "scotch-ale",
    ]);
    expect(demoIds).toContain("demo-combo-fernet");
    expect(demoIds).toContain("demo-gin-dry");
  });

  it("keeps presentation ids unique and attached to valid products", () => {
    const presentationIds = commercialSnapshot.productPresentations.map((presentation) => presentation.id);
    const productIds = new Set(commercialSnapshot.products.map((product) => product.id));

    expect(new Set(presentationIds).size).toBe(presentationIds.length);
    expect(commercialSnapshot.productPresentations.every((presentation) => productIds.has(presentation.productId))).toBe(true);
  });

  it("excludes archived products from public selectors", () => {
    const snapshot = cloneSnapshot({
      products: commercialSnapshot.products.map((product) =>
        product.id === "ipa" ? { ...product, status: "archived" } : product,
      ),
    });

    expect(listActiveProducts(snapshot).map((product) => product.id)).not.toContain("ipa");
  });

  it("excludes archived presentations from public selectors", () => {
    const snapshot = cloneSnapshot({
      productPresentations: commercialSnapshot.productPresentations.map((presentation) =>
        presentation.id === "ipa:barril50L" ? { ...presentation, active: false } : presentation,
      ),
    });

    expect(listActiveProductPresentations("ipa", snapshot).map((presentation) => presentation.id)).not.toContain("ipa:barril50L");
  });

  it("keeps all prices finite and non-negative", () => {
    const prices = [
      ...commercialSnapshot.productPresentations.map((presentation) => presentation.unitPrice),
      ...commercialSnapshot.deliveryOptions.map((option) => option.price),
      ...commercialSnapshot.extraOptions.map((option) => option.price),
    ];

    expect(prices.every((price) => Number.isFinite(price) && price >= 0)).toBe(true);
  });

  it("keeps all presentation volumes valid", () => {
    expect(commercialSnapshot.productPresentations.every((presentation) => presentation.volumeLiters > 0)).toBe(true);
  });

  it("validates the complete commercial snapshot with Zod", () => {
    expect(validateCommercialSnapshot(commercialSnapshot)).toEqual(commercialSnapshot);
  });

  it("rejects duplicate ids, invalid prices and orphan presentations", () => {
    const invalid = cloneSnapshot({
      products: [commercialSnapshot.products[0], commercialSnapshot.products[0]],
      productPresentations: [
        { ...commercialSnapshot.productPresentations[0], productId: "missing-product", unitPrice: Number.NaN },
      ],
    });

    expect(() => validateCommercialSnapshot(invalid)).toThrow();
  });

  it("accepts an active order WhatsApp channel without a primary flag so selectors can fall back", () => {
    const valid = cloneSnapshot({
      whatsappChannels: commercialSnapshot.whatsappChannels.map((channel) => ({
        ...channel,
        purpose: "orders_and_contact",
        isPrimary: false,
      })),
    });

    expect(validateCommercialSnapshot(valid)).toEqual(valid);
    expect(getPrimaryOrderWhatsAppChannel(valid.whatsappChannels)?.id).toBe("whatsapp-principal");
  });

  it("rejects two active primary WhatsApp channels", () => {
    const invalid = cloneSnapshot({
      whatsappChannels: commercialSnapshot.whatsappChannels.map((channel) => ({ ...channel, isPrimary: true })),
    });

    expect(() => validateCommercialSnapshot(invalid)).toThrow("At most one active WhatsApp channel can be primary");
  });

  it("does not mutate snapshot data through selectors", () => {
    const before = JSON.stringify(commercialSnapshot);
    const product = listActiveProducts()[0];
    const presentation = listActiveProductPresentations(product.id)[0];
    const channel = getPrimaryOrderWhatsAppChannelFromSnapshot();

    product.name = "Changed";
    presentation.unitPrice = 1;
    if (channel) channel.phoneE164 = "5491100000000";

    expect(JSON.stringify(commercialSnapshot)).toBe(before);
  });

  it("keeps the public beer catalog compatible with current cart ids", () => {
    expect(beerCatalog[0]).toMatchObject({
      id: "blonde-ale",
      name: "Blonde Ale",
      precios: {
        barril20L: 38000,
        barril30L: 54000,
        barril50L: 85000,
        growler1L: 3200,
        growler2L: 5800,
        porron500ml: 1800,
      },
    });
  });

  it("keeps WhatsApp order handoff pointed at the primary number", () => {
    expect(primaryOrderWhatsAppChannel?.phoneE164).toBe("5491133971210");
    expect(buildWhatsAppOrderUrl(primaryOrderWhatsAppChannel!.phoneE164, "Hola")).toBe("https://wa.me/5491133971210?text=Hola");
  });

  it("exposes the centralized estimated price disclaimer", () => {
    expect(getPricingConfig()).toEqual({
      status: "estimated",
      disclaimer: "Los precios son estimativos y están sujetos a confirmación.",
    });
  });
});
