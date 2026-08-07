import { describe, expect, it, vi } from "vitest";
import { createFakeSupabaseAdminClient } from "@/test/supabaseAdminMock";
import { commercialSnapshot } from "./commercialData";
import {
  getActivePromotion,
  getPrimaryOrderWhatsAppChannel,
  listActivePromotions,
} from "./commercialSelectors";
import {
  productFromRow,
  snapshotFromRows,
  StaticCommercialRepository,
  SupabaseCommercialRepository,
  type BusinessProfileRow,
  type DeliveryRow,
  type ExtraRow,
  type PresentationRow,
  type ProductRow,
  type PromotionRow,
  type WhatsAppRow,
} from "./commercialRepository";

const profileRows: BusinessProfileRow[] = [
  {
    id: "lupulados-public-profile",
    business_name: "Lupulados",
    address: "Primera Junta 2614",
    opening_hours: "Atención las 24 horas, todos los días.",
    email: null,
    pricing_status: "estimated",
    price_disclaimer: "Los precios son estimativos y están sujetos a confirmación.",
    active: true,
  },
];

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

const presentationRows: PresentationRow[] = commercialSnapshot.productPresentations.map(
  (presentation) => ({
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
  }),
);

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
    expect(snapshot.products.map((product) => product.id)).toEqual(
      commercialSnapshot.products.map((product) => product.id),
    );
  });

  it("excludes archived products and presentations from the public snapshot", () => {
    const snapshot = snapshotFromRows(
      rows({
        products: productRows.map((product) =>
          product.id === "ipa" ? { ...product, status: "archived" } : product,
        ),
        productPresentations: presentationRows.map((presentation) =>
          presentation.id === "apa:barril20L"
            ? { ...presentation, status: "archived" }
            : presentation,
        ),
      }),
    );
    expect(snapshot.products.map((product) => product.id)).not.toContain("ipa");
    expect(snapshot.productPresentations.map((presentation) => presentation.id)).not.toContain(
      "apa:barril20L",
    );
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
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "blonde-ale", status: "active" }),
    );
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
    await repo.updatePresentation("apa:barril20L", {
      productId: "ipa",
      unitPrice: 0,
      description: null,
    });
    expect(update).toHaveBeenCalledWith({ product_id: "ipa", unit_price: 0, description: null });
  });

  it("updates delivery options", async () => {
    const { repo, update } = repoForUpdate(deliveryRows[0]);
    await repo.updateDeliveryOption("delivery", {
      label: "Retiro",
      description: "Retiro",
      price: 0,
      requiresAddress: false,
      sortOrder: 1,
    });
    expect(update).toHaveBeenCalledWith({
      label: "Retiro",
      description: "Retiro",
      price: 0,
      requires_address: false,
      sort_order: 1,
    });
  });

  it("updates extra options", async () => {
    const { repo, update } = repoForUpdate(extraRows[0]);
    await repo.updateExtraOption("ice", {
      label: "Hielo",
      price: 1000,
      unit: "bolsa",
      sortOrder: 2,
    });
    expect(update).toHaveBeenCalledWith({
      label: "Hielo",
      price: 1000,
      unit: "bolsa",
      sort_order: 2,
    });
  });

  it("updates promotions with uppercase codes and nullable dates", async () => {
    const { repo, update } = repoForUpdate(promotionRows[0]);
    await repo.updatePromotion("promo", {
      code: " verano ",
      type: "fixed",
      value: 1000,
      startDate: null,
      endDate: null,
    });
    expect(update).toHaveBeenCalledWith({
      code: "VERANO",
      promotion_type: "fixed",
      value: 1000,
      starts_at: null,
      ends_at: null,
    });
  });

  it("archives and restores products using status", async () => {
    const { repo, update } = repoForUpdate(productRows[0]);
    await repo.archiveProduct("blonde-ale");
    await repo.restoreProduct("blonde-ale");
    expect(update).toHaveBeenNthCalledWith(1, { status: "archived" });
    expect(update).toHaveBeenNthCalledWith(2, { status: "active" });
  });

  it("accepts zero presentation prices but rejects negative snapshots", () => {
    expect(
      snapshotFromRows(
        rows({
          productPresentations: presentationRows.map((row, index) =>
            index === 0 ? { ...row, unit_price: 0 } : row,
          ),
        }),
      ).productPresentations[0].unitPrice,
    ).toBe(0);
    expect(() =>
      snapshotFromRows(
        rows({
          productPresentations: presentationRows.map((row, index) =>
            index === 0 ? { ...row, unit_price: -1 } : row,
          ),
        }),
      ),
    ).toThrow();
  });
});

describe("StaticCommercialRepository", () => {
  it("returns cloned snapshot slices for every entity, matching the static seed", async () => {
    const repo = new StaticCommercialRepository();
    await expect(repo.getBusinessProfile()).resolves.toEqual(commercialSnapshot.businessProfile);
    await expect(repo.listWhatsAppChannels()).resolves.toEqual(commercialSnapshot.whatsappChannels);
    await expect(repo.listProducts()).resolves.toEqual(commercialSnapshot.products);
    await expect(repo.listProductPresentations()).resolves.toEqual(
      commercialSnapshot.productPresentations,
    );
    await expect(repo.listDeliveryOptions()).resolves.toEqual(commercialSnapshot.deliveryOptions);
    await expect(repo.listExtraOptions()).resolves.toEqual(commercialSnapshot.extraOptions);
    await expect(repo.listPromotions()).resolves.toEqual(commercialSnapshot.promotions);
  });
});

describe("SupabaseCommercialRepository reads", () => {
  it("getBusinessProfile resolves the active profile from the fake admin client", async () => {
    const client = createFakeSupabaseAdminClient();
    const repo = new SupabaseCommercialRepository(client as never);
    const profile = await repo.getBusinessProfile();
    expect(profile.businessName).toBe("Lupulados");
  });

  it("getProduct returns the mapped product when found, and null when missing", async () => {
    const client = createFakeSupabaseAdminClient({ products: [productRows[0]] });
    const repo = new SupabaseCommercialRepository(client as never);
    await expect(repo.getProduct(productRows[0].id)).resolves.toEqual(
      productFromRow(productRows[0]),
    );
    await expect(repo.getProduct("missing-id")).resolves.toBeNull();
  });

  it("getProduct throws when Supabase reports an error", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "boom" } });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    await expect(repo.getProduct("blonde-ale")).rejects.toThrow(
      "leer producto: no se pudo consultar el producto",
    );
  });
});

describe("commercial repository creates", () => {
  function repoForInsert<T>(row: T) {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const insert = vi.fn(() => ({ select }));
    const from = vi.fn(() => ({ insert }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    return { repo, insert };
  }

  it("creates a presentation and forces status active", async () => {
    const { repo, insert } = repoForInsert(presentationRows[0]);
    await repo.createPresentation(commercialSnapshot.productPresentations[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ status: "active" }));
  });

  it("creates a WhatsApp channel and forces active true", async () => {
    const { repo, insert } = repoForInsert(whatsappRows[0]);
    await repo.createWhatsAppChannel(commercialSnapshot.whatsappChannels[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
  });

  it("creates a delivery option and forces active true", async () => {
    const { repo, insert } = repoForInsert(deliveryRows[0]);
    await repo.createDeliveryOption(commercialSnapshot.deliveryOptions[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
  });

  it("creates an extra option and forces active true", async () => {
    const { repo, insert } = repoForInsert(extraRows[0]);
    await repo.createExtraOption(commercialSnapshot.extraOptions[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
  });

  it("creates a promotion and forces active true", async () => {
    const { repo, insert } = repoForInsert(promotionRows[0]);
    await repo.createPromotion(commercialSnapshot.promotions[0]);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ active: true }));
  });
});

describe("commercial repository archive/restore and remaining updates", () => {
  function repoForUpdate<T>(row: T) {
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    return { repo, update };
  }

  it("archives and restores presentations using status", async () => {
    const { repo, update } = repoForUpdate(presentationRows[0]);
    await repo.archivePresentation("apa:barril20L");
    await repo.restorePresentation("apa:barril20L");
    expect(update).toHaveBeenNthCalledWith(1, { status: "archived" });
    expect(update).toHaveBeenNthCalledWith(2, { status: "active" });
  });

  it("archives whatsapp channels and clears the primary flag", async () => {
    const { repo, update } = repoForUpdate(whatsappRows[0]);
    await repo.archiveWhatsAppChannel("whatsapp-principal");
    expect(update).toHaveBeenCalledWith({ active: false, is_primary: false });
  });

  it("updates a whatsapp channel", async () => {
    const { repo, update } = repoForUpdate(whatsappRows[0]);
    await repo.updateWhatsAppChannel("whatsapp-principal", { label: "Pedidos" });
    expect(update).toHaveBeenCalledWith({ label: "Pedidos" });
  });

  it("archives and restores delivery options using active", async () => {
    const { repo, update } = repoForUpdate(deliveryRows[0]);
    await repo.archiveDeliveryOption("delivery");
    await repo.restoreDeliveryOption("delivery");
    expect(update).toHaveBeenNthCalledWith(1, { active: false });
    expect(update).toHaveBeenNthCalledWith(2, { active: true });
  });

  it("archives and restores extra options using active", async () => {
    const { repo, update } = repoForUpdate(extraRows[0]);
    await repo.archiveExtraOption("ice");
    await repo.restoreExtraOption("ice");
    expect(update).toHaveBeenNthCalledWith(1, { active: false });
    expect(update).toHaveBeenNthCalledWith(2, { active: true });
  });

  it("archives and restores promotions using active", async () => {
    const { repo, update } = repoForUpdate(promotionRows[0]);
    await repo.archivePromotion("promo");
    await repo.restorePromotion("promo");
    expect(update).toHaveBeenNthCalledWith(1, { active: false });
    expect(update).toHaveBeenNthCalledWith(2, { active: true });
  });
});

describe("updateBusinessProfile", () => {
  it("reads the current profile to get its id, then updates that row", async () => {
    const row = profileRows[0];
    const updateSpy = vi.fn();
    const from = vi.fn((table: string) => {
      if (table !== "business_profiles") throw new Error(`unexpected table ${table}`);
      return {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [row], error: null })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => {
          updateSpy(payload);
          return {
            eq: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { ...row, business_name: "Nuevo nombre" },
                  error: null,
                }),
              })),
            })),
          };
        }),
      };
    });
    const repo = new SupabaseCommercialRepository({ from } as never);
    const updated = await repo.updateBusinessProfile({ businessName: "Nuevo nombre" });
    expect(updateSpy).toHaveBeenCalledWith({ business_name: "Nuevo nombre" });
    expect(updated.businessName).toBe("Nuevo nombre");
  });
});

describe("setPrimaryWhatsAppChannel", () => {
  it("clears the previous primary channel, then marks the new one primary and active", async () => {
    const neqSpy = vi.fn();
    const single = vi.fn().mockResolvedValue({
      data: { ...whatsappRows[0], is_primary: true },
      error: null,
    });
    const select = vi.fn(() => ({ single }));
    const eq = vi.fn(() => ({ select }));
    const update = vi.fn((payload: Record<string, unknown>) => {
      if ("is_primary" in payload && payload.is_primary === false) {
        return {
          neq: (...args: unknown[]) => {
            neqSpy(...args);
            return Promise.resolve({ error: null });
          },
        };
      }
      return { eq };
    });
    const from = vi.fn(() => ({ update }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    const result = await repo.setPrimaryWhatsAppChannel("whatsapp-alternativo");
    expect(neqSpy).toHaveBeenCalledWith("id", "whatsapp-alternativo");
    expect(update).toHaveBeenCalledWith({ is_primary: true, active: true });
    expect(result.isPrimary).toBe(true);
  });

  it("throws when clearing the previous primary channel fails", async () => {
    const update = vi.fn(() => ({
      neq: vi.fn(() => Promise.resolve({ error: { message: "boom" } })),
    }));
    const from = vi.fn(() => ({ update }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    await expect(repo.setPrimaryWhatsAppChannel("whatsapp-alternativo")).rejects.toThrow(
      "desmarcar WhatsApp principal: boom",
    );
  });
});

describe("listAuditLog", () => {
  it("maps audit log rows to camelCase", async () => {
    const auditRow = {
      id: "log-1",
      actor_user_id: "admin-1",
      table_name: "products",
      record_id: "blonde-ale",
      operation: "update",
      created_at: "2026-08-01T00:00:00.000Z",
    };
    const limit = vi.fn().mockResolvedValue({ data: [auditRow], error: null });
    const order = vi.fn(() => ({ limit }));
    const select = vi.fn(() => ({ order }));
    const from = vi.fn(() => ({ select }));
    const repo = new SupabaseCommercialRepository({ from } as never);
    await expect(repo.listAuditLog()).resolves.toEqual([
      {
        id: "log-1",
        actorUserId: "admin-1",
        tableName: "products",
        recordId: "blonde-ale",
        operation: "update",
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ]);
    expect(limit).toHaveBeenCalledWith(25);
  });
});

describe("commercial public compatibility", () => {
  it("keeps real beer catalog IDs stable and adds demo IDs explicitly", () => {
    expect(
      commercialSnapshot.products
        .filter((product) => product.category === "beer" && !product.demo)
        .map((product) => product.id),
    ).toEqual([
      "blonde-ale",
      "apa",
      "ipa",
      "red-ale",
      "stout",
      "honey-wheat",
      "session-ipa",
      "scotch-ale",
    ]);
    expect(
      commercialSnapshot.products.filter((product) => product.demo).map((product) => product.id),
    ).toContain("demo-combo-gin");
  });

  it("falls back to the first active order channel when primary is inactive", () => {
    const channel = getPrimaryOrderWhatsAppChannel([
      { ...commercialSnapshot.whatsappChannels[0], active: false },
      { ...commercialSnapshot.whatsappChannels[1], purpose: "orders_and_contact" },
    ]);
    expect(channel?.id).toBe("whatsapp-alternativo");
  });

  it("keeps public snapshot valid when Supabase has no primary order flag but has an active order channel", () => {
    const snapshot = snapshotFromRows(
      rows({
        whatsappChannels: whatsappRows.map((row) => ({
          ...row,
          purpose: "orders_and_contact",
          is_primary: false,
        })),
      }),
    );

    expect(getPrimaryOrderWhatsAppChannel(snapshot.whatsappChannels)?.id).toBe(
      "whatsapp-principal",
    );
  });

  it("excludes expired promotions", () => {
    expect(
      listActivePromotions({
        ...commercialSnapshot,
        promotions: [
          {
            id: "old",
            code: "OLD",
            type: "percentage",
            value: 0.1,
            active: true,
            endDate: "2020-01-01",
          },
        ],
      }),
    ).toEqual([]);
  });

  it("getActivePromotion returns the first active promotion, or null if there is none", () => {
    const active = {
      id: "primerabirra",
      code: "PRIMERABIRRA",
      type: "percentage" as const,
      value: 0.1,
      active: true,
    };
    expect(getActivePromotion({ ...commercialSnapshot, promotions: [active] })).toEqual(active);
    expect(getActivePromotion({ ...commercialSnapshot, promotions: [] })).toBeNull();
    expect(
      getActivePromotion({
        ...commercialSnapshot,
        promotions: [
          {
            id: "old",
            code: "OLD",
            type: "percentage",
            value: 0.1,
            active: true,
            endDate: "2020-01-01",
          },
        ],
      }),
    ).toBeNull();
  });

  it("keeps estimated pricing disclaimer", () => {
    expect(commercialSnapshot.businessProfile.priceDisclaimer).toBe(
      "Los precios son estimativos y están sujetos a confirmación.",
    );
  });
});
