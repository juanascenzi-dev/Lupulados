import { commercialSnapshot } from "./commercialData";
import type {
  CommercialSnapshot,
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "./commercialTypes";

export function getBusinessProfile(snapshot: CommercialSnapshot = commercialSnapshot) {
  return { ...snapshot.businessProfile };
}

export function getPricingConfig(snapshot: CommercialSnapshot = commercialSnapshot) {
  const profile = snapshot.businessProfile;
  return {
    status: profile.pricingStatus,
    disclaimer: profile.priceDisclaimer,
  };
}

export function listActiveWhatsAppChannels(snapshot: CommercialSnapshot = commercialSnapshot) {
  return sorted(snapshot.whatsappChannels.filter((channel) => channel.active)).map(copyWhatsAppChannel);
}

export function getPrimaryOrderWhatsAppChannel(channels: readonly WhatsAppChannel[]) {
  const validOrderChannels = channels
    .filter((channel) => channel.active && isValidWhatsAppPhone(channel.phoneE164) && acceptsOrders(channel))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return validOrderChannels.find((channel) => channel.isPrimary) ?? validOrderChannels[0] ?? null;
}

export function getPrimaryOrderWhatsAppChannelFromSnapshot(snapshot: CommercialSnapshot = commercialSnapshot) {
  const channel = getPrimaryOrderWhatsAppChannel(snapshot.whatsappChannels);
  return channel ? copyWhatsAppChannel(channel) : null;
}

export function listActiveProducts(snapshot: CommercialSnapshot = commercialSnapshot) {
  return sorted(snapshot.products.filter((product) => product.status === "active")).map(copyProduct);
}

export function listActiveProductPresentations(productId: string, snapshot: CommercialSnapshot = commercialSnapshot) {
  const activeProductIds = new Set(listActiveProducts(snapshot).map((product) => product.id));
  if (!activeProductIds.has(productId)) return [];

  return sorted(
    snapshot.productPresentations.filter((presentation) => presentation.productId === productId && presentation.active),
  ).map(copyPresentation);
}

export function listActiveDeliveryOptions(snapshot: CommercialSnapshot = commercialSnapshot) {
  return sorted(snapshot.deliveryOptions.filter((option) => option.active)).map(copyDeliveryOption);
}

export function listActiveExtraOptions(snapshot: CommercialSnapshot = commercialSnapshot) {
  return sorted(snapshot.extraOptions.filter((option) => option.active)).map(copyExtraOption);
}

export function listActivePromotions(snapshot: CommercialSnapshot = commercialSnapshot) {
  return snapshot.promotions.filter((promotion) => promotion.active).map(copyPromotion);
}

export function getFreeGlassesThreshold(snapshot: CommercialSnapshot = commercialSnapshot) {
  return snapshot.pricingRules.freeGlassesThreshold;
}

export function isValidWhatsAppPhone(phone: string) {
  return /^54911\d{8}$/.test(phone);
}

function acceptsOrders(channel: WhatsAppChannel) {
  return channel.purpose === "orders" || channel.purpose === "orders_and_contact";
}

function sorted<T extends { sortOrder: number }>(items: readonly T[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function copyWhatsAppChannel(channel: WhatsAppChannel): WhatsAppChannel {
  return { ...channel };
}

function copyProduct(product: Product): Product {
  return { ...product };
}

function copyPresentation(presentation: ProductPresentation): ProductPresentation {
  return { ...presentation };
}

function copyDeliveryOption(option: DeliveryOption): DeliveryOption {
  return { ...option };
}

function copyExtraOption(option: ExtraOption): ExtraOption {
  return { ...option };
}

function copyPromotion(promotion: Promotion): Promotion {
  return { ...promotion };
}
