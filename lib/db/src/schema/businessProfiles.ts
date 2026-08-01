import { sql } from "drizzle-orm";
import { boolean, check, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const businessProfiles = pgTable(
  "business_profiles",
  {
    id: text("id").primaryKey(),
    businessName: text("business_name").notNull(),
    address: text("address"),
    openingHours: text("opening_hours"),
    email: text("email"),
    pricingStatus: text("pricing_status")
      .$type<"estimated" | "confirmed">()
      .notNull()
      .default("estimated"),
    priceDisclaimer: text("price_disclaimer").notNull(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "business_profiles_pricing_status_check",
      sql`${t.pricingStatus} in ('estimated', 'confirmed')`,
    ),
    check(
      "business_profiles_disclaimer_check",
      sql`${t.pricingStatus} <> 'estimated' or length(btrim(${t.priceDisclaimer})) > 0`,
    ),
  ],
);

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles);
export const selectBusinessProfileSchema = createSelectSchema(businessProfiles);
export type InsertBusinessProfile = typeof businessProfiles.$inferInsert;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
