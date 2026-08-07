import { describe, expect, it } from "vitest";
import {
  additionalCosts,
  buildWhatsAppUrl,
  deliveryOptions,
  formatDeliveryForMessage,
  getDeliveryOption,
  promotionConfig,
  whatsappNumber,
} from "./businessConfig";
import { formatPrice } from "./format";

describe("getDeliveryOption", () => {
  it("returns the matching option for a known id", () => {
    const [first] = deliveryOptions;
    expect(getDeliveryOption(first.id)).toEqual(first);
  });

  it("falls back to the first delivery option for an unknown id", () => {
    const [first] = deliveryOptions;
    expect(getDeliveryOption("does-not-exist")).toEqual(first);
  });
});

describe("buildWhatsAppUrl", () => {
  it("uses the default business WhatsApp number when no phone is given", () => {
    const url = buildWhatsAppUrl("Hola!");
    expect(url).toContain(whatsappNumber);
    expect(url).toContain(encodeURIComponent("Hola!"));
  });

  it("respects an explicit phone override", () => {
    const url = buildWhatsAppUrl("Hola!", "5491100000000");
    expect(url).toContain("5491100000000");
  });
});

describe("formatDeliveryForMessage", () => {
  it("appends the formatted cost when the option is not free", () => {
    const paid = deliveryOptions.find((option) => option.cost > 0);
    expect(paid).toBeDefined();
    expect(formatDeliveryForMessage(paid!.id)).toBe(`${paid!.label} (${formatPrice(paid!.cost)})`);
  });

  it("shows 'Gratis' for a free delivery option", () => {
    const free = deliveryOptions.find((option) => option.cost === 0);
    expect(free).toBeDefined();
    expect(formatDeliveryForMessage(free!.id)).toBe(`${free!.label} (Gratis)`);
  });
});

describe("top-level constants derived from the commercial snapshot", () => {
  it("expose a well-formed threshold, promotion code shape and additional costs", () => {
    expect(additionalCosts.freeGlassesThreshold).toBeGreaterThan(0);
    expect(typeof promotionConfig.code).toBe("string");
    expect(["percentage", "fixed"]).toContain(promotionConfig.type);
  });
});
