import { afterEach, describe, expect, it, vi } from "vitest";
import { getMotionAwareScrollBehavior, prefersReducedMotion } from "./reducedMotion";

const originalWindow = globalThis.window;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

describe("reduced motion helpers", () => {
  it("uses smooth scrolling when reduced motion is not requested", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: vi.fn(() => ({ matches: false })),
      },
    });

    expect(prefersReducedMotion()).toBe(false);
    expect(getMotionAwareScrollBehavior()).toBe("smooth");
  });

  it("uses instant scrolling when reduced motion is requested", () => {
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        matchMedia: vi.fn(() => ({ matches: true })),
      },
    });

    expect(prefersReducedMotion()).toBe(true);
    expect(getMotionAwareScrollBehavior()).toBe("auto");
  });
});
