import { vi } from "vitest";
import type { BusinessProfileRow, ProductRow } from "@/domain/commercialRepositoryRows";

type SupabaseResult<T> = { data: T | null; error: { message: string } | null };

// getCommercialSnapshot() (used by CommercialDataProvider, a required wrapper for
// admin pages) reads business_profiles unconditionally and throws if the row is
// missing - a default row keeps that fallback path from firing on every test.
const DEFAULT_BUSINESS_PROFILE: BusinessProfileRow = {
  id: "default-business-profile",
  business_name: "Lupulados",
  address: null,
  opening_hours: null,
  email: null,
  pricing_status: "estimated",
  price_disclaimer: "Precios estimados.",
  active: true,
};

export interface FakeSession {
  user: { id: string; email: string };
}

export const FAKE_ADMIN_SESSION: FakeSession = {
  user: { id: "test-admin-id", email: "admin@lupulados.test" },
};

// Minimal chainable + "thenable" stand-in for the Supabase query builder: every
// non-terminal method returns `this`, and both awaiting the builder directly
// (selectRows does `await client.from(t).select("*").order(...)`) and calling
// .single()/.maybeSingle() resolve through the same `resolve` callback.
function createChainable<T>(resolve: () => SupabaseResult<T>) {
  const api = {
    select: vi.fn(() => api),
    order: vi.fn(() => api),
    eq: vi.fn(() => api),
    neq: vi.fn(() => api),
    limit: vi.fn(() => api),
    maybeSingle: vi.fn(() => Promise.resolve(resolve())),
    single: vi.fn(() => Promise.resolve(resolve())),
    then: (
      onFulfilled: (value: SupabaseResult<T>) => unknown,
      onRejected?: (reason: unknown) => unknown,
    ) => Promise.resolve(resolve()).then(onFulfilled, onRejected),
  };
  return api;
}

function createEmptyTable() {
  return () => createChainable(() => ({ data: [], error: null }));
}

// Stateful in-memory "products" table: supports the exact chains used by
// SupabaseCommercialRepository (select+order, eq+maybeSingle, insert+select+single,
// update+eq+select+single) against a shared `rows` array, so create/archive/restore
// in a test are reflected in the next select.
function createProductsTable(seed: ProductRow[]) {
  let rows = seed.map((row) => ({ ...row }));

  return () => {
    let pendingId: string | null = null;
    let pendingInsert: ProductRow | null = null;
    let pendingUpdate: Record<string, unknown> | null = null;

    const api = {
      select: vi.fn(() => api),
      order: vi.fn(() => api),
      eq: vi.fn((column: string, value: string) => {
        if (column === "id") pendingId = value;
        return api;
      }),
      insert: vi.fn((payload: ProductRow) => {
        pendingInsert = payload;
        return api;
      }),
      update: vi.fn((payload: Record<string, unknown>) => {
        pendingUpdate = payload;
        return api;
      }),
      maybeSingle: vi.fn(() =>
        Promise.resolve({
          data: rows.find((row) => row.id === pendingId) ?? null,
          error: null,
        }),
      ),
      single: vi.fn(() => {
        if (pendingInsert) {
          rows = [...rows, pendingInsert];
          return Promise.resolve({ data: pendingInsert, error: null });
        }
        if (pendingUpdate && pendingId) {
          rows = rows.map((row) => (row.id === pendingId ? { ...row, ...pendingUpdate } : row));
          return Promise.resolve({
            data: rows.find((row) => row.id === pendingId) ?? null,
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: (
        onFulfilled: (value: SupabaseResult<ProductRow[]>) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve({ data: rows, error: null }).then(onFulfilled, onRejected),
    };
    return api;
  };
}

export function createFakeSupabaseAdminClient(
  options: {
    initialSession?: FakeSession | null;
    isAdmin?: boolean;
    products?: ProductRow[];
  } = {},
) {
  let session = options.initialSession ?? null;
  const isAdmin = options.isAdmin ?? true;
  const productsTable = createProductsTable(options.products ?? []);
  const businessProfilesTable = () =>
    createChainable(() => ({ data: [DEFAULT_BUSINESS_PROFILE], error: null }));
  const emptyTable = createEmptyTable();

  return {
    auth: {
      getSession: vi.fn(async () => ({ data: { session }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signInWithPassword: vi.fn(async (_credentials: { email: string; password: string }) => {
        session = FAKE_ADMIN_SESSION;
        return { data: { session }, error: null };
      }),
      signOut: vi.fn(async () => {
        session = null;
        return { error: null };
      }),
    },
    rpc: vi.fn(async (fn: string) =>
      fn === "is_admin" ? { data: isAdmin, error: null } : { data: null, error: null },
    ),
    from: vi.fn((table: string) => {
      if (table === "products") return productsTable();
      if (table === "business_profiles") return businessProfilesTable();
      return emptyTable();
    }),
  };
}
