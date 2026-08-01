import type {
  BusinessProfile,
  ProductPresentation,
  Promotion,
  WhatsAppChannel,
} from "./commercialTypes";

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
