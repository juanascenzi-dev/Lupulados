import type { AdminCommercialData } from "@/domain/adminDataLoader";
import type { Product } from "@/domain/commercialTypes";

export type AdminTab =
  | "summary"
  | "products"
  | "presentations"
  | "business"
  | "whatsapp"
  | "delivery"
  | "extras"
  | "promotions"
  | "activity";
export type StatusFilter = "all" | "active" | "archived";

export const emptyAdminData: AdminCommercialData = {
  products: [],
  presentations: [],
  deliveryOptions: [],
  extraOptions: [],
  promotions: [],
  whatsappChannels: [],
};

export const tabs: { id: AdminTab; label: string }[] = [
  { id: "summary", label: "Resumen" },
  { id: "products", label: "Productos" },
  { id: "presentations", label: "Presentaciones" },
  { id: "business", label: "Info comercial" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "delivery", label: "Entrega" },
  { id: "extras", label: "Extras" },
  { id: "promotions", label: "Promociones" },
  { id: "activity", label: "Actividad" },
];

export function matchesProductSearch(product: Product, search: string) {
  const term = search.trim().toLowerCase();
  return (
    !term || product.name.toLowerCase().includes(term) || product.id.toLowerCase().includes(term)
  );
}

export function matchesStatus(active: boolean, filter: StatusFilter) {
  if (filter === "all") return true;
  return filter === "active" ? active : !active;
}

export function confirmArchive(label: string) {
  return window.confirm(`¿Confirmás archivar o desactivar ${label}?`);
}

export function formatArgentinaDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(new Date(value));
}
