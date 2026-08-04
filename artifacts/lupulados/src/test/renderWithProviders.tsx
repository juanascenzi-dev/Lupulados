import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { CommercialDataProvider } from "@/context/CommercialDataContext";
import { CartProvider } from "@/context/CartContext";
import AdminRouteShell from "@/routes/AdminRouteShell";
import { Toaster } from "@/components/ui/toaster";
import type { CommercialSnapshot } from "@/domain/commercialTypes";

interface RenderWithSnapshotOptions {
  /**
   * Snapshot custom a pre-sembrar en el cache de React Query (queryKey
   * ["commercial-snapshot"]) en vez del catálogo demo estático real. Útil
   * para casos que necesitan datos que el seed único no tiene (ej. una
   * promoción "fixed").
   */
  snapshot?: CommercialSnapshot;
}

function createTestQueryClient(snapshot?: CommercialSnapshot) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  if (snapshot) {
    queryClient.setQueryData(["commercial-snapshot"], {
      snapshot,
      source: "static" as const,
      error: null,
    });
  }
  return queryClient;
}

// Calculadora: solo necesita CommercialDataProvider (+ QueryClientProvider transitivo).
export function renderWithCommercialData(
  ui: ReactElement,
  options: RenderWithSnapshotOptions = {},
) {
  return render(
    <QueryClientProvider client={createTestQueryClient(options.snapshot)}>
      <CommercialDataProvider>{ui}</CommercialDataProvider>
    </QueryClientProvider>,
  );
}

// ArmaTuPedido: CommercialDataProvider + CartProvider anidado (CartProvider usa useCommercialData()).
export function renderWithCart(ui: ReactElement, options: RenderWithSnapshotOptions = {}) {
  return render(
    <QueryClientProvider client={createTestQueryClient(options.snapshot)}>
      <CommercialDataProvider>
        <CartProvider>{ui}</CartProvider>
      </CommercialDataProvider>
    </QueryClientProvider>,
  );
}

// AdminLogin / AdminDashboard: reusa AdminRouteShell real (=AdminAuthProvider) para
// calcar la composicion real de App.tsx, mas Router en memoria (sin tocar window.history).
export function renderAdmin(ui: ReactElement, options: { path?: string } = {}) {
  const { hook, searchHook, history } = memoryLocation({
    path: options.path ?? "/admin",
    record: true,
  });

  const result = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CommercialDataProvider>
        <Router hook={hook} searchHook={searchHook}>
          <AdminRouteShell>{ui}</AdminRouteShell>
        </Router>
        <Toaster />
      </CommercialDataProvider>
    </QueryClientProvider>,
  );

  return { ...result, history };
}
