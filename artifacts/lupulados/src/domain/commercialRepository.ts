import type { SupabaseClient } from "@supabase/supabase-js";
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
  CommercialAdminRepository,
  CreateDeliveryOptionInput,
  CreateExtraOptionInput,
  CreatePresentationInput,
  CreateProductInput,
  CreatePromotionInput,
  CreateWhatsAppChannelInput,
  UpdateBusinessProfileInput,
  UpdateDeliveryOptionInput,
  UpdateExtraOptionInput,
  UpdatePresentationInput,
  UpdateProductInput,
  UpdatePromotionInput,
  UpdateWhatsAppChannelInput,
} from "./adminContracts";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  style: string | null;
  category: string;
  image_url: string | null;
  status: "active" | "archived";
  sort_order: number;
  abv: number | null;
  ibu: number | null;
  badge: string | null;
};

export type PresentationRow = {
  id: string;
  product_id: string;
  presentation_type: ProductPresentation["presentationType"];
  label: string;
  volume_liters: number | null;
  unit_price: number;
  status: "active" | "archived";
  sort_order: number;
  category: ProductPresentation["category"] | null;
  description: string | null;
};

export type BusinessProfileRow = {
  id: string;
  business_name: string;
  address: string | null;
  opening_hours: string | null;
  email: string | null;
  pricing_status: BusinessProfile["pricingStatus"];
  price_disclaimer: string;
  active: boolean;
};

export type WhatsAppRow = {
  id: string;
  label: string;
  phone_display: string;
  phone_e164: string;
  purpose: WhatsAppChannel["purpose"];
  is_primary: boolean;
  active: boolean;
  sort_order: number;
};

export type DeliveryRow = {
  id: string;
  label: string;
  description: string | null;
  price: number;
  requires_address: boolean;
  active: boolean;
  sort_order: number;
};

export type ExtraRow = {
  id: string;
  label: string;
  price: number;
  unit: string | null;
  active: boolean;
  sort_order: number;
};

export type PromotionRow = {
  id: string;
  code: string;
  promotion_type: Promotion["type"];
  value: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export type AdminAuditLogEntry = {
  id: number;
  actorUserId: string | null;
  tableName: string;
  recordId: string | null;
  operation: string;
  createdAt: string;
};

export interface CommercialRepository {
  getCommercialSnapshot(): Promise<CommercialSnapshot>;
  getBusinessProfile(): Promise<BusinessProfile>;
  listWhatsAppChannels(): Promise<WhatsAppChannel[]>;
  listProducts(): Promise<Product[]>;
  listProductPresentations(): Promise<ProductPresentation[]>;
  listDeliveryOptions(): Promise<DeliveryOption[]>;
  listExtraOptions(): Promise<ExtraOption[]>;
  listPromotions(): Promise<Promotion[]>;
}

export class StaticCommercialRepository implements CommercialRepository {
  async getCommercialSnapshot() {
    return structuredClone(commercialSnapshot);
  }

  async getBusinessProfile() {
    return structuredClone(commercialSnapshot.businessProfile);
  }

  async listWhatsAppChannels() {
    return structuredClone(commercialSnapshot.whatsappChannels);
  }

  async listProducts() {
    return structuredClone(commercialSnapshot.products);
  }

  async listProductPresentations() {
    return structuredClone(commercialSnapshot.productPresentations);
  }

  async listDeliveryOptions() {
    return structuredClone(commercialSnapshot.deliveryOptions);
  }

  async listExtraOptions() {
    return structuredClone(commercialSnapshot.extraOptions);
  }

  async listPromotions() {
    return structuredClone(commercialSnapshot.promotions);
  }
}

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
  const activeProducts = rows.products.map(productFromRow).filter((product) => product.status === "active").sort(bySortOrder);
  const activeProductIds = new Set(activeProducts.map((product) => product.id));
  const snapshot = {
    businessProfile: businessProfileFromRow(rows.businessProfiles.find((profile) => profile.active) ?? rows.businessProfiles[0]),
    whatsappChannels: rows.whatsappChannels.map(whatsappFromRow).sort(bySortOrder),
    products: activeProducts,
    productPresentations: rows.productPresentations
      .map(presentationFromRow)
      .filter((presentation) => presentation.active && activeProductIds.has(presentation.productId))
      .sort(bySortOrder),
    deliveryOptions: rows.deliveryOptions.map(deliveryFromRow).filter((option) => option.active).sort(bySortOrder),
    extraOptions: rows.extraOptions.map(extraFromRow).filter((option) => option.active).sort(bySortOrder),
    promotions: rows.promotions.map(promotionFromRow).filter((promotion) => promotion.active),
    pricingRules: commercialSnapshot.pricingRules,
  };

  return validateCommercialSnapshot(snapshot);
}

function bySortOrder<T extends { sortOrder: number }>(a: T, b: T) {
  return a.sortOrder - b.sortOrder;
}

type SupabaseResponse<T> = { data: T | null; error: { message: string } | null };

function assertData<T>(response: SupabaseResponse<T>, action: string): T {
  if (response.error) throw new Error(`${action}: ${response.error.message}`);
  if (response.data === null) throw new Error(`${action}: respuesta vacia`);
  return response.data;
}

export class SupabaseCommercialRepository implements CommercialRepository, CommercialAdminRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getCommercialSnapshot() {
    const [businessProfiles, whatsappChannels, products, productPresentations, deliveryOptions, extraOptions, promotions] =
      await Promise.all([
        this.select<BusinessProfileRow>("business_profiles", "id"),
        this.select<WhatsAppRow>("whatsapp_channels", "sort_order"),
        this.select<ProductRow>("products", "sort_order"),
        this.select<PresentationRow>("product_presentations", "sort_order"),
        this.select<DeliveryRow>("delivery_options", "sort_order"),
        this.select<ExtraRow>("extra_options", "sort_order"),
        this.select<PromotionRow>("promotions", "code"),
      ]);

    return snapshotFromRows({
      businessProfiles,
      whatsappChannels,
      products,
      productPresentations,
      deliveryOptions,
      extraOptions,
      promotions,
    });
  }

  async getBusinessProfile() {
    const rows = await this.select<BusinessProfileRow>("business_profiles", "id");
    return businessProfileFromRow(rows.find((profile) => profile.active) ?? rows[0]);
  }

  async listWhatsAppChannels() {
    return (await this.select<WhatsAppRow>("whatsapp_channels", "sort_order")).map(whatsappFromRow);
  }

  async listProducts() {
    return (await this.select<ProductRow>("products", "sort_order")).map(productFromRow);
  }

  async getProduct(id: string) {
    const response = await this.client.from("products").select("*").eq("id", id).maybeSingle();
    if (response.error) {
      throw new Error("leer producto: no se pudo consultar el producto");
    }
    return response.data ? productFromRow(response.data as ProductRow) : null;
  }

  async listProductPresentations() {
    return (await this.select<PresentationRow>("product_presentations", "sort_order")).map(presentationFromRow);
  }

  async listDeliveryOptions() {
    return (await this.select<DeliveryRow>("delivery_options", "sort_order")).map(deliveryFromRow);
  }

  async listExtraOptions() {
    return (await this.select<ExtraRow>("extra_options", "sort_order")).map(extraFromRow);
  }

  async listPromotions() {
    return (await this.select<PromotionRow>("promotions", "code")).map(promotionFromRow);
  }

  async createProduct(input: CreateProductInput) {
    return productFromRow(await this.insert<ProductRow>("products", productToRow({ ...input, status: "active" })));
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const { id: _ignored, ...payload } = input as UpdateProductInput & { id?: string };
    return productFromRow(await this.update<ProductRow>("products", id, productPatchToRow(payload)));
  }

  async archiveProduct(id: string) {
    return productFromRow(await this.update<ProductRow>("products", id, { status: "archived" }));
  }

  async restoreProduct(id: string) {
    return productFromRow(await this.update<ProductRow>("products", id, { status: "active" }));
  }

  async createPresentation(input: CreatePresentationInput) {
    return presentationFromRow(await this.insert<PresentationRow>("product_presentations", presentationToRow({ ...input, active: true })));
  }

  async updatePresentation(id: string, input: UpdatePresentationInput) {
    return presentationFromRow(await this.update<PresentationRow>("product_presentations", id, presentationPatchToRow(input)));
  }

  async archivePresentation(id: string) {
    return presentationFromRow(await this.update<PresentationRow>("product_presentations", id, { status: "archived" }));
  }

  async restorePresentation(id: string) {
    return presentationFromRow(await this.update<PresentationRow>("product_presentations", id, { status: "active" }));
  }

  async updateBusinessProfile(input: UpdateBusinessProfileInput) {
    const current = await this.getBusinessProfile();
    return businessProfileFromRow(await this.update<BusinessProfileRow>("business_profiles", current.id, businessProfilePatchToRow(input)));
  }

  async createWhatsAppChannel(input: CreateWhatsAppChannelInput) {
    return whatsappFromRow(await this.insert<WhatsAppRow>("whatsapp_channels", whatsappToRow({ ...input, active: true })));
  }

  async updateWhatsAppChannel(id: string, input: UpdateWhatsAppChannelInput) {
    return whatsappFromRow(await this.update<WhatsAppRow>("whatsapp_channels", id, whatsappPatchToRow(input)));
  }

  async archiveWhatsAppChannel(id: string) {
    return whatsappFromRow(await this.update<WhatsAppRow>("whatsapp_channels", id, { active: false, is_primary: false }));
  }

  async setPrimaryWhatsAppChannel(id: string) {
    const response = await this.client.from("whatsapp_channels").update({ is_primary: false }).neq("id", id);
    if (response.error) throw new Error(`desmarcar WhatsApp principal: ${response.error.message}`);
    return whatsappFromRow(await this.update<WhatsAppRow>("whatsapp_channels", id, { is_primary: true, active: true }));
  }

  async createDeliveryOption(input: CreateDeliveryOptionInput) {
    return deliveryFromRow(await this.insert<DeliveryRow>("delivery_options", deliveryToRow({ ...input, active: true })));
  }

  async updateDeliveryOption(id: string, input: UpdateDeliveryOptionInput) {
    return deliveryFromRow(await this.update<DeliveryRow>("delivery_options", id, deliveryPatchToRow(input)));
  }

  async archiveDeliveryOption(id: string) {
    return deliveryFromRow(await this.update<DeliveryRow>("delivery_options", id, { active: false }));
  }

  async restoreDeliveryOption(id: string) {
    return deliveryFromRow(await this.update<DeliveryRow>("delivery_options", id, { active: true }));
  }

  async createExtraOption(input: CreateExtraOptionInput) {
    return extraFromRow(await this.insert<ExtraRow>("extra_options", extraToRow({ ...input, active: true })));
  }

  async updateExtraOption(id: string, input: UpdateExtraOptionInput) {
    return extraFromRow(await this.update<ExtraRow>("extra_options", id, extraPatchToRow(input)));
  }

  async archiveExtraOption(id: string) {
    return extraFromRow(await this.update<ExtraRow>("extra_options", id, { active: false }));
  }

  async restoreExtraOption(id: string) {
    return extraFromRow(await this.update<ExtraRow>("extra_options", id, { active: true }));
  }

  async createPromotion(input: CreatePromotionInput) {
    return promotionFromRow(await this.insert<PromotionRow>("promotions", promotionToRow({ ...input, active: true })));
  }

  async updatePromotion(id: string, input: UpdatePromotionInput) {
    return promotionFromRow(await this.update<PromotionRow>("promotions", id, promotionPatchToRow(input)));
  }

  async archivePromotion(id: string) {
    return promotionFromRow(await this.update<PromotionRow>("promotions", id, { active: false }));
  }

  async restorePromotion(id: string) {
    return promotionFromRow(await this.update<PromotionRow>("promotions", id, { active: true }));
  }

  async listAuditLog(limit = 25): Promise<AdminAuditLogEntry[]> {
    const response = await this.client
      .from("admin_audit_log")
      .select("id, actor_user_id, table_name, record_id, operation, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    return assertData(response, "listar auditoria").map((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      tableName: row.table_name,
      recordId: row.record_id,
      operation: row.operation,
      createdAt: row.created_at,
    }));
  }

  private async select<T>(table: string, order: string) {
    const response = await this.client.from(table).select("*").order(order, { ascending: true });
    return assertData(response, `leer ${table}`) as T[];
  }

  private async insert<T>(table: string, payload: Record<string, unknown>) {
    const response = await this.client.from(table).insert(payload).select("*").single();
    return assertData(response, `crear ${table}`) as T;
  }

  private async update<T>(table: string, id: string, payload: Record<string, unknown>) {
    const response = await this.client.from(table).update(payload).eq("id", id).select("*").single();
    return assertData(response, `actualizar ${table}`) as T;
  }
}

function productToRow(product: Product): Record<string, unknown> {
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

function productPatchToRow(input: UpdateProductInput) {
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

function presentationToRow(input: ProductPresentation) {
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

function presentationPatchToRow(input: UpdatePresentationInput) {
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

function businessProfilePatchToRow(input: UpdateBusinessProfileInput) {
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

function whatsappToRow(input: WhatsAppChannel) {
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

function whatsappPatchToRow(input: UpdateWhatsAppChannelInput) {
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

function deliveryToRow(input: DeliveryOption) {
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

function deliveryPatchToRow(input: UpdateDeliveryOptionInput) {
  return compact({
    label: input.label,
    description: input.description,
    price: input.price,
    requires_address: input.requiresAddress,
    active: input.active,
    sort_order: input.sortOrder,
  });
}

function extraToRow(input: ExtraOption) {
  return {
    id: input.id,
    label: input.label,
    price: input.price,
    unit: input.unit,
    active: input.active,
    sort_order: input.sortOrder,
  };
}

function extraPatchToRow(input: UpdateExtraOptionInput) {
  return compact({
    label: input.label,
    price: input.price,
    unit: input.unit,
    active: input.active,
    sort_order: input.sortOrder,
  });
}

function promotionToRow(input: Promotion) {
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

function promotionPatchToRow(input: UpdatePromotionInput) {
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
