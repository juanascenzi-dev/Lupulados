export type PricingStatus = "estimated" | "confirmed";
export type ProductStatus = "active" | "archived";
export type ProductCategory = "beer" | "pack";
export type PresentationType =
  | "barril20L"
  | "barril30L"
  | "barril50L"
  | "growler1L"
  | "growler2L"
  | "porron500ml";
export type DeliveryOptionId = "fabrica" | "norte" | "caba";
export type ExtraOptionId = "chopera" | "hielo" | "vasos";
export type PromotionType = "percentage" | "fixed";

export interface BusinessProfile {
  id: string;
  businessName: string;
  address: string;
  openingHours: string;
  email: string | null;
  pricingStatus: PricingStatus;
  priceDisclaimer: string;
  active: boolean;
}

export interface WhatsAppChannel {
  id: string;
  label: string;
  phoneDisplay: string;
  phoneE164: string;
  purpose: "orders" | "contact" | "orders_and_contact";
  isPrimary: boolean;
  active: boolean;
  sortOrder: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  style: string;
  category: ProductCategory;
  abv?: number;
  ibu?: number;
  badge?: string;
  image: string;
  status: ProductStatus;
  sortOrder: number;
}

export interface ProductPresentation {
  id: string;
  productId: string;
  presentationType: PresentationType;
  label: string;
  volumeLiters: number;
  unitPrice: number;
  category: "barril" | "growler" | "porrón" | "pack";
  description?: string;
  active: boolean;
  sortOrder: number;
}

export interface DeliveryOption {
  id: DeliveryOptionId;
  label: string;
  description: string;
  price: number;
  requiresAddress: boolean;
  active: boolean;
  sortOrder: number;
}

export interface ExtraOption {
  id: ExtraOptionId;
  label: string;
  price: number;
  unit: string;
  active: boolean;
  sortOrder: number;
}

export interface Promotion {
  id: string;
  code: string;
  type: PromotionType;
  value: number;
  active: boolean;
  startDate?: string;
  endDate?: string;
}

export interface CommercialSnapshot {
  businessProfile: BusinessProfile;
  whatsappChannels: WhatsAppChannel[];
  products: Product[];
  productPresentations: ProductPresentation[];
  deliveryOptions: DeliveryOption[];
  extraOptions: ExtraOption[];
  promotions: Promotion[];
  pricingRules: {
    freeGlassesThreshold: number;
  };
}
