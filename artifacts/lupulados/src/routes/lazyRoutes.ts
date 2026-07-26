import { lazy } from "react";

export const lazyPageImporters = {
  landing: () => import("@/pages/Landing"),
  adminLogin: () => import("@/pages/AdminLogin"),
  adminDashboard: () => import("@/pages/AdminDashboard"),
  adminRouteShell: () => import("@/routes/AdminRouteShell"),
  notFound: () => import("@/pages/not-found"),
};

export const routeDefinitions = [
  { path: "/", page: "landing", admin: false },
  { path: "/admin/login", page: "adminLogin", admin: true },
  { path: "/admin", page: "adminDashboard", admin: true },
  { path: "*", page: "notFound", admin: false },
] as const;

export function createLazyPages(importers = lazyPageImporters) {
  return {
    Landing: lazy(importers.landing),
    AdminLogin: lazy(importers.adminLogin),
    AdminDashboard: lazy(importers.adminDashboard),
    AdminRouteShell: lazy(importers.adminRouteShell),
    NotFound: lazy(importers.notFound),
  };
}
