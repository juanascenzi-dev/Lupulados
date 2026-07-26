import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getActiveSectionId,
  getSiteHeaderOffset,
  scrollToSection,
  setSiteHeaderOffset,
  type SectionPosition,
} from "./sectionNavigation";

const originalDocument = globalThis.document;
const originalWindow = globalThis.window;

afterEach(() => {
  vi.restoreAllMocks();
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: originalDocument,
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: originalWindow,
  });
});

const sections: SectionPosition[] = [
  { id: "inicio", top: 0, bottom: 720 },
  { id: "servicios", top: 720, bottom: 1320 },
  { id: "cervezas", top: 1320, bottom: 2400 },
  { id: "ubicacion", top: 5000, bottom: 5600 },
];

describe("section navigation helpers", () => {
  it("selects inicio near the top", () => {
    expect(
      getActiveSectionId({
        sections,
        scrollY: 0,
        viewportHeight: 800,
        documentHeight: 5600,
        headerOffset: 92,
      }),
    ).toBe("inicio");
  });

  it("selects a middle section using the active viewport line", () => {
    expect(
      getActiveSectionId({
        sections,
        scrollY: 760,
        viewportHeight: 800,
        documentHeight: 5600,
        headerOffset: 92,
      }),
    ).toBe("servicios");
  });

  it("switches from servicios to cervezas when the main viewport area reaches cervezas", () => {
    expect(
      getActiveSectionId({
        sections,
        scrollY: 1080,
        viewportHeight: 800,
        documentHeight: 5600,
        headerOffset: 92,
      }),
    ).toBe("cervezas");
  });

  it("keeps ubicacion active at the page bottom", () => {
    expect(
      getActiveSectionId({
        sections,
        scrollY: 4800,
        viewportHeight: 800,
        documentHeight: 5600,
        headerOffset: 92,
      }),
    ).toBe("ubicacion");
  });

  it("returns null when no sections are available", () => {
    expect(
      getActiveSectionId({
        sections: [],
        scrollY: 0,
        viewportHeight: 800,
        documentHeight: 0,
        headerOffset: 92,
      }),
    ).toBeNull();
  });

  it("reads and writes the shared header offset CSS variable", () => {
    const style = {
      value: "",
      setProperty: vi.fn((_name: string, value: string) => {
        style.value = value;
      }),
    };

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { documentElement: { style } },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        getComputedStyle: vi.fn(() => ({
          getPropertyValue: vi.fn(() => style.value),
        })),
      },
    });

    setSiteHeaderOffset(91.2);

    expect(style.setProperty).toHaveBeenCalledWith("--site-header-offset", "92px");
    expect(getSiteHeaderOffset()).toBe(92);
  });

  it("scrolls with the dynamic offset and reduced-motion-aware behavior", () => {
    const scrollTo = vi.fn();
    const element = {
      getBoundingClientRect: vi.fn(() => ({ top: 500 })),
    };

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        documentElement: {
          style: {},
        },
        getElementById: vi.fn(() => element),
      },
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        scrollY: 100,
        scrollTo,
        matchMedia: vi.fn(() => ({ matches: true })),
        getComputedStyle: vi.fn(() => ({
          getPropertyValue: vi.fn(() => "92px"),
        })),
      },
    });

    scrollToSection("calculadora");

    expect(scrollTo).toHaveBeenCalledWith({ top: 500, behavior: "auto" });
  });
});
