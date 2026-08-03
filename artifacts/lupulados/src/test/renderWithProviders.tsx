import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { CommercialDataProvider } from "@/context/CommercialDataContext";
import { CartProvider } from "@/context/CartContext";
import AdminRouteShell from "@/routes/AdminRouteShell";
import { Toaster } from "@/components/ui/toaster";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// Calculadora: solo necesita CommercialDataProvider (+ QueryClientProvider transitivo).
export function renderWithCommercialData(ui: ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <CommercialDataProvider>{ui}</CommercialDataProvider>
    </QueryClientProvider>,
  );
}

// ArmaTuPedido: CommercialDataProvider + CartProvider anidado (CartProvider usa useCommercialData()).
export function renderWithCart(ui: ReactElement) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
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
