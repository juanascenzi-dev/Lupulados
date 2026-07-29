import { describe, expect, it, vi } from "vitest";
import { commercialSnapshot } from "./commercialData";
import { getPrimaryOrderWhatsAppChannel, listActivePromotions } from "./commercialSelectors";
import {
  productFromRow,
  snapshotFromRows,
  SupabaseCommercialRepository,
  type BusinessProfileRow,
  type DeliveryRow,
  type ExtraRow,
  type PresentationRow,
  type ProductRow,
  type PromotionRow,
  type WhatsAppRow,
} from "./commercialRepository";

const profileRows: BusinessProfileRow[] = [{
  id: "lupulados-public-profile",
  business_name: "Lupulados",
  address: "Primera Junta 2614",
  opening_hours: "Atención las 24 horas, todos los días.",
  email: null,
  pricing_status: "estimated",
  price_disclaimer: "Los precios son estimativos y están sujetos a confirmación.",
  active: true,
}];

const productRows: ProductRow[] = commercialSnapshot.products.map((product) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,
  description: product.description,
  style: product.style,
  category: product.category,
  image_url: product.image,
  status: product.status,
  sort_order: product.sortOrder,
  abv: product.abv ?? null,
  ibu: product.ibu ?? null,
  badge: product.badge ?? null,
}));

const presentationRows: PresentationRow[] = commercialSnapshot.productPresentations.map((presentation) => ({
  id: presentation.id,
  product_id: presentation.productId,
  presentation_type: presentation.presentationType,
  label: presentation.label,
  volume_liters: presentation.volumeLiters,
  unit_price: presentation.unitPrice,
  status: presentation.active ? "active" : "archived",
  sort_order: presentation.sortOrder,
  category: presentation.category,
  description: presentation.description ?? null,
}));

const whatsappRows: WhatsAppRow[] = commercialSnapshot.whatsappChannels.map((channel) => ({
  id: channel.id,
  label: channel.label,
  phone_display: channel.phoneDisplay,
  phone_e164: channel.phoneE164,
  purpose: channel.purpose,
  is_primary: channel.isPrimary,
  active: channel.active,
  sort_order: channel.sortOrder,
}));

const deliveryRows: DeliveryRow[] = commercialSnapshot.deliveryOptions.map((option) => ({
  id: option.id,
  label: option.label,
  description: option.description,
  price: option.price,
  requires_address: option.requiresAddress,
  active: option.active,
  sort_order: option.sortOrder,
}));

const extraRows: ExtraRow[] = commercialSnapshot.extraOptions.map((option) => ({
  id: option.id,
  label: option.label,
  price: option.price,
  unit: option.unit,
  active: option.active,
  sort_order: option.sortOrder,
}));

const promotionRows: PromotionRow[] = commercialSnapshot.promotions.map((promotion) => ({
  id: promotion.id,
  code: promotion.code,
  promotion_type: promotion.type,
  value: promotion.value,
  active: promotion.active,
  starts_at: promotion.startDate ?? null,
  ends_at: promotion.endDate ?? null,
}));

function rows(overrides: Partial<Parameters<typeof snapshotFromRows>[0]> = {}) {
  return {
    businessProfiles: profileRows,
    whatsappChannels: whatsappRows,
    products: productRows,
    productPresentations: presentationRows,
    deliveryOptions: deliveryRows,
    extraOptions: extraRows,
    promotions: promotionRows,
    ...overrides,
  };
}

describe("Supabase commercial mappers", () => {
  it("maps Supabase rows into a valid CommercialSnapshot", () => {
    const snapshot = snapshotFromRows(rows());
    expect(snapshot.businessProfile.businessName).toBe("Lupulados");
    expect(snapshot.products).toHaveLength(commercialSnapshot.products.length);
  });

  it("sorts public rows by sort_order", () => {
    const snapshot = snapshotFromRows(rows({ products: [...productRows].reverse() }));
    expect(snapshot.products.map((product) => product.id)).toEqual(commercialSnapshot.products.map((product) => product.id));
  });

  it("excludes archived products and presentations from the public snapshot", () => {
    const snapshot = snapshotFromRows(rows({
      products: productRows.map((product) => product.id === "ipa" ? { ...product, status: "archived" } : product),
      productPresentations: presentationRows.map((presentation) => presentation.id === "apa:barril20L" ? { ...presentation, status: "archived" } : presentation),
    }));
    expect(snapshot.products.map((product) => product.id)).not.toContain("ipa");
    expect(snapshot.productPresentations.map((presentation) => presentation.id)).not.toContain("apa:barril20L");
  });

  it("rejects invalid Supabase data", () => {
    expect(() => snapshotFromRows(rows({ products: [{ ...productRows[0], slug: "" }] }))).toThrow();
  });

  it("does not mutate row inputs", () => {
    const input = rows();
    const before = JSON.stringify(input);
    snapshotFromRows(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});

describe("commercial repository mutations", () => {
  function repoForUpdate<T>(row: T) {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    return { repo, update };
  }

  it("creates product payloads with stable IDs", async () => {
    const single = vi.fn().mockResolvedValue({ data: productRows[0], error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    await repo.createProduct(commercialSnapshot.products[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ id: "blonde-ale", status: "active" }));
  });

  it("does not send ID changes when editing products", async () => {
    const { repo, update } = repoForUpdate(productRows[0]);
    await repo.updateProduct("blonde-ale", { id: "other", name: "Blonde" } as never);
    expect(update).toHaveBeenCalledWith({ name: "Blonde" });
  });

  it("updates product optional commercial fields as null when cleared", async () => {
    const { repo, update } = repoForUpdate(productRows[0]);
    await repo.updateProduct("blonde-ale", { abv: null, ibu: null, badge: null });
    expect(update).toHaveBeenCalledWith({ abv: null, ibu: null, badge: null });
  });

  it("updates presentation product, price, and nullable description", async () => {
    const { repo, update } = repoForUpdate(presentationRows[0]);
    await repo.updatePresentation("apa:barril20L", { productId: "ipa", unitPrice: 0, description: null });
    expect(update).toHaveBeenCalledWith({ product_id: "ipa", unit_price: 0, description: null });
  });

  it("updates delivery options", async () => {
    const { repo, update } = repoForUpdate(deliveryRows[0]);
    await repo.updateDeliveryOption("delivery", { label: "Retiro", description: "Retiro", price: 0, requiresAddress: false, sortOrder: 1 });
    expect(update).toHaveBeenCalledWith({ label: "Retiro", description: "Retiro", price: 0, requires_address: false, sort_order: 1 });
  });

  it("updates extra options", async () => {
    const { repo, update } = repoForUpdate(extraRows[0]);
    await repo.updateExtraOption("ice", { label: "Hielo", price: 1000, unit: "bolsa", sortOrder: 2 });
    expect(update).toHaveBeenCalledWith({ label: "Hielo", price: 1000, unit: "bolsa", sort_order: 2 });
  });

  it("updates promotions with uppercase codes and nullable dates", async () => {
    const { repo, update } = repoForUpdate(promotionRows[0]);
    await repo.updatePromotion("promo", { code: " verano ", type: "fixed", value: 1000, startDate: null, endDate: null });
    expect(update).toHaveBeenCalledWith({ code: "VERANO", promotion_type: "fixed", value: 1000, starts_at: null, ends_at: null });
  });

  it("archives and restores products using status", async () => {
    const { repo, update } = repoForUpdate(productRows[0]);
    await repo.archiveProduct("blonde-ale");
    await repo.restoreProduct("blonde-ale");
    expect(update).toHaveBeenNthCalledWith(1, { status: "archived" });
    expect(update).toHaveBeenNthCalledWith(2, { status: "active" });
  });

  it("accepts zero presentation prices but rejects negative snapshots", () => {
    expect(snapshotFromRows(rows({ productPresentations: presentationRows.map((row, index) => index === 0 ? { ...row, unit_price: 0 } : row) })).productPresentations[0].unitPrice).toBe(0);
    expect(() => snapshotFromRows(rows({ productPresentations: presentationRows.map((row, index) => index === 0 ? { ...row, unit_price: -1 } : row) }))).toThrow();
  });
});

describe("commercial public compatibility", () => {
  it("keeps real beer catalog IDs stable and adds demo IDs explicitly", () => {
    expect(commercialSnapshot.products.filter((product) => product.category === "beer" && !product.demo).map((product) => product.id)).toEqual([
      "blonde-ale", "apa", "ipa", "red-ale", "stout", "honey-wheat", "session-ipa", "scotch-ale",
    ]);
    expect(commercialSnapshot.products.filter((product) => product.demo).map((product) => product.id)).toContain("demo-combo-gin");
  });

  it("falls back to the first active order channel when primary is inactive", () => {
    const channel = getPrimaryOrderWhatsAppChannel([
      { ...commercialSnapshot.whatsappChannels[0], active: false },
      { ...commercialSnapshot.whatsappChannels[1], purpose: "orders_and_contact" },
    ]);
    expect(channel?.id).toBe("whatsapp-alternativo");
  });

  it("keeps public snapshot valid when Supabase has no primary order flag but has an active order channel", () => {
    const snapshot = snapshotFromRows(rows({
      whatsappChannels: whatsappRows.map((row) => ({
        ...row,
        purpose: "orders_and_contact",
        is_primary: false,
      })),
    }));

    expect(getPrimaryOrderWhatsAppChannel(snapshot.whatsappChannels)?.id).toBe("whatsapp-principal");
  });

  it("excludes expired promotions", () => {
    expect(listActivePromotions({
      ...commercialSnapshot,
      promotions: [{ id: "old", code: "OLD", type: "percentage", value: 0.1, active: true, endDate: "2020-01-01" }],
    })).toEqual([]);
  });

  it("keeps estimated pricing disclaimer", () => {
    expect(commercialSnapshot.businessProfile.priceDisclaimer).toBe("Los precios son estimativos y están sujetos a confirmación.");
  });
});
