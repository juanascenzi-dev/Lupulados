import type { DeliveryOptionId, WhatsAppChannel } from "./commercialTypes";

export interface CheckoutFormData {
  name: string;
  eventDate: string;
  timeSlot: string;
  delivery: DeliveryOptionId;
  address: string;
  notes: string;
}

export interface CheckoutValidationInput {
  formData: CheckoutFormData;
  totalItems: number;
  today: string;
  deliveryRequiresAddress: boolean;
}

export function getTodayInputValue(now = new Date()) {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function validateCheckout(input: CheckoutValidationInput) {
  const errors: string[] = [];

  if (input.totalItems <= 0) errors.push("Agrega al menos un producto al carrito.");
  if (!input.formData.name.trim()) errors.push("Indica tu nombre.");
  if (!input.formData.eventDate) errors.push("Indica la fecha.");
  if (input.formData.eventDate && input.formData.eventDate < input.today) errors.push("La fecha no puede ser anterior a hoy.");
  if (input.deliveryRequiresAddress && !input.formData.address.trim()) errors.push("Indica la direccion de entrega.");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function listOrderWhatsAppChannels(channels: readonly WhatsAppChannel[]) {
  return channels
    .filter((channel) => channel.active && (channel.purpose === "orders" || channel.purpose === "orders_and_contact" || channel.purpose === "contact"))
    .sort((left, right) => Number(right.isPrimary) - Number(left.isPrimary) || left.sortOrder - right.sortOrder);
}

export function getDefaultWhatsAppChannelId(channels: readonly WhatsAppChannel[]) {
  return listOrderWhatsAppChannels(channels)[0]?.id ?? "";
}
