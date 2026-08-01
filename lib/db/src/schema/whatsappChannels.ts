import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const whatsappChannels = pgTable(
  "whatsapp_channels",
  {
    id: text("id").primaryKey(),
    label: text("label").notNull(),
    phoneDisplay: text("phone_display").notNull(),
    phoneE164: text("phone_e164").notNull(),
    purpose: text("purpose").$type<"orders" | "contact" | "orders_and_contact">().notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    active: boolean("active").notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("whatsapp_channels_one_active_primary")
      .on(t.isPrimary)
      .where(sql`${t.isPrimary} = true and ${t.active} = true`),
    check("whatsapp_channels_phone_check", sql`${t.phoneE164} ~ '^[1-9][0-9]{7,14}$'`),
    check(
      "whatsapp_channels_purpose_check",
      sql`${t.purpose} in ('orders', 'contact', 'orders_and_contact')`,
    ),
    check("whatsapp_channels_sort_order_check", sql`${t.sortOrder} >= 0`),
  ],
);

export const insertWhatsAppChannelSchema = createInsertSchema(whatsappChannels);
export const selectWhatsAppChannelSchema = createSelectSchema(whatsappChannels);
export type InsertWhatsAppChannel = typeof whatsappChannels.$inferInsert;
export type WhatsAppChannel = typeof whatsappChannels.$inferSelect;
