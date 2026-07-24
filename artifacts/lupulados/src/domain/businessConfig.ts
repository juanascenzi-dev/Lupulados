import { formatPrice } from "./format";
import { buildWhatsAppOrderUrl } from "./whatsAppOrder";

export const whatsappNumber = "5491133971210";
export const whatsappDisplayLabel = "Abrir consulta por WhatsApp";
export const publicContactEmail: string | null = null;

export const businessLocation = {
  factoryLabel: "Retiro en fábrica",
  locality: "Dirección exacta a confirmar al coordinar el pedido",
};

const deliveryCosts = {
  fabrica: 0,
  norte: 8000,
  caba: 12000,
} as const;

export const deliveryOptions = [
  { id: "fabrica", label: "Retiro en fábrica", desc: "Coordinamos punto y horario — Gratis", cost: deliveryCosts.fabrica },
  { id: "norte", label: "Zona Norte GBA", desc: `+${formatPrice(deliveryCosts.norte)}`, cost: deliveryCosts.norte },
  { id: "caba", label: "CABA / Zona Sur", desc: `+${formatPrice(deliveryCosts.caba)}`, cost: deliveryCosts.caba },
] as const;

export type DeliveryOptionId = (typeof deliveryOptions)[number]["id"];

export const additionalCosts = {
  chopera: 15000,
  hielo: 3000,
  vasos: 800,
  freeGlassesThreshold: 80000,
};

// El código sigue hardcodeado hasta que exista una fuente comercial editable.
export const promotionConfig = {
  code: "PRIMERABIRRA",
  discountRate: 0.1,
  bannerClosedStorageKey: "promoBannerClosed",
};

export function getDeliveryOption(id: DeliveryOptionId) {
  return deliveryOptions.find((option) => option.id === id) ?? deliveryOptions[0];
}

export function buildWhatsAppUrl(message: string) {
  return buildWhatsAppOrderUrl(whatsappNumber, message);
}

export function formatDeliveryForMessage(id: DeliveryOptionId) {
  const option = getDeliveryOption(id);
  return option.cost > 0 ? `${option.label} (${formatPrice(option.cost)})` : `${option.label} (Gratis)`;
}
