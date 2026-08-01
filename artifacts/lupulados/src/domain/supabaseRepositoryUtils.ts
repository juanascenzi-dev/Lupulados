import type { SupabaseClient } from "@supabase/supabase-js";

export type SupabaseResponse<T> = { data: T | null; error: { message: string } | null };

export function assertData<T>(response: SupabaseResponse<T>, action: string): T {
  if (response.error) throw new Error(`${action}: ${response.error.message}`);
  if (response.data === null) throw new Error(`${action}: respuesta vacia`);
  return response.data;
}

export async function selectRows<T>(
  client: SupabaseClient,
  table: string,
  order: string,
): Promise<T[]> {
  const response = await client.from(table).select("*").order(order, { ascending: true });
  return assertData(response, `leer ${table}`) as T[];
}

export async function insertRow<T>(
  client: SupabaseClient,
  table: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await client.from(table).insert(payload).select("*").single();
  return assertData(response, `crear ${table}`) as T;
}

export async function updateRow<T>(
  client: SupabaseClient,
  table: string,
  id: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const response = await client.from(table).update(payload).eq("id", id).select("*").single();
  return assertData(response, `actualizar ${table}`) as T;
}
