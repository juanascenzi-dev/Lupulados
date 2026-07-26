import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig, type SupabasePublicConfig } from "./config";

let client: SupabaseClient | null | undefined;

export function getSupabaseClient(): SupabaseClient | null {
  if (client !== undefined) return client;

  const config = getSupabasePublicConfig();
  if (!config.configured) {
    client = null;
    return client;
  }

  client = createSupabaseClient(config);
  return client;
}

export function createSupabaseClient(config: Extract<SupabasePublicConfig, { configured: true }>) {
  return createClient(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}
