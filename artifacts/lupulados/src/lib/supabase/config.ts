export type SupabasePublicConfig =
  | {
      configured: true;
      url: string;
      publishableKey: string;
    }
  | {
      configured: false;
      reason: "missing_url" | "missing_key" | "invalid_url" | "service_role_key";
    };

export interface SupabaseEnv {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
}

function looksLikeServiceRoleKey(value: string) {
  const lower = value.toLowerCase();
  return lower.includes("service_role") || lower.includes("service-role");
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
  if (looksLikeServiceRoleKey(publishableKey)) {
    return { configured: false, reason: "service_role_key" };
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
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
