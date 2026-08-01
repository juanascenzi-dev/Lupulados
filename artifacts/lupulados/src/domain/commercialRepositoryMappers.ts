import { commercialSnapshot } from "./commercialData";
import { validateCommercialSnapshot } from "./commercialSchemas";
import type {
  BusinessProfile,
  CommercialSnapshot,
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "./commercialTypes";
import type {
  UpdateBusinessProfileInput,
  UpdateDeliveryOptionInput,
  UpdateExtraOptionInput,
  UpdatePresentationInput,
  UpdateProductInput,
  UpdatePromotionInput,
  UpdateWhatsAppChannelInput,
} from "./adminContracts";
import type {
  BusinessProfileRow,
  DeliveryRow,
  ExtraRow,
  PresentationRow,
  ProductRow,
  PromotionRow,
  WhatsAppRow,
} from "./commercialRepositoryRows";

export function productFromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    style: row.style ?? undefined,
    category: row.category as Product["category"],
    image: row.image_url ?? "",
    status: row.status,
    sortOrder: row.sort_order,
    abv: row.abv ?? undefined,
    ibu: row.ibu ?? undefined,
    badge: row.badge ?? undefined,
  };
}

export function presentationFromRow(row: PresentationRow): ProductPresentation {
  return {
    id: row.id,
    productId: row.product_id,
    presentationType: row.presentation_type,
    label: row.label,
    volumeLiters: row.volume_liters ?? 0,
    unitPrice: row.unit_price,
    category: row.category ?? "barril",
    description: row.description ?? undefined,
    active: row.status === "active",
    sortOrder: row.sort_order,
  };
}

export function businessProfileFromRow(row: BusinessProfileRow): BusinessProfile {
  return {
    id: row.id,
    businessName: row.business_name,
    address: row.address ?? "",
    openingHours: row.opening_hours ?? "",
    email: row.email,
    pricingStatus: row.pricing_status,
    priceDisclaimer: row.price_disclaimer,
    active: row.active,
  };
}

export function whatsappFromRow(row: WhatsAppRow): WhatsAppChannel {
  return {
    id: row.id,
    label: row.label,
    phoneDisplay: row.phone_display,
    phoneE164: row.phone_e164,
    purpose: row.purpose,
    isPrimary: row.is_primary,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export function deliveryFromRow(row: DeliveryRow): DeliveryOption {
  return {
    id: row.id,
    label: row.label,
    description: row.description ?? row.label,
    price: row.price,
    requiresAddress: row.requires_address,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export function extraFromRow(row: ExtraRow): ExtraOption {
  return {
    id: row.id,
    label: row.label,
    price: row.price,
    unit: row.unit ?? "unidad",
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export function promotionFromRow(row: PromotionRow): Promotion {
  return {
    id: row.id,
    code: row.code,
    type: row.promotion_type,
    value: row.value,
    active: row.active,
    startDate: row.starts_at?.slice(0, 10),
    endDate: row.ends_at?.slice(0, 10),
  };
}

export function snapshotFromRows(rows: {
  businessProfiles: BusinessProfileRow[];
  whatsappChannels: WhatsAppRow[];
  products: ProductRow[];
  productPresentations: PresentationRow[];
  deliveryOptions: DeliveryRow[];
  extraOptions: ExtraRow[];
  promotions: PromotionRow[];
}): CommercialSnapshot {
  const activeProducts = rows.products
    .map(productFromRow)
    .filter((product) => product.status === "active")
    .sort(bySortOrder);
  const activeProductIds = new Set(activeProducts.map((product) => product.id));
  const snapshot = {
    businessProfile: businessProfileFromRow(
      rows.businessProfiles.find((profile) => profile.active) ?? rows.businessProfiles[0],
    ),
    whatsappChannels: rows.whatsappChannels.map(whatsappFromRow).sort(bySortOrder),
    products: activeProducts,
    productPresentations: rows.productPresentations
      .map(presentationFromRow)
      .filter((presentation) => presentation.active && activeProductIds.has(presentation.productId))
      .sort(bySortOrder),
    deliveryOptions: rows.deliveryOptions
      .map(deliveryFromRow)
      .filter((option) => option.active)
      .sort(bySortOrder),
    extraOptions: rows.extraOptions
      .map(extraFromRow)
      .filter((option) => option.active)
      .sort(bySortOrder),
    promotions: rows.promotions.map(promotionFromRow).filter((promotion) => promotion.active),
    pricingRules: commercialSnapshot.pricingRules,
  };

  return validateCommercialSnapshot(snapshot);
}

export function bySortOrder<T extends { sortOrder: number }>(a: T, b: T) {
  return a.sortOrder - b.sortOrder;
}

export function productToRow(product: Product): Record<string, unknown> {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    style: product.style ?? null,
    category: product.category,
    image_url: product.image,
    status: product.status,
    sort_order: product.sortOrder,
    abv: product.abv ?? null,
    ibu: product.ibu ?? null,
    badge: product.badge ?? null,
  };
}

export function productPatchToRow(input: UpdateProductInput) {
  return compact({
    slug: input.slug,
    name: input.name,
    description: input.description,
    style: input.style,
    category: input.category,
    image_url: input.image,
    status: input.status,
    sort_order: input.sortOrder,
    abv: input.abv,
    ibu: input.ibu,
    badge: input.badge,
  });
}

export function presentationToRow(input: ProductPresentation) {
  return {
    id: input.id,
    product_id: input.productId,
    presentation_type: input.presentationType,
    label: input.label,
    volume_liters: input.volumeLiters,
    unit_price: input.unitPrice,
    status: input.active ? "active" : "archived",
    sort_order: input.sortOrder,
    category: input.category,
    description: input.description ?? null,
  };
}

export function presentationPatchToRow(input: UpdatePresentationInput) {
  return compact({
    product_id: input.productId,
    presentation_type: input.presentationType,
    label: input.label,
    volume_liters: input.volumeLiters,
    unit_price: input.unitPrice,
    status: input.active === undefined ? undefined : input.active ? "active" : "archived",
    sort_order: input.sortOrder,
    category: input.category,
    description: input.description,
  });
}

export function businessProfilePatchToRow(input: UpdateBusinessProfileInput) {
  return compact({
    business_name: input.businessName,
    address: input.address,
    opening_hours: input.openingHours,
    email: input.email,
    pricing_status: input.pricingStatus,
    price_disclaimer: input.priceDisclaimer,
    active: input.active,
  });
}

export function whatsappToRow(input: WhatsAppChannel) {
  return {
    id: input.id,
    label: input.label,
    phone_display: input.phoneDisplay,
    phone_e164: input.phoneE164,
    purpose: input.purpose,
    is_primary: input.isPrimary,
    active: input.active,
    sort_order: input.sortOrder,
  };
}

export function whatsappPatchToRow(input: UpdateWhatsAppChannelInput) {
  return compact({
    label: input.label,
    phone_display: input.phoneDisplay,
    phone_e164: input.phoneE164,
    purpose: input.purpose,
    is_primary: input.isPrimary,
    active: input.active,
    sort_order: input.sortOrder,
  });
}

export function deliveryToRow(input: DeliveryOption) {
  return {
    id: input.id,
    label: input.label,
    description: input.description,
    price: input.price,
    requires_address: input.requiresAddress,
    active: input.active,
    sort_order: input.sortOrder,
  };
}

export function deliveryPatchToRow(input: UpdateDeliveryOptionInput) {
  return compact({
    label: input.label,
    description: input.description,
    price: input.price,
    requires_address: input.requiresAddress,
    active: input.active,
    sort_order: input.sortOrder,
  });
}

export function extraToRow(input: ExtraOption) {
  return {
    id: input.id,
    label: input.label,
    price: input.price,
    unit: input.unit,
    active: input.active,
    sort_order: input.sortOrder,
  };
}

export function extraPatchToRow(input: UpdateExtraOptionInput) {
  return compact({
    label: input.label,
    price: input.price,
    unit: input.unit,
    active: input.active,
    sort_order: input.sortOrder,
  });
}

export function promotionToRow(input: Promotion) {
  return {
    id: input.id,
    code: input.code.trim().toUpperCase(),
    promotion_type: input.type,
    value: input.value,
    active: input.active,
    starts_at: input.startDate ?? null,
    ends_at: input.endDate ?? null,
  };
}

export function promotionPatchToRow(input: UpdatePromotionInput) {
  return compact({
    code: input.code?.trim().toUpperCase(),
    promotion_type: input.type,
    value: input.value,
    active: input.active,
    starts_at: input.startDate,
    ends_at: input.endDate,
  });
}

export function compact(input: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
