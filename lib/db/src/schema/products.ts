import { sql } from "drizzle-orm";
import { check, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const products = pgTable(
  "products",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    style: text("style"),
    category: text("category").$type<"beer" | "pack">().notNull(),
    imageUrl: text("image_url"),
    status: text("status").$type<"active" | "archived">().notNull().default("active"),
    sortOrder: integer("sort_order").notNull().default(0),
    abv: numeric("abv"),
    ibu: numeric("ibu"),
    badge: text("badge"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("products_category_check", sql`${t.category} in ('beer', 'pack')`),
    check("products_status_check", sql`${t.status} in ('active', 'archived')`),
    check("products_sort_order_check", sql`${t.sortOrder} >= 0`),
    check("products_abv_check", sql`${t.abv} is null or ${t.abv} > 0`),
    check("products_ibu_check", sql`${t.ibu} is null or ${t.ibu} >= 0`),
  ],
);

export const insertProductSchema = createInsertSchema(products);
export const selectProductSchema = createSelectSchema(products);
export type InsertProduct = typeof products.$inferInsert;
export type Product = typeof products.$inferSelect;
