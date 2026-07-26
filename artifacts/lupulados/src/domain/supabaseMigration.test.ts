import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve(process.cwd(), "../../supabase/migrations/20260725120000_commercial_admin_foundation.sql"),
  "utf8",
);

describe("Supabase admin migration", () => {
  it("enables RLS for all Sprint 6 public tables", () => {
    for (const table of [
      "business_profiles",
      "whatsapp_channels",
      "products",
      "product_presentations",
      "delivery_options",
      "extra_options",
      "promotions",
      "admin_users",
      "admin_audit_log",
    ]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("uses is_admin for administrative write policies", () => {
    expect(migration).toContain("create or replace function public.is_admin()");
    expect(migration).toContain("security definer");
    expect(migration).toContain("with check (public.is_admin())");
  });

  it("does not define open write policies", () => {
    expect(migration).not.toContain("using (true)");
    expect(migration).not.toContain("with check (true)");
  });
});
