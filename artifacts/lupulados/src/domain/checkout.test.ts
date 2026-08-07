import { describe, expect, it } from "vitest";
import {
  getDefaultWhatsAppChannelId,
  getTodayInputValue,
  listOrderWhatsAppChannels,
  validateCheckout,
  type CheckoutValidationInput,
} from "./checkout";
import type { WhatsAppChannel } from "./commercialTypes";

function buildFormData(overrides: Partial<CheckoutValidationInput["formData"]> = {}) {
  return {
    name: "Julian",
    eventDate: "2026-08-10",
    timeSlot: "18:00",
    delivery: "retiro-fabrica" as CheckoutValidationInput["formData"]["delivery"],
    address: "",
    notes: "",
    ...overrides,
  };
}

describe("validateCheckout", () => {
  it("is valid with a complete form and no errors", () => {
    const result = validateCheckout({
      formData: buildFormData(),
      totalItems: 2,
      today: "2026-08-07",
      deliveryRequiresAddress: false,
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("accumulates every applicable error at once instead of stopping at the first", () => {
    const result = validateCheckout({
      formData: buildFormData({ name: "", eventDate: "" }),
      totalItems: 0,
      today: "2026-08-07",
      deliveryRequiresAddress: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toEqual([
      "Agrega al menos un producto al carrito.",
      "Indica tu nombre.",
      "Indica la fecha.",
    ]);
  });

  it("rejects an event date earlier than today", () => {
    const result = validateCheckout({
      formData: buildFormData({ eventDate: "2026-08-06" }),
      totalItems: 1,
      today: "2026-08-07",
      deliveryRequiresAddress: false,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("La fecha no puede ser anterior a hoy.");
  });

  it("accepts an event date equal to today", () => {
    const result = validateCheckout({
      formData: buildFormData({ eventDate: "2026-08-07" }),
      totalItems: 1,
      today: "2026-08-07",
      deliveryRequiresAddress: false,
    });
    expect(result.valid).toBe(true);
  });

  it("does not require an address when the delivery option does not need one", () => {
    const result = validateCheckout({
      formData: buildFormData({ address: "" }),
      totalItems: 1,
      today: "2026-08-07",
      deliveryRequiresAddress: false,
    });
    expect(result.valid).toBe(true);
  });

  it("requires a non-blank address when the delivery option requires one", () => {
    const result = validateCheckout({
      formData: buildFormData({ address: "   " }),
      totalItems: 1,
      today: "2026-08-07",
      deliveryRequiresAddress: true,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Indica la direccion de entrega.");
  });

  it("accepts a trimmed non-blank address when required", () => {
    const result = validateCheckout({
      formData: buildFormData({ address: "Av. Siempre Viva 742" }),
      totalItems: 1,
      today: "2026-08-07",
      deliveryRequiresAddress: true,
    });
    expect(result.valid).toBe(true);
  });
});

describe("getTodayInputValue", () => {
  it("returns a YYYY-MM-DD formatted string", () => {
    const value = getTodayInputValue(new Date("2026-08-07T12:00:00Z"));
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("is deterministic for a fixed date", () => {
    const fixed = new Date("2026-08-07T12:00:00Z");
    expect(getTodayInputValue(fixed)).toBe(getTodayInputValue(fixed));
  });
});

function buildChannel(overrides: Partial<WhatsAppChannel>): WhatsAppChannel {
  return {
    id: "default",
    label: "Ventas",
    phoneDisplay: "11 3397-1210",
    phoneE164: "5491133971210",
    purpose: "orders",
    isPrimary: false,
    active: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe("listOrderWhatsAppChannels", () => {
  it("includes a contact-only channel as a valid fallback for orders", () => {
    const channels = [buildChannel({ id: "contact", purpose: "contact" })];
    expect(listOrderWhatsAppChannels(channels).map((channel) => channel.id)).toEqual(["contact"]);
  });

  it("excludes inactive channels", () => {
    const channels = [
      buildChannel({ id: "active", active: true }),
      buildChannel({ id: "inactive", active: false }),
    ];
    expect(listOrderWhatsAppChannels(channels).map((channel) => channel.id)).toEqual(["active"]);
  });

  it("orders primary channels first, then by sortOrder", () => {
    const channels = [
      buildChannel({ id: "second", isPrimary: false, sortOrder: 1 }),
      buildChannel({ id: "primary", isPrimary: true, sortOrder: 5 }),
      buildChannel({ id: "first", isPrimary: false, sortOrder: 0 }),
    ];
    expect(listOrderWhatsAppChannels(channels).map((channel) => channel.id)).toEqual([
      "primary",
      "first",
      "second",
    ]);
  });
});

describe("getDefaultWhatsAppChannelId", () => {
  it("returns the id of the first eligible channel", () => {
    const channels = [buildChannel({ id: "primary", isPrimary: true })];
    expect(getDefaultWhatsAppChannelId(channels)).toBe("primary");
  });

  it("returns an empty string when there are no eligible channels", () => {
    expect(getDefaultWhatsAppChannelId([])).toBe("");
  });
});
