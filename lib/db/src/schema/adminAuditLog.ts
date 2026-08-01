import { bigint, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const adminAuditLog = pgTable("admin_audit_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedByDefaultAsIdentity(),
  actorUserId: uuid("actor_user_id"),
  tableName: text("table_name").notNull(),
  recordId: text("record_id"),
  operation: text("operation").notNull(),
  oldData: jsonb("old_data"),
  newData: jsonb("new_data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog);
export const selectAdminAuditLogSchema = createSelectSchema(adminAuditLog);
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
