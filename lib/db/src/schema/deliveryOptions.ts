import { sql } from "drizzle-orm";
import { boolean, check, integer, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const deliveryOptions = pgTable(
  "delivery_options",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    description: text("description"),
    price: numeric("price").notNull(),
    requiresAddress: boolean("requires_address").notNull(),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("delivery_options_price_check", sql`${t.price} >= 0`),
    check("delivery_options_sort_order_check", sql`${t.sortOrder} >= 0`),
  ],
);

export const insertDeliveryOptionSchema = createInsertSchema(deliveryOptions);
export const selectDeliveryOptionSchema = createSelectSchema(deliveryOptions);
export type InsertDeliveryOption = typeof deliveryOptions.$inferInsert;
export type DeliveryOption = typeof deliveryOptions.$inferSelect;
