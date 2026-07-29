import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteFallback } from "@/components/RouteFallback";
import { createLazyPages, routeDefinitions } from "./lazyRoutes";

describe("lazy route setup", () => {
  it("keeps the expected public, admin and fallback routes", () => {
    expect(routeDefinitions).toEqual([
      { path: "/", page: "landing", admin: false },
      { path: "/tienda", page: "store", admin: false },
      { path: "/admin/login", page: "adminLogin", admin: true },
      { path: "/admin", page: "adminDashboard", admin: true },
      { path: "*", page: "notFound", admin: false },
    ]);
  });

  it("does not import AdminDashboard when lazy pages are created", () => {
    const importers = {
      landing: vi.fn(),
      store: vi.fn(),
      adminLogin: vi.fn(),
      adminDashboard: vi.fn(),
      adminRouteShell: vi.fn(),
      notFound: vi.fn(),
    };

    const pages = createLazyPages(importers);

    expect(Object.keys(pages)).toEqual(["Landing", "Store", "AdminLogin", "AdminDashboard", "AdminRouteShell", "NotFound"]);
    expect(importers.adminDashboard).not.toHaveBeenCalled();
    expect(importers.adminRouteShell).not.toHaveBeenCalled();
    expect(importers.landing).not.toHaveBeenCalled();
  });

  it("keeps landing outside the administrative provider", () => {
    const landing = routeDefinitions.find((route) => route.path === "/");
    const admin = routeDefinitions.find((route) => route.path === "/admin");

    expect(landing?.admin).toBe(false);
    expect(admin?.admin).toBe(true);
  });
});

describe("loading and render recovery", () => {
  it("renders an accessible suspense fallback with reserved space", () => {
    const html = renderToStaticMarkup(
      RouteFallback({
        id: "arma-tu-pedido",
        label: "Cargando pedido...",
        minHeightClassName: "min-h-[680px]",
      }),
    );

    expect(html).toContain('id="arma-tu-pedido"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("min-h-[680px]");
    expect(html).toContain("Cargando pedido...");
  });

  it("shows friendly recovery actions when render fails", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = ErrorBoundary.getDerivedStateFromError();

    const html = renderToStaticMarkup(boundary.render() as ReactElement);

    expect(html).toContain("No pudimos mostrar esta seccion");
    expect(html).toContain("Reintentar");
    expect(html).toContain("Volver al inicio");
    expect(html).not.toContain("stack");
  });

  it("can retry after a render failure", () => {
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { hasError: true };
    boundary.setState = ((nextState: { hasError: boolean }) => {
      boundary.state = { ...boundary.state, ...nextState };
    }) as typeof boundary.setState;

    boundary.retry();

    expect(boundary.state.hasError).toBe(false);
  });
});
