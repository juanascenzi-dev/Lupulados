import { describe, expect, it } from "vitest";
import { shouldShowFloatingCart } from "./floatingCartVisibility";

describe("shouldShowFloatingCart", () => {
  it("shows the floating cart only on the landing page with items outside the order flow", () => {
    expect(shouldShowFloatingCart({ totalItems: 2, pathname: "/", hash: "", orderFlowActive: false })).toBe(true);
  });

  it("hides when the cart is empty, the route is not the landing page, or the order flow is active", () => {
    expect(shouldShowFloatingCart({ totalItems: 0, pathname: "/", hash: "", orderFlowActive: false })).toBe(false);
    expect(shouldShowFloatingCart({ totalItems: 2, pathname: "/tienda", hash: "", orderFlowActive: false })).toBe(false);
    expect(shouldShowFloatingCart({ totalItems: 2, pathname: "/", hash: "#arma-tu-pedido", orderFlowActive: false })).toBe(false);
    expect(shouldShowFloatingCart({ totalItems: 2, pathname: "/", hash: "", orderFlowActive: true })).toBe(false);
  });
});
