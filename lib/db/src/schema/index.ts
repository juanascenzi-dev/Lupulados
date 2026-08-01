// Espeja supabase/migrations/20260725120000_commercial_admin_foundation.sql.
// Esa migración es la fuente de verdad del esquema productivo (vía `supabase db push`);
// este archivo solo le da tipos a `@workspace/db`. No correr `drizzle-kit push` contra
// la base real sin antes verificar que no genera diffs inesperados.

export * from "./businessProfiles";
export * from "./whatsappChannels";
export * from "./products";
export * from "./productPresentations";
export * from "./deliveryOptions";
export * from "./extraOptions";
export * from "./promotions";
export * from "./adminUsers";
export * from "./adminAuditLog";
