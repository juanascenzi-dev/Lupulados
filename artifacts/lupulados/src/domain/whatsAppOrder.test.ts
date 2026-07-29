import { describe, expect, it } from "vitest";
import { beerCatalog, createBeerCartItem, tastingPack } from "./beerCatalog";
import { calculateOrderSummary, type OrderSummaryExtras, type OrderSummaryItem } from "./orderSummary";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "./whatsAppOrder";
import { buildConfigurablePackCartItem, listPackAvailableProducts } from "./configurableBeerPack";

const baseExtras: OrderSummaryExtras = {
  chopera: false,
  delivery: "fabrica",
  hielo: 0,
  vasos: 0,
  promoCode: "",
  discount: 0,
};

function item(beerIndex: number, presentationId: Parameters<typeof createBeerCartItem>[1], qty: number) {
  return { ...createBeerCartItem(beerCatalog[beerIndex], presentationId), qty };
}

function messageFor(items: OrderSummaryItem[], extras: Partial<OrderSummaryExtras> = {}) {
  const summary = calculateOrderSummary(items, { ...baseExtras, ...extras });
  return buildWhatsAppOrderMessage({
    customer: {
      name: "Juan Ascenzi",
      eventDate: "2026-07-24",
      timeSlot: "20:00",
      address: "Av. Corrientes 1234",
      notes: "Tocar timbre, porton con ñ y acentos: áéíóú",
    },
    summary,
  });
}

describe("whatsAppOrder", () => {
  it("builds a message with one product and prudent confirmation wording", () => {
    const message = messageFor([item(2, "barril50L", 1)]);

    expect(message).toContain("Hola, quiero consultar por este pedido de Lupulados.");
    expect(message).toContain("Nombre: Juan Ascenzi");
    expect(message).toContain("Fecha del evento: 24/07/2026");
    expect(message).toContain("1. IPA");
    expect(message).toContain("Presentacion: Barril 50L");
    expect(message).toContain("Cantidad: 1 unidad");
    expect(message).toContain("Precio unitario: $105.000");
    expect(message).toContain("Subtotal: $105.000");
    expect(message).toContain("Total estimado: $105.000");
    expect(message).toContain("Los precios son estimativos");
    expect(message).toContain("precio final");
    expect(message).not.toContain("confirmado");
    expect(message).not.toContain("reservado");
  });

  it("keeps grouped product quantities in a single line with correct unit and subtotal prices", () => {
    const message = messageFor([item(1, "barril20L", 2)]);

    expect(message).toContain("1. American Pale Ale (APA)");
    expect(message).toContain("Presentacion: Barril 20L");
    expect(message).toContain("Cantidad: 2 unidades");
    expect(message).toContain("Subtotal: $84.000");
    expect(message.match(/American Pale Ale/g)).toHaveLength(1);
  });

  it("includes several beer styles and presentations once per cart item", () => {
    const message = messageFor([
      item(2, "barril50L", 1),
      item(1, "barril20L", 2),
      item(4, "growler2L", 3),
    ]);

    expect(message).toContain("1. IPA");
    expect(message).toContain("2. American Pale Ale (APA)");
    expect(message).toContain("3. Stout");
    expect(message.match(/^\d+\. /gm)).toHaveLength(3);
  });

  it("enumerates a mixed generic test order with variants, quantities, subtotals and total", () => {
    const message = messageFor([
      {
        id: "category=wine|product=malbec-test|presentation=malbec-test:750ml|variant=reserva",
        name: "Malbec Test - Reserva - Botella 750ml",
        price: 12000,
        qty: 2,
        category: "pack",
        productCategory: "wine",
        productId: "malbec-test",
        productName: "Malbec Test",
        presentationId: "malbec-test:750ml",
        presentationLabel: "Botella 750ml",
        variantId: "reserva",
        variantLabel: "Reserva",
      },
      {
        id: "category=mixer|product=tonic-test|presentation=tonic-test:lata",
        name: "Tonica Test - Lata",
        price: 1800,
        qty: 3,
        category: "pack",
        productCategory: "mixer",
        productId: "tonic-test",
        productName: "Tonica Test",
        presentationId: "tonic-test:lata",
        presentationLabel: "Lata",
      },
      {
        id: "category=accessory|product=cups-test|presentation=cups-test:unidad",
        name: "Vasos Test - Unidad",
        price: 500,
        qty: 10,
        category: "pack",
        productCategory: "accessory",
        productId: "cups-test",
        productName: "Vasos Test",
        presentationId: "cups-test:unidad",
        presentationLabel: "Unidad",
      },
    ]);

    expect(message).toContain("1. Malbec Test");
    expect(message).toContain("  Variante: Reserva");
    expect(message).toContain("  Presentacion: Botella 750ml");
    expect(message).toContain("  Cantidad: 2 unidades");
    expect(message).toContain("  Subtotal: $24.000");
    expect(message).toContain("2. Tonica Test");
    expect(message).toContain("  Subtotal: $5.400");
    expect(message).toContain("3. Vasos Test");
    expect(message).toContain("Total estimado: $34.400");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("null");
    expect(message).not.toContain("NaN");
    expect(message).not.toContain("[object Object]");
  });

  it("calculates total units, liters, subtotal and total without recalculating discounts twice", () => {
    const message = messageFor([item(2, "barril50L", 1), item(1, "barril20L", 2)], {
      promoCode: "PRIMERABIRRA",
      discount: 0.1,
    });

    expect(message).toContain("Unidades: 3");
    expect(message).toContain("Volumen: 90 L");
    expect(message).toContain("Subtotal: $189.000");
    expect(message).toContain("Descuento PRIMERABIRRA (10%): -$18.900");
    expect(message).toContain("Total estimado: $170.100");
    expect(message.match(/Descuento PRIMERABIRRA/g)).toHaveLength(1);
  });

  it("does not show an invalid promo code as applied", () => {
    const message = messageFor([item(2, "barril50L", 1)], {
      promoCode: "NOPE",
      discount: 0,
    });

    expect(message).not.toContain("NOPE");
    expect(message).not.toContain("Descuento");
  });

  it("reflects delivery with address only when delivery is selected", () => {
    const message = messageFor([item(0, "barril20L", 1)], { delivery: "caba" });

    expect(message).toContain("Modalidad: CABA / Zona Sur");
    expect(message).toContain("Direccion: Av. Corrientes 1234");
    expect(message).toContain("Envio: $12.000");
    expect(message).toContain("Total estimado: $50.000");
  });

  it("reflects computed extras without inventing prices", () => {
    const message = messageFor([item(0, "barril20L", 1)], {
      chopera: true,
      hielo: 2,
      vasos: 10,
    });

    expect(message).toContain("EXTRAS");
    expect(message).toContain("Alquiler de chopera: 1 unidad x $15.000 = $15.000");
    expect(message).toContain("Hielo: 2 unidades x $3.000 = $6.000");
    expect(message).toContain("Vasos: 10 unidades x $800 = $8.000");
    expect(message).toContain("Extras: $29.000");
    expect(message).toContain("Total estimado: $67.000");
  });

  it("omits empty optional fields and never prints undefined, objects or NaN", () => {
    const summary = calculateOrderSummary([item(2, "barril50L", 1)], baseExtras);
    const message = buildWhatsAppOrderMessage({
      customer: { name: "  ", eventDate: "", timeSlot: "", address: "", notes: "" },
      summary,
    });

    expect(message).not.toContain("Nombre:");
    expect(message).not.toContain("Direccion:");
    expect(message).not.toContain("Observaciones:");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("[object Object]");
    expect(message).not.toContain("NaN");
  });

  it("encodes special characters and line breaks in the WhatsApp URL", () => {
    const message = messageFor([item(2, "barril50L", 1)]);
    const url = buildWhatsAppOrderUrl("+54 9 11 3397-1210", message);
    const decoded = decodeURIComponent(url.split("text=")[1]);

    expect(url.startsWith("https://wa.me/5491133971210?text=")).toBe(true);
    expect(url).toContain("%C3%B1");
    expect(url).toContain("%0A");
    expect(decoded).toContain("porton con ñ");
    expect(decoded).toContain("$105.000");
  });

  it("rejects missing or invalid WhatsApp destinations", () => {
    expect(() => buildWhatsAppOrderUrl("", "hola")).toThrow("WhatsApp destination is missing or invalid");
    expect(() => buildWhatsAppOrderUrl("0000", "hola")).toThrow("WhatsApp destination is missing or invalid");
  });

  it("rejects an empty message", () => {
    expect(() => buildWhatsAppOrderUrl("5491133971210", "  ")).toThrow("WhatsApp message is empty");
  });

  it("does not mutate item, extras or summary arguments", () => {
    const items = [item(2, "barril50L", 1), item(1, "barril20L", 2)];
    const extras: OrderSummaryExtras = { ...baseExtras, promoCode: "PRIMERABIRRA", discount: 0.1 };
    const itemsBefore = JSON.stringify(items);
    const extrasBefore = JSON.stringify(extras);
    const summary = calculateOrderSummary(items, extras);
    const summaryBefore = JSON.stringify(summary);

    buildWhatsAppOrderMessage({ customer: { name: "Juan" }, summary });
    buildWhatsAppOrderUrl("5491133971210", "Hola");

    expect(JSON.stringify(items)).toBe(itemsBefore);
    expect(JSON.stringify(extras)).toBe(extrasBefore);
    expect(JSON.stringify(summary)).toBe(summaryBefore);
  });

  it("includes Pack Degustacion quantity, name and subtotal in summary and WhatsApp text", () => {
    const summary = calculateOrderSummary([{ ...tastingPack, productCategory: "pack", qty: 2 }], baseExtras);
    const message = buildWhatsAppOrderMessage({
      customer: { name: "Cliente" },
      summary,
    });

    expect(summary.items).toMatchObject([{ productName: tastingPack.productName, qty: 2, price: tastingPack.price }]);
    expect(message).toContain("Pack Degust");
    expect(message).toContain("Cantidad: 2 unidades");
    expect(message).toContain("Subtotal: $21.000");
    expect(message).toContain("Total estimado: $21.000");
  });

  it("summarizes configurable beer packs without leaking ids, JSON or invalid values", () => {
    const products = listPackAvailableProducts(beerCatalog);
    const line = buildConfigurablePackCartItem(
      { capacity: 6, selections: [{ productId: "blonde-ale", quantity: 3 }, { productId: "stout", quantity: 3 }] },
      products,
    );
    const summary = calculateOrderSummary([{ ...line, qty: 2 }], baseExtras);
    const message = buildWhatsAppOrderMessage({ customer: { name: "Cliente" }, summary });

    expect(message).toContain("Pack de 6 porrones");
    expect(message).toContain("Cantidad: 2 packs");
    expect(message).toContain("Composicion por pack:");
    expect(message).toContain("- Blonde Ale: 3");
    expect(message).toContain("- Stout: 3");
    expect(message).toContain("Total de porrones: 12");
    expect(message).toContain("Precio por pack: ");
    expect(message).toContain("Subtotal: ");
    expect(message).not.toContain("blonde-ale");
    expect(message).not.toContain("canonicalKey");
    expect(message).not.toContain("{");
    expect(message).not.toContain("undefined");
    expect(message).not.toContain("null");
    expect(message).not.toContain("NaN");
  });
});
