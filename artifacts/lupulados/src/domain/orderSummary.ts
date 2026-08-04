import { getDeliveryOption } from "./businessConfig";
import {
  buildBusinessConfig,
  getCartItemLitersFromSnapshot,
  getDeliveryOptionFromSnapshot,
} from "./commercialAdapters";
import { commercialSnapshot } from "./commercialData";
import { calculateDiscountAmount } from "./promotionDiscount";
import type { CommercialSnapshot, DeliveryOptionId, PromotionType } from "./commercialTypes";
import type { PackLineMetadata } from "./configurableBeerPack";

export interface OrderSummaryItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category: string;
  productCategory?: string;
  productId?: string;
  productName?: string;
  beerId?: string;
  beerName?: string;
  presentationId?: string;
  presentationLabel?: string;
  presentationType?: string;
  presentationCategory?: string;
  variantId?: string;
  variantLabel?: string;
  promotional?: boolean;
  promotionLabel?: string;
  pack?: PackLineMetadata;
}

export interface OrderSummaryExtras {
  chopera: boolean;
  delivery: DeliveryOptionId;
  hielo: number;
  vasos: number;
  promoCode: string;
  /** Fracción (0-1) si discountType es "percentage", monto en pesos si es "fixed". */
  discount: number;
  /** Opcional para no romper a los consumidores existentes; default "percentage". */
  discountType?: PromotionType;
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
  delivery: NonNullable<ReturnType<typeof getDeliveryOptionFromSnapshot>>;
  deliveryCost: number;
  subtotal: number;
  discountCode: string;
  discountType: PromotionType;
  discountValue: number;
  discountAmount: number;
  total: number;
}

export function calculateOrderSummary(
  items: OrderSummaryItem[],
  extras: OrderSummaryExtras,
  snapshot: CommercialSnapshot = commercialSnapshot,
): OrderSummary {
  const dynamicConfig = buildBusinessConfig(snapshot);
  const safeItems = items.map((item) => ({ ...item }));
  const itemsSubtotal = safeItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItems = safeItems.reduce((acc, item) => acc + item.qty, 0);
  const totalLiters = safeItems.reduce((acc, item) => {
    if (item.pack?.type === "configurable-beer-pack")
      return acc + item.pack.capacity * 0.5 * item.qty;
    return acc + getCartItemLitersFromSnapshot(item.presentationId ?? item.id, snapshot) * item.qty;
  }, 0);
  const has50L = safeItems.some((item) =>
    (item.presentationType ?? item.presentationId ?? item.id).includes("barril50L"),
  );

  const extraLines: OrderExtraLine[] = [];
  if (extras.chopera && !has50L) {
    extraLines.push({
      id: "chopera",
      label: "Alquiler de chopera",
      quantity: 1,
      unitPrice: dynamicConfig.additionalCosts.chopera,
      total: dynamicConfig.additionalCosts.chopera,
    });
  }
  if (extras.hielo > 0) {
    extraLines.push({
      id: "hielo",
      label: "Hielo",
      quantity: extras.hielo,
      unitPrice: dynamicConfig.additionalCosts.hielo,
      total: extras.hielo * dynamicConfig.additionalCosts.hielo,
    });
  }

  const vasosCost =
    itemsSubtotal > dynamicConfig.additionalCosts.freeGlassesThreshold
      ? 0
      : extras.vasos * dynamicConfig.additionalCosts.vasos;
  if (extras.vasos > 0 && vasosCost > 0) {
    extraLines.push({
      id: "vasos",
      label: "Vasos",
      quantity: extras.vasos,
      unitPrice: dynamicConfig.additionalCosts.vasos,
      total: vasosCost,
    });
  }

  const delivery =
    getDeliveryOptionFromSnapshot(extras.delivery, snapshot) ?? getDeliveryOption(extras.delivery);
  const deliveryCost = delivery.cost;
  const extrasTotal = extraLines.reduce((acc, line) => acc + line.total, 0);
  const subtotal = itemsSubtotal + extrasTotal + deliveryCost;
  const discountCode = extras.promoCode.trim();
  const discountType: PromotionType = extras.discountType ?? "percentage";
  const discountValue = discountCode && extras.discount > 0 ? extras.discount : 0;
  const discountAmount = calculateDiscountAmount(subtotal, {
    type: discountType,
    value: discountValue,
  });

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
    discountCode: discountValue > 0 ? discountCode : "",
    discountType,
    discountValue,
    discountAmount,
    total: subtotal - discountAmount,
  };
}
