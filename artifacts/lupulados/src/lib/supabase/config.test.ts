import { describe, expect, it } from "vitest";
import { parseSupabasePublicConfig } from "./config";

describe("parseSupabasePublicConfig", () => {
  it("accepts valid public Supabase variables", () => {
    expect(parseSupabasePublicConfig({
      VITE_SUPABASE_URL: "https://abc.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123",
    })).toEqual({
      configured: true,
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_123",
    });
  });

  it("reports Supabase as unconfigured without variables", () => {
    expect(parseSupabasePublicConfig({})).toEqual({ configured: false, reason: "missing_url" });
  });

  it("rejects invalid URLs", () => {
    expect(parseSupabasePublicConfig({
      VITE_SUPABASE_URL: "not-a-url",
      VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_123",
    })).toEqual({ configured: false, reason: "invalid_url" });
  });

  it("detects service role keys in public variables", () => {
    expect(parseSupabasePublicConfig({
      VITE_SUPABASE_URL: "https://abc.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "service_role.secret",
    })).toEqual({ configured: false, reason: "service_role_key" });
  });
});
