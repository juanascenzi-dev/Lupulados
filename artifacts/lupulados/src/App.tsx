import { Suspense } from "react";
import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteFallback } from "@/components/RouteFallback";
import { RouteFocusManager } from "@/components/RouteFocusManager";
import { SeoManager } from "@/components/SeoManager";
import { CartProvider } from "@/context/CartContext";
import { CommercialDataProvider } from "@/context/CommercialDataContext";
import { createLazyPages } from "@/routes/lazyRoutes";

const queryClient = new QueryClient();
const { Landing, AdminLogin, AdminDashboard, AdminRouteShell, NotFound } = createLazyPages();

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback label="Cargando pagina..." />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <LazyRoute>
          <Landing />
        </LazyRoute>
      </Route>
      <Route path="/admin/login">
        <LazyRoute>
          <AdminRouteShell>
            <AdminLogin />
          </AdminRouteShell>
        </LazyRoute>
      </Route>
      <Route path="/admin">
        <LazyRoute>
          <AdminRouteShell>
            <AdminDashboard />
          </AdminRouteShell>
        </LazyRoute>
      </Route>
      <Route>
        <LazyRoute>
          <NotFound />
        </LazyRoute>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MotionConfig reducedMotion="user">
          <CommercialDataProvider>
            <CartProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <SeoManager />
                <RouteFocusManager />
                <Router />
              </WouterRouter>
              <Toaster />
            </CartProvider>
          </CommercialDataProvider>
        </MotionConfig>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
