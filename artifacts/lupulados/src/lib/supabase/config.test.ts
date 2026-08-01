import { describe, expect, it } from "vitest";
import { parseSupabasePublicConfig } from "./config";

function base64UrlEncodeJson(value: unknown) {
  const json = JSON.stringify(value);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return globalThis
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/u, "");
}

function syntheticJwt(role: "anon" | "service_role") {
  const header = base64UrlEncodeJson({ alg: "HS256", typ: "JWT" });
  const payload = base64UrlEncodeJson({
    iss: "supabase-test",
    ref: "synthetic-project",
    role,
  });
  return `${header}.${payload}.synthetic-signature`;
}

describe("parseSupabasePublicConfig", () => {
  it("accepts a valid publishable Supabase key", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      configured: true,
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("accepts a synthetic legacy anon JWT", () => {
    const anonJwt = syntheticJwt("anon");

    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_ANON_KEY: anonJwt,
      }),
    ).toEqual({
      configured: true,
      url: "https://abc.supabase.co",
      publishableKey: anonJwt,
    });
  });

  it("reports Supabase as unconfigured without variables", () => {
    expect(parseSupabasePublicConfig({})).toEqual({ configured: false, reason: "missing_url" });
  });

  it("reports Supabase as unconfigured without a public key", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
      }),
    ).toEqual({ configured: false, reason: "missing_key" });
  });

  it("rejects invalid URLs", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "not-a-url",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({ configured: false, reason: "invalid_url" });
  });

  it("accepts valid URLs", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toEqual({
      configured: true,
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("uses publishable key before legacy anon key", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        VITE_SUPABASE_ANON_KEY: syntheticJwt("anon"),
      }),
    ).toEqual({
      configured: true,
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("rejects service role keys in public variables", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "service_role.redacted",
      }),
    ).toEqual({ configured: false, reason: "private_supabase_key" });
  });

  it("rejects modern private Supabase secret keys in public variables", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_test",
      }),
    ).toEqual({ configured: false, reason: "private_supabase_key" });
  });

  it("rejects a synthetic legacy service role JWT", () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_ANON_KEY: syntheticJwt("service_role"),
      }),
    ).toEqual({ configured: false, reason: "private_supabase_key" });
  });

  it("handles malformed JWT-shaped keys without throwing", () => {
    expect(() =>
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: "https://abc.supabase.co",
        VITE_SUPABASE_ANON_KEY: "header.not-base64url!.signature",
      }),
    ).not.toThrow();
  });
});
