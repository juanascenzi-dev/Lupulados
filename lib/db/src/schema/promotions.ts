import { sql } from "drizzle-orm";
import { boolean, check, numeric, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const promotions = pgTable(
  "promotions",
  {
    id: text("id").primaryKey(),
    code: text("code").notNull().unique(),
    promotionType: text("promotion_type").$type<"percentage" | "fixed">().notNull(),
    value: numeric("value").notNull(),
    active: boolean("active").notNull().default(true),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check("promotions_type_check", sql`${t.promotionType} in ('percentage', 'fixed')`),
    check("promotions_value_check", sql`${t.value} >= 0`),
    check(
      "promotions_percentage_check",
      sql`${t.promotionType} <> 'percentage' or ${t.value} <= 1`,
    ),
    check(
      "promotions_dates_check",
      sql`${t.startsAt} is null or ${t.endsAt} is null or ${t.startsAt} <= ${t.endsAt}`,
    ),
    check("promotions_code_check", sql`length(btrim(${t.code})) > 0`),
  ],
);

export const insertPromotionSchema = createInsertSchema(promotions);
export const selectPromotionSchema = createSelectSchema(promotions);
export type InsertPromotion = typeof promotions.$inferInsert;
export type Promotion = typeof promotions.$inferSelect;
