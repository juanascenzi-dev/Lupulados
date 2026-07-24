import { additionalCosts, getDeliveryOption, type DeliveryOptionId } from "./businessConfig";
import { getCartItemLiters } from "./beerCatalog";

export interface OrderSummaryItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
}

export interface OrderSummaryExtras {
  chopera: boolean;
  delivery: DeliveryOptionId;
  hielo: number;
  vasos: number;
  promoCode: string;
  discount: number;
}

export interface OrderExtraLine {
  id: "chopera" | "hielo" | "vasos";
  label: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface OrderSummary {
  items: OrderSummaryItem[];
  totalItems: number;
  totalLiters: number;
  itemsSubtotal: number;
  extraLines: OrderExtraLine[];
  extrasTotal: number;
  delivery: ReturnType<typeof getDeliveryOption>;
  deliveryCost: number;
  subtotal: number;
  discountCode: string;
  discountRate: number;
  discountAmount: number;
  total: number;
}

export function calculateOrderSummary(
  items: OrderSummaryItem[],
  extras: OrderSummaryExtras,
): OrderSummary {
  const safeItems = items.map((item) => ({ ...item }));
  const itemsSubtotal = safeItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItems = safeItems.reduce((acc, item) => acc + item.qty, 0);
  const totalLiters = safeItems.reduce((acc, item) => acc + getCartItemLiters(item.id) * item.qty, 0);
  const has50L = safeItems.some((item) => item.id.includes("barril50L"));

  const extraLines: OrderExtraLine[] = [];
  if (extras.chopera && !has50L) {
    extraLines.push({
      id: "chopera",
      label: "Alquiler de chopera",
      quantity: 1,
      unitPrice: additionalCosts.chopera,
      total: additionalCosts.chopera,
    });
  }
  if (extras.hielo > 0) {
    extraLines.push({
      id: "hielo",
      label: "Hielo",
      quantity: extras.hielo,
      unitPrice: additionalCosts.hielo,
      total: extras.hielo * additionalCosts.hielo,
    });
  }

  const vasosCost =
    itemsSubtotal > additionalCosts.freeGlassesThreshold ? 0 : extras.vasos * additionalCosts.vasos;
  if (extras.vasos > 0 && vasosCost > 0) {
    extraLines.push({
      id: "vasos",
      label: "Vasos",
      quantity: extras.vasos,
      unitPrice: additionalCosts.vasos,
      total: vasosCost,
    });
  }

  const delivery = getDeliveryOption(extras.delivery);
  const deliveryCost = delivery.cost;
  const extrasTotal = extraLines.reduce((acc, line) => acc + line.total, 0);
  const subtotal = itemsSubtotal + extrasTotal + deliveryCost;
  const discountCode = extras.promoCode.trim();
  const discountRate = discountCode && extras.discount > 0 ? extras.discount : 0;
  const discountAmount = subtotal * discountRate;

  return {
    items: safeItems,
    totalItems,
    totalLiters,
    itemsSubtotal,
    extraLines,
    extrasTotal,
    delivery,
    deliveryCost,
    subtotal,
    discountCode: discountRate > 0 ? discountCode : "",
    discountRate,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
