import { formatPrice } from "./format";
import { buildWhatsAppOrderUrl } from "./whatsAppOrder";
import {
  getBusinessProfile,
  getFreeGlassesThreshold,
  getPricingConfig,
  getPrimaryOrderWhatsAppChannelFromSnapshot,
  listActiveDeliveryOptions,
  listActiveExtraOptions,
  listActivePromotions,
  listActiveWhatsAppChannels,
} from "./commercialSelectors";
import type { DeliveryOptionId } from "./commercialTypes";

export interface PublicDeliveryOption {
  id: DeliveryOptionId;
  label: string;
  desc: string;
  cost: number;
  requiresAddress: boolean;
}

export const businessProfile = getBusinessProfile();
export const pricing = getPricingConfig();
export const priceDisclaimer = pricing.disclaimer;
export const whatsappChannels = listActiveWhatsAppChannels();
export const primaryOrderWhatsAppChannel = getPrimaryOrderWhatsAppChannelFromSnapshot();
export const whatsappNumber = primaryOrderWhatsAppChannel?.phoneE164 ?? "";
export const whatsappDisplayLabel = primaryOrderWhatsAppChannel
  ? `${primaryOrderWhatsAppChannel.label}: ${primaryOrderWhatsAppChannel.phoneDisplay}`
  : "WhatsApp no disponible";
export const publicContactEmail: string | null = businessProfile.email;

export const businessLocation = {
  factoryLabel: "Retiro en fábrica",
  locality: businessProfile.address,
  address: businessProfile.address,
  openingHours: businessProfile.openingHours,
};

export const deliveryOptions = listActiveDeliveryOptions().map((option) => ({
  id: option.id,
  label: option.label,
  desc: option.price > 0 ? `+${formatPrice(option.price)}` : "Gratis",
  cost: option.price,
  requiresAddress: option.requiresAddress,
})) satisfies PublicDeliveryOption[];

const extrasById = Object.fromEntries(listActiveExtraOptions().map((extra) => [extra.id, extra]));

export const additionalCosts = {
  chopera: extrasById.chopera?.price ?? 0,
  hielo: extrasById.hielo?.price ?? 0,
  vasos: extrasById.vasos?.price ?? 0,
  freeGlassesThreshold: getFreeGlassesThreshold(),
};

const activePromotion = listActivePromotions()[0];
export const promotionConfig = {
  code: activePromotion?.code ?? "",
  discountRate: activePromotion?.type === "percentage" ? activePromotion.value : 0,
  bannerClosedStorageKey: "promoBannerClosed",
};

export function getDeliveryOption(id: DeliveryOptionId): PublicDeliveryOption {
  return deliveryOptions.find((option) => option.id === id) ?? deliveryOptions[0];
}

export function buildWhatsAppUrl(message: string, phone = whatsappNumber) {
  return buildWhatsAppOrderUrl(phone, message);
}

export function formatDeliveryForMessage(id: DeliveryOptionId) {
  const option = getDeliveryOption(id);
  return option.cost > 0 ? `${option.label} (${formatPrice(option.cost)})` : `${option.label} (Gratis)`;
}
