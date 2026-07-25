import type {
  BusinessProfile,
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "./commercialTypes";

export type CreateProductInput = Omit<Product, "id" | "status"> & { id: string };
export type UpdateProductInput = Partial<Omit<Product, "id">>;
export type CreatePresentationInput = Omit<ProductPresentation, "id" | "active"> & { id: string };
export type UpdatePresentationInput = Partial<Omit<ProductPresentation, "id" | "productId">>;
export type UpdateBusinessProfileInput = Partial<Omit<BusinessProfile, "id">>;
export type CreateWhatsAppChannelInput = Omit<WhatsAppChannel, "id" | "active"> & { id: string };
export type UpdateWhatsAppChannelInput = Partial<Omit<WhatsAppChannel, "id">>;
export type CreateDeliveryOptionInput = Omit<DeliveryOption, "active">;
export type UpdateDeliveryOptionInput = Partial<Omit<DeliveryOption, "id">>;
export type CreateExtraOptionInput = Omit<ExtraOption, "active">;
export type UpdateExtraOptionInput = Partial<Omit<ExtraOption, "id">>;
export type CreatePromotionInput = Omit<Promotion, "id" | "active"> & { id: string };
export type UpdatePromotionInput = Partial<Omit<Promotion, "id">>;

export interface ProductAdminRepository {
  listProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  createProduct(input: CreateProductInput): Promise<Product>;
  updateProduct(id: string, input: UpdateProductInput): Promise<Product>;
  archiveProduct(id: string): Promise<Product>;
  restoreProduct(id: string): Promise<Product>;
}

export interface PresentationAdminRepository {
  createPresentation(input: CreatePresentationInput): Promise<ProductPresentation>;
  updatePresentation(id: string, input: UpdatePresentationInput): Promise<ProductPresentation>;
  archivePresentation(id: string): Promise<ProductPresentation>;
  restorePresentation(id: string): Promise<ProductPresentation>;
}

export interface BusinessProfileAdminRepository {
  getBusinessProfile(): Promise<BusinessProfile>;
  updateBusinessProfile(input: UpdateBusinessProfileInput): Promise<BusinessProfile>;
}

export interface WhatsAppAdminRepository {
  listWhatsAppChannels(): Promise<WhatsAppChannel[]>;
  createWhatsAppChannel(input: CreateWhatsAppChannelInput): Promise<WhatsAppChannel>;
  updateWhatsAppChannel(id: string, input: UpdateWhatsAppChannelInput): Promise<WhatsAppChannel>;
  archiveWhatsAppChannel(id: string): Promise<WhatsAppChannel>;
  setPrimaryWhatsAppChannel(id: string): Promise<WhatsAppChannel>;
}

export interface DeliveryAdminRepository {
  listDeliveryOptions(): Promise<DeliveryOption[]>;
  createDeliveryOption(input: CreateDeliveryOptionInput): Promise<DeliveryOption>;
  updateDeliveryOption(id: string, input: UpdateDeliveryOptionInput): Promise<DeliveryOption>;
  archiveDeliveryOption(id: string): Promise<DeliveryOption>;
  restoreDeliveryOption(id: string): Promise<DeliveryOption>;
}

export interface ExtraAdminRepository {
  listExtraOptions(): Promise<ExtraOption[]>;
  createExtraOption(input: CreateExtraOptionInput): Promise<ExtraOption>;
  updateExtraOption(id: string, input: UpdateExtraOptionInput): Promise<ExtraOption>;
  archiveExtraOption(id: string): Promise<ExtraOption>;
  restoreExtraOption(id: string): Promise<ExtraOption>;
}

export interface PromotionAdminRepository {
  listPromotions(): Promise<Promotion[]>;
  createPromotion(input: CreatePromotionInput): Promise<Promotion>;
  updatePromotion(id: string, input: UpdatePromotionInput): Promise<Promotion>;
  archivePromotion(id: string): Promise<Promotion>;
  restorePromotion(id: string): Promise<Promotion>;
}

export interface CommercialAdminRepository
  extends ProductAdminRepository,
    PresentationAdminRepository,
    BusinessProfileAdminRepository,
    WhatsAppAdminRepository,
    DeliveryAdminRepository,
    ExtraAdminRepository,
    PromotionAdminRepository {}
