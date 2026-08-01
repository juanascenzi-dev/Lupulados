export type SupabasePublicConfig =
  | {
      configured: true;
      url: string;
      publishableKey: string;
    }
  | {
      configured: false;
      reason:
        | "missing_url"
        | "missing_key"
        | "invalid_url"
        | "private_supabase_key";
    };

export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

function looksLikePrivateSupabaseKey(value: string) {
  const lower = value.toLowerCase();
  return (
    lower.startsWith("sb_secret_") ||
    lower.includes("service_role") ||
    lower.includes("service-role") ||
    isLegacyServiceRoleJwt(value)
  );
}

function isLegacyServiceRoleJwt(value: string) {
  const parts = value.split(".");
  if (parts.length !== 3 || !parts[1]) return false;

  try {
    const payload = decodeBase64UrlJson(parts[1]);
    return isObject(payload) && payload.role === "service_role";
  } catch {
    return false;
  }
}

function decodeBase64UrlJson(value: string): unknown {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || typeof globalThis.atob !== "function") {
    throw new Error("Invalid JWT payload");
  }

  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(value.length / 4) * 4,
    "=",
  );
  const binary = globalThis.atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseSupabasePublicConfig(env: SupabaseEnv): SupabasePublicConfig {
  const url = env.VITE_SUPABASE_URL?.trim() ?? "";
  const publishableKey = (
    env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    env.VITE_SUPABASE_ANON_KEY?.trim() ||
    ""
  );

  if (!url) return { configured: false, reason: "missing_url" };
  if (!publishableKey) return { configured: false, reason: "missing_key" };
  if (looksLikePrivateSupabaseKey(publishableKey)) {
    return { configured: false, reason: "private_supabase_key" };
  }

  try {
    const parsed = new URL(url);
    if (
      parsed.protocol !== "https:" &&
      parsed.hostname !== "localhost" &&
      parsed.hostname !== "127.0.0.1"
    ) {
      return { configured: false, reason: "invalid_url" };
    }
  } catch {
    return { configured: false, reason: "invalid_url" };
  }

  return { configured: true, url, publishableKey };
}

export function getSupabasePublicConfig(): SupabasePublicConfig {
  return parseSupabasePublicConfig({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  });
}
