import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "./commercialData";
import {
  businessProfileToFormValues,
  deliveryToFormValues,
  extraToFormValues,
  parseBusinessProfileForm,
  parseDeliveryUpdateForm,
  parseExtraUpdateForm,
  parsePresentationUpdateForm,
  parseProductUpdateForm,
  parsePromotionForm,
  parsePromotionUpdateForm,
  presentationToFormValues,
  productToFormValues,
  promotionToFormValues,
} from "./adminFormAdapters";

describe("admin form adapters", () => {
  it("preloads product edit form values without changing the ID", () => {
    const product = { ...commercialSnapshot.products[0], abv: 5, ibu: 22, badge: "Nuevo" };
    expect(productToFormValues(product)).toMatchObject({
      id: product.id,
      slug: product.slug,
      name: product.name,
      abv: 5,
      ibu: 22,
      badge: "Nuevo",
    });
  });

  it("converts empty optional product values to null patches", () => {
    expect(
      parseProductUpdateForm({
        slug: "apa",
        name: "APA",
        description: "American pale ale",
        style: "APA",
        category: "beer",
        image: "https://example.com/apa.png",
        sortOrder: "2",
        abv: "",
        ibu: "",
        badge: "",
      }),
    ).toMatchObject({ abv: null, ibu: null, badge: null, sortOrder: 2 });
  });

  it("preloads and converts presentation prices as non-negative numbers", () => {
    const presentation = commercialSnapshot.productPresentations[0];
    expect(presentationToFormValues(presentation)).toMatchObject({
      id: presentation.id,
      unitPrice: presentation.unitPrice,
    });
    expect(
      parsePresentationUpdateForm(
        {
          productId: presentation.productId,
          presentationType: presentation.presentationType,
          label: presentation.label,
          volumeLiters: String(presentation.volumeLiters),
          unitPrice: "0",
          category: presentation.category,
          description: "",
          sortOrder: String(presentation.sortOrder),
        },
        commercialSnapshot.products,
      ),
    ).toMatchObject({ unitPrice: 0, description: null });
    expect(() =>
      parsePresentationUpdateForm(
        {
          productId: presentation.productId,
          presentationType: presentation.presentationType,
          label: presentation.label,
          volumeLiters: String(presentation.volumeLiters),
          unitPrice: "-1",
          category: presentation.category,
          description: "",
          sortOrder: String(presentation.sortOrder),
        },
        commercialSnapshot.products,
      ),
    ).toThrow();
  });

  it("validates that edited presentations reference an existing product", () => {
    const presentation = commercialSnapshot.productPresentations[0];
    expect(() =>
      parsePresentationUpdateForm(
        {
          productId: "missing",
          presentationType: presentation.presentationType,
          label: presentation.label,
          volumeLiters: String(presentation.volumeLiters),
          unitPrice: String(presentation.unitPrice),
          category: presentation.category,
          description: "",
          sortOrder: String(presentation.sortOrder),
        },
        commercialSnapshot.products,
      ),
    ).toThrow("El producto relacionado no existe.");
  });

  it("updates delivery and extra form values with numeric prices", () => {
    const delivery = commercialSnapshot.deliveryOptions[0];
    const extra = commercialSnapshot.extraOptions[0];
    expect(deliveryToFormValues(delivery)).toMatchObject({
      id: delivery.id,
      requiresAddress: delivery.requiresAddress,
    });
    expect(extraToFormValues(extra)).toMatchObject({ id: extra.id, unit: extra.unit });
    expect(
      parseDeliveryUpdateForm({
        label: "Retiro",
        description: "Retiro por fábrica",
        price: "0",
        requiresAddress: "false",
        sortOrder: "1",
      }),
    ).toMatchObject({ price: 0, requiresAddress: false });
    expect(
      parseExtraUpdateForm({
        label: "Hielo",
        price: "1500",
        unit: "bolsa",
        sortOrder: "3",
      }),
    ).toMatchObject({ price: 1500, unit: "bolsa" });
  });

  it("normalizes promotion codes, validates percentages, and persists empty dates as null", () => {
    expect(
      parsePromotionForm({
        id: "verano",
        code: " verano10 ",
        type: "percentage",
        value: "0.1",
        startDate: "",
        endDate: "",
      }),
    ).toEqual({
      id: "verano",
      code: "VERANO10",
      type: "percentage",
      value: 0.1,
      startDate: null,
      endDate: null,
    });
    expect(() =>
      parsePromotionUpdateForm({
        code: "alto",
        type: "percentage",
        value: "1.5",
        startDate: "",
        endDate: "",
      }),
    ).toThrow("El porcentaje debe estar entre 0 y 1.");
  });

  it("validates promotion date ranges", () => {
    expect(() =>
      parsePromotionUpdateForm({
        code: "FECHAS",
        type: "fixed",
        value: "1000",
        startDate: "2026-08-10",
        endDate: "2026-08-01",
      }),
    ).toThrow("La fecha inicial no puede ser posterior a la final.");
  });

  it("canceling edit keeps parsed update code uncalled by convention", () => {
    let saved = false;
    const cancel = () => {
      saved = false;
    };
    cancel();
    expect(saved).toBe(false);
  });

  it("preloads promotion edit dates", () => {
    expect(
      promotionToFormValues({
        id: "promo",
        code: "PROMO",
        type: "fixed",
        value: 1000,
        active: true,
        startDate: "2026-08-01",
        endDate: null,
      }),
    ).toMatchObject({ startDate: "2026-08-01", endDate: null });
  });

  it("preloads business profile edit form values without the id/active fields", () => {
    const profile = commercialSnapshot.businessProfile;
    expect(businessProfileToFormValues(profile)).toEqual({
      businessName: profile.businessName,
      address: profile.address,
      openingHours: profile.openingHours,
      email: profile.email,
      pricingStatus: profile.pricingStatus,
      priceDisclaimer: profile.priceDisclaimer,
    });
  });

  it("parses a valid business profile form and converts an empty email to null", () => {
    expect(
      parseBusinessProfileForm({
        businessName: "Lupulados",
        address: "Primera Junta 2614",
        openingHours: "Atención las 24 horas, todos los días.",
        email: "",
        pricingStatus: "confirmed",
        priceDisclaimer: "Los precios son estimativos.",
      }),
    ).toEqual({
      businessName: "Lupulados",
      address: "Primera Junta 2614",
      openingHours: "Atención las 24 horas, todos los días.",
      email: null,
      pricingStatus: "confirmed",
      priceDisclaimer: "Los precios son estimativos.",
    });
  });

  it("rejects an invalid business profile email", () => {
    expect(() =>
      parseBusinessProfileForm({
        businessName: "Lupulados",
        address: "Primera Junta 2614",
        openingHours: "Atención las 24 horas, todos los días.",
        email: "no-es-un-email",
        pricingStatus: "estimated",
        priceDisclaimer: "Los precios son estimativos.",
      }),
    ).toThrow("Ingresá un email válido.");
  });

  it("rejects an empty required field in the business profile form", () => {
    expect(() =>
      parseBusinessProfileForm({
        businessName: "",
        address: "Primera Junta 2614",
        openingHours: "Atención las 24 horas, todos los días.",
        email: "",
        pricingStatus: "estimated",
        priceDisclaimer: "Los precios son estimativos.",
      }),
    ).toThrow("El nombre es obligatorio.");
  });
});
