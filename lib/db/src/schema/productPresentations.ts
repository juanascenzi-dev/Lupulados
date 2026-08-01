import { sql } from "drizzle-orm";
import { check, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { products } from "./products";

export const productPresentations = pgTable(
  "product_presentations",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id),
    presentationType: text("presentation_type")
      .$type<"barril20L" | "barril30L" | "barril50L" | "growler1L" | "growler2L" | "porron500ml">()
      .notNull(),
    label: text("label").notNull(),
    volumeLiters: numeric("volume_liters"),
    unitPrice: numeric("unit_price").notNull(),
    status: text("status").$type<"active" | "archived">().notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    category: text("category").$type<"barril" | "growler" | "porrón" | "pack">(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "product_presentations_type_check",
      sql`${t.presentationType} in ('barril20L', 'barril30L', 'barril50L', 'growler1L', 'growler2L', 'porron500ml')`,
    ),
    check("product_presentations_status_check", sql`${t.status} in ('active', 'archived')`),
    check(
      "product_presentations_category_check",
      sql`${t.category} is null or ${t.category} in ('barril', 'growler', 'porrón', 'pack')`,
    ),
    check(
      "product_presentations_volume_check",
      sql`${t.volumeLiters} is null or ${t.volumeLiters} > 0`,
    ),
    check("product_presentations_price_check", sql`${t.unitPrice} >= 0`),
    check("product_presentations_sort_order_check", sql`${t.sortOrder} >= 0`),
  ],
);

export const insertProductPresentationSchema = createInsertSchema(productPresentations);
export const selectProductPresentationSchema = createSelectSchema(productPresentations);
export type InsertProductPresentation = typeof productPresentations.$inferInsert;
export type ProductPresentation = typeof productPresentations.$inferSelect;
