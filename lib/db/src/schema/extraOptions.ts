import { sql } from "drizzle-orm";
import { boolean, check, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const extraOptions = pgTable(
  "extra_options",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    price: numeric("price").notNull(),
    unit: text("unit"),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("extra_options_price_check", sql`${t.price} >= 0`),
    check("extra_options_sort_order_check", sql`${t.sortOrder} >= 0`),
  ],
);

export const insertExtraOptionSchema = createInsertSchema(extraOptions);
export const selectExtraOptionSchema = createSelectSchema(extraOptions);
export type InsertExtraOption = typeof extraOptions.$inferInsert;
export type ExtraOption = typeof extraOptions.$inferSelect;
