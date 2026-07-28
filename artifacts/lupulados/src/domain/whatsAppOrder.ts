import { formatPrice } from "./format";
import { getPricingConfig } from "./commercialSelectors";
import type { CommercialSnapshot } from "./commercialTypes";
import type { OrderSummary } from "./orderSummary";

export interface WhatsAppOrderCustomer {
  name?: string;
  eventDate?: string;
  timeSlot?: string;
  address?: string;
  notes?: string;
}

export interface WhatsAppOrderInput {
  customer: WhatsAppOrderCustomer;
  summary: OrderSummary;
  snapshot?: CommercialSnapshot;
}

function clean(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function formatDate(value: string | undefined) {
  const cleaned = clean(value);
  if (!cleaned) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(cleaned);
  if (!match) return cleaned;
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatQuantity(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/[^\d]/g, "");
  if (!/^[1-9]\d{7,14}$/.test(digits)) {
    throw new Error("WhatsApp destination is missing or invalid");
  }
  return digits;
}

function splitItemName(name: string) {
  const [product, presentation] = name.split("—").map((part) => part.trim());
  return {
    product: product || name,
    presentation: presentation || null,
  };
}

export function buildWhatsAppOrderMessage({ customer, summary, snapshot }: WhatsAppOrderInput) {
  const lines: string[] = ["Hola, quiero consultar por este pedido de Lupulados.", ""];
  const customerLines = [
    ["Nombre", clean(customer.name)],
    ["Fecha del evento", formatDate(customer.eventDate)],
    ["Horario", clean(customer.timeSlot)],
    ["Modalidad", summary.delivery.label],
    summary.delivery.requiresAddress ? ["Direccion", clean(customer.address)] : null,
  ].filter((line): line is [string, string] => Boolean(line && line[1]));

  if (customerLines.length > 0) {
    lines.push("DATOS DEL CLIENTE");
    customerLines.forEach(([label, value]) => {
      lines.push(`${label}: ${value}`);
    });
    lines.push("");
  }

  lines.push("PEDIDO");
  summary.items.forEach((item, index) => {
    const splitName = splitItemName(item.name);
    const productName = item.productName ?? item.beerName ?? splitName.product;
    const variantLabel =
      item.productCategory === "beer" || item.productCategory === "pack"
        ? null
        : item.variantLabel && item.variantLabel !== productName
          ? item.variantLabel
          : null;
    const presentationLabel = item.presentationLabel ?? splitName.presentation;

    lines.push(`${index + 1}. ${productName}`);
    if (variantLabel) {
      lines.push(`  Variante: ${variantLabel}`);
    }
    if (presentationLabel) {
      lines.push(`  Presentacion: ${presentationLabel}`);
    }
    lines.push(`  Cantidad: ${formatQuantity(item.qty, "unidad", "unidades")}`);
    lines.push(`  Precio unitario: ${formatPrice(item.price)}`);
    lines.push(`  Subtotal: ${formatPrice(item.price * item.qty)}`);
    lines.push("");
  });

  if (summary.extraLines.length > 0) {
    lines.push("EXTRAS");
    summary.extraLines.forEach((extra) => {
      lines.push(
        `- ${extra.label}: ${formatQuantity(extra.quantity, "unidad", "unidades")} x ${formatPrice(extra.unitPrice)} = ${formatPrice(extra.total)}`,
      );
    });
    lines.push("");
  }

  lines.push("RESUMEN");
  lines.push(`Unidades: ${summary.totalItems}`);
  if (summary.totalLiters > 0) {
    lines.push(`Volumen: ${summary.totalLiters} L`);
  }
  lines.push(`Subtotal productos: ${formatPrice(summary.itemsSubtotal)}`);
  if (summary.extrasTotal > 0) {
    lines.push(`Extras: ${formatPrice(summary.extrasTotal)}`);
  }
  lines.push(`Envio: ${formatPrice(summary.deliveryCost)}`);
  lines.push(`Subtotal: ${formatPrice(summary.subtotal)}`);
  if (summary.discountAmount > 0) {
    lines.push(
      `Descuento ${summary.discountCode} (${summary.discountRate * 100}%): -${formatPrice(summary.discountAmount)}`,
    );
  }
  lines.push(`Total estimado: ${formatPrice(summary.total)}`);
  lines.push(getPricingConfig(snapshot).disclaimer);

  const notes = clean(customer.notes);
  if (notes) {
    lines.push("");
    lines.push("Observaciones:");
    lines.push(notes);
  }

  lines.push("");
  lines.push("Quedo a la espera de confirmacion de disponibilidad, precio final y coordinacion.");

  return lines.join("\n");
}

export function buildWhatsAppOrderUrl(phone: string, message: string) {
  const destination = normalizeWhatsAppPhone(phone);
  const text = message.trim();
  if (!text) {
    throw new Error("WhatsApp message is empty");
  }
  return `https://wa.me/${destination}?text=${encodeURIComponent(text)}`;
}
