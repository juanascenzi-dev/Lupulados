import { describe, expect, it, vi } from "vitest";
import { commercialSnapshot } from "./commercialData";
import { loadAdminCommercialData, refreshAfterAdminMutation } from "./adminDataLoader";
import type { CommercialRepository } from "./commercialRepository";

function repositoryWithArchived(): CommercialRepository {
  return {
    getCommercialSnapshot: vi.fn(),
    getBusinessProfile: vi.fn(),
    listProducts: vi.fn(async () => [
      commercialSnapshot.products[0],
      { ...commercialSnapshot.products[1], status: "archived" },
    ]),
    listProductPresentations: vi.fn(async () => [
      commercialSnapshot.productPresentations[0],
      { ...commercialSnapshot.productPresentations[1], active: false },
    ]),
    listDeliveryOptions: vi.fn(async () => [
      commercialSnapshot.deliveryOptions[0],
      { ...commercialSnapshot.deliveryOptions[1], active: false },
    ]),
    listExtraOptions: vi.fn(async () => [
      commercialSnapshot.extraOptions[0],
      { ...commercialSnapshot.extraOptions[1], active: false },
    ]),
    listPromotions: vi.fn(async () => [
      commercialSnapshot.promotions[0] ?? { id: "promo", code: "PROMO", type: "fixed", value: 1000, active: true },
      { id: "old", code: "OLD", type: "fixed", value: 500, active: false },
    ]),
    listWhatsAppChannels: vi.fn(async () => [
      commercialSnapshot.whatsappChannels[0],
      { ...commercialSnapshot.whatsappChannels[1], active: false },
    ]),
  };
}

describe("admin data loader", () => {
  it("loads administrative lists including archived records", async () => {
    const data = await loadAdminCommercialData(repositoryWithArchived());
    expect(data.products.map((product) => product.status)).toContain("archived");
    expect(data.presentations.map((presentation) => presentation.active)).toContain(false);
    expect(data.deliveryOptions.map((option) => option.active)).toContain(false);
    expect(data.extraOptions.map((option) => option.active)).toContain(false);
    expect(data.promotions.map((promotion) => promotion.active)).toContain(false);
    expect(data.whatsappChannels.map((channel) => channel.active)).toContain(false);
  });

  it("refreshes admin lists and the public snapshot after mutations", async () => {
    const repository = repositoryWithArchived();
    const refreshPublic = vi.fn(async () => undefined);
    const data = await refreshAfterAdminMutation(repository, refreshPublic);
    expect(repository.listProducts).toHaveBeenCalledTimes(1);
    expect(repository.listProductPresentations).toHaveBeenCalledTimes(1);
    expect(repository.listDeliveryOptions).toHaveBeenCalledTimes(1);
    expect(repository.listExtraOptions).toHaveBeenCalledTimes(1);
    expect(repository.listPromotions).toHaveBeenCalledTimes(1);
    expect(repository.listWhatsAppChannels).toHaveBeenCalledTimes(1);
    expect(refreshPublic).toHaveBeenCalledTimes(1);
    expect(data.products).toHaveLength(2);
  });
});
