import type { CommercialRepository } from "./commercialRepository";
import type { DeliveryOption, ExtraOption, Product, ProductPresentation, Promotion, WhatsAppChannel } from "./commercialTypes";

export type AdminCommercialData = {
  products: Product[];
  presentations: ProductPresentation[];
  deliveryOptions: DeliveryOption[];
  extraOptions: ExtraOption[];
  promotions: Promotion[];
  whatsappChannels: WhatsAppChannel[];
};

export async function loadAdminCommercialData(repository: CommercialRepository): Promise<AdminCommercialData> {
  const [products, presentations, deliveryOptions, extraOptions, promotions, whatsappChannels] = await Promise.all([
    repository.listProducts(),
    repository.listProductPresentations(),
    repository.listDeliveryOptions(),
    repository.listExtraOptions(),
    repository.listPromotions(),
    repository.listWhatsAppChannels(),
  ]);

  return { products, presentations, deliveryOptions, extraOptions, promotions, whatsappChannels };
}

export async function refreshAfterAdminMutation(
  repository: CommercialRepository,
  refreshPublicSnapshot: () => Promise<void>,
) {
  const adminData = await loadAdminCommercialData(repository);
  await refreshPublicSnapshot();
  return adminData;
}
