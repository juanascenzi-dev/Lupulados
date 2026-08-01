import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import {
  adminAuditLog,
  adminUsers,
  businessProfiles,
  deliveryOptions,
  extraOptions,
  insertProductSchema,
  insertPromotionSchema,
  productPresentations,
  products,
  promotions,
  whatsappChannels,
} from "./index";

describe("tablas del esquema comercial", () => {
  it("expone las columnas esperadas de cada tabla", () => {
    expect(Object.keys(getTableColumns(businessProfiles))).toEqual(
      expect.arrayContaining(["id", "businessName", "pricingStatus", "priceDisclaimer", "active"]),
    );
    expect(Object.keys(getTableColumns(whatsappChannels))).toEqual(
      expect.arrayContaining(["id", "phoneE164", "purpose", "isPrimary", "sortOrder"]),
    );
    expect(Object.keys(getTableColumns(products))).toEqual(
      expect.arrayContaining(["id", "slug", "name", "category", "status", "sortOrder"]),
    );
    expect(Object.keys(getTableColumns(productPresentations))).toEqual(
      expect.arrayContaining(["id", "productId", "presentationType", "unitPrice"]),
    );
    expect(Object.keys(getTableColumns(deliveryOptions))).toEqual(
      expect.arrayContaining(["id", "price", "requiresAddress"]),
    );
    expect(Object.keys(getTableColumns(extraOptions))).toEqual(
      expect.arrayContaining(["id", "label", "price"]),
    );
    expect(Object.keys(getTableColumns(promotions))).toEqual(
      expect.arrayContaining(["id", "code", "promotionType", "value"]),
    );
    expect(Object.keys(getTableColumns(adminUsers))).toEqual(
      expect.arrayContaining(["userId", "active", "createdBy"]),
    );
    expect(Object.keys(getTableColumns(adminAuditLog))).toEqual(
      expect.arrayContaining(["id", "tableName", "operation", "oldData", "newData"]),
    );
  });
});

describe("insertProductSchema", () => {
  it("rechaza un insert sin los campos obligatorios", () => {
    expect(insertProductSchema.safeParse({}).success).toBe(false);
  });

  it("rechaza tipos incorrectos en un campo obligatorio", () => {
    const result = insertProductSchema.safeParse({
      id: "p1",
      slug: "ipa-clasica",
      name: "IPA Clásica",
      category: 123,
    });
    expect(result.success).toBe(false);
  });

  it("acepta un insert válido dejando los campos con default sin especificar", () => {
    const result = insertProductSchema.safeParse({
      id: "p1",
      slug: "ipa-clasica",
      name: "IPA Clásica",
      category: "beer",
    });
    expect(result.success).toBe(true);
  });
});

describe("insertPromotionSchema", () => {
  it("exige code, promotionType y value", () => {
    expect(insertPromotionSchema.safeParse({ id: "promo1" }).success).toBe(false);
  });

  it("acepta un insert válido con los campos requeridos", () => {
    const result = insertPromotionSchema.safeParse({
      id: "promo1",
      code: "BIENVENIDA10",
      promotionType: "percentage",
      value: "0.1",
    });
    expect(result.success).toBe(true);
  });
});
