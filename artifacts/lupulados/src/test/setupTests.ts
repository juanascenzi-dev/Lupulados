import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// RTL's own auto-cleanup only registers if it finds a global `afterEach`
// (globals: false in vitest.config.mjs means there isn't one), so it's wired
// here explicitly to unmount components between tests.
afterEach(() => {
  cleanup();
});

// jsdom does not implement matchMedia (no layout engine), but several
// components query "(prefers-reduced-motion: reduce)" to pick scroll/animation
// behavior. Default to "no preference", the same as a plain browser profile.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// jsdom has no layout engine, so it never implements scrollIntoView either;
// components that scroll a section into view on step/route changes need a stub.
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
