import type { SupabaseClient } from "@supabase/supabase-js";
import { commercialSnapshot } from "./commercialData";
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
import type {
  AdminAuditLogEntry,
  BusinessProfileRow,
  DeliveryRow,
  ExtraRow,
  PresentationRow,
  ProductRow,
  PromotionRow,
  WhatsAppRow,
} from "./commercialRepositoryRows";
import {
  businessProfileFromRow,
  businessProfilePatchToRow,
  deliveryFromRow,
  deliveryPatchToRow,
  deliveryToRow,
  extraFromRow,
  extraPatchToRow,
  extraToRow,
  presentationFromRow,
  presentationPatchToRow,
  presentationToRow,
  productFromRow,
  productPatchToRow,
  productToRow,
  promotionFromRow,
  promotionPatchToRow,
  promotionToRow,
  snapshotFromRows,
  whatsappFromRow,
  whatsappPatchToRow,
  whatsappToRow,
} from "./commercialRepositoryMappers";
import { assertData, insertRow, selectRows, updateRow } from "./supabaseRepositoryUtils";

export type {
  AdminAuditLogEntry,
  BusinessProfileRow,
  DeliveryRow,
  ExtraRow,
  PresentationRow,
  ProductRow,
  PromotionRow,
  WhatsAppRow,
} from "./commercialRepositoryRows";
export {
  businessProfileFromRow,
  deliveryFromRow,
  extraFromRow,
  presentationFromRow,
  productFromRow,
  promotionFromRow,
  snapshotFromRows,
  whatsappFromRow,
} from "./commercialRepositoryMappers";

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

export class SupabaseCommercialRepository
  implements CommercialRepository, CommercialAdminRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async getCommercialSnapshot() {
    const [
      businessProfiles,
      whatsappChannels,
      products,
      productPresentations,
      deliveryOptions,
      extraOptions,
      promotions,
    ] = await Promise.all([
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
    return (await this.select<PresentationRow>("product_presentations", "sort_order")).map(
      presentationFromRow,
    );
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
    return productFromRow(
      await this.insert<ProductRow>("products", productToRow({ ...input, status: "active" })),
    );
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const { id: _ignored, ...payload } = input as UpdateProductInput & { id?: string };
    return productFromRow(
      await this.update<ProductRow>("products", id, productPatchToRow(payload)),
    );
  }

  async archiveProduct(id: string) {
    return productFromRow(await this.update<ProductRow>("products", id, { status: "archived" }));
  }

  async restoreProduct(id: string) {
    return productFromRow(await this.update<ProductRow>("products", id, { status: "active" }));
  }

  async createPresentation(input: CreatePresentationInput) {
    return presentationFromRow(
      await this.insert<PresentationRow>(
        "product_presentations",
        presentationToRow({ ...input, active: true }),
      ),
    );
  }

  async updatePresentation(id: string, input: UpdatePresentationInput) {
    return presentationFromRow(
      await this.update<PresentationRow>(
        "product_presentations",
        id,
        presentationPatchToRow(input),
      ),
    );
  }

  async archivePresentation(id: string) {
    return presentationFromRow(
      await this.update<PresentationRow>("product_presentations", id, { status: "archived" }),
    );
  }

  async restorePresentation(id: string) {
    return presentationFromRow(
      await this.update<PresentationRow>("product_presentations", id, { status: "active" }),
    );
  }

  async updateBusinessProfile(input: UpdateBusinessProfileInput) {
    const current = await this.getBusinessProfile();
    return businessProfileFromRow(
      await this.update<BusinessProfileRow>(
        "business_profiles",
        current.id,
        businessProfilePatchToRow(input),
      ),
    );
  }

  async createWhatsAppChannel(input: CreateWhatsAppChannelInput) {
    return whatsappFromRow(
      await this.insert<WhatsAppRow>(
        "whatsapp_channels",
        whatsappToRow({ ...input, active: true }),
      ),
    );
  }

  async updateWhatsAppChannel(id: string, input: UpdateWhatsAppChannelInput) {
    return whatsappFromRow(
      await this.update<WhatsAppRow>("whatsapp_channels", id, whatsappPatchToRow(input)),
    );
  }

  async archiveWhatsAppChannel(id: string) {
    return whatsappFromRow(
      await this.update<WhatsAppRow>("whatsapp_channels", id, { active: false, is_primary: false }),
    );
  }

  async setPrimaryWhatsAppChannel(id: string) {
    const response = await this.client
      .from("whatsapp_channels")
      .update({ is_primary: false })
      .neq("id", id);
    if (response.error) throw new Error(`desmarcar WhatsApp principal: ${response.error.message}`);
    return whatsappFromRow(
      await this.update<WhatsAppRow>("whatsapp_channels", id, { is_primary: true, active: true }),
    );
  }

  async createDeliveryOption(input: CreateDeliveryOptionInput) {
    return deliveryFromRow(
      await this.insert<DeliveryRow>("delivery_options", deliveryToRow({ ...input, active: true })),
    );
  }

  async updateDeliveryOption(id: string, input: UpdateDeliveryOptionInput) {
    return deliveryFromRow(
      await this.update<DeliveryRow>("delivery_options", id, deliveryPatchToRow(input)),
    );
  }

  async archiveDeliveryOption(id: string) {
    return deliveryFromRow(
      await this.update<DeliveryRow>("delivery_options", id, { active: false }),
    );
  }

  async restoreDeliveryOption(id: string) {
    return deliveryFromRow(
      await this.update<DeliveryRow>("delivery_options", id, { active: true }),
    );
  }

  async createExtraOption(input: CreateExtraOptionInput) {
    return extraFromRow(
      await this.insert<ExtraRow>("extra_options", extraToRow({ ...input, active: true })),
    );
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
    return promotionFromRow(
      await this.insert<PromotionRow>("promotions", promotionToRow({ ...input, active: true })),
    );
  }

  async updatePromotion(id: string, input: UpdatePromotionInput) {
    return promotionFromRow(
      await this.update<PromotionRow>("promotions", id, promotionPatchToRow(input)),
    );
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

  private select<T>(table: string, order: string) {
    return selectRows<T>(this.client, table, order);
  }

  private insert<T>(table: string, payload: Record<string, unknown>) {
    return insertRow<T>(this.client, table, payload);
  }

  private update<T>(table: string, id: string, payload: Record<string, unknown>) {
    return updateRow<T>(this.client, table, id, payload);
  }
}
