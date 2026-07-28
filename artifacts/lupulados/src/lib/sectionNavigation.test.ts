import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getActiveSectionId,
  getScrollTopForSectionTarget,
  getSectionEntryGap,
  getSectionScrollTarget,
  getSiteHeaderOffset,
  LANDING_SECTION_ORDER,
  NAV_LINKS,
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

const orderedSections: SectionPosition[] = [
  { id: "inicio", top: 0, bottom: 720 },
  { id: "servicios", top: 720, bottom: 1320 },
  { id: "cervezas", top: 1320, bottom: 2800 },
  { id: "calculadora", top: 2800, bottom: 3500 },
  { id: "arma-tu-pedido", top: 3500, bottom: 4700 },
  { id: "eventos", top: 4700, bottom: 5600 },
  { id: "como-funciona", top: 5600, bottom: 6300 },
  { id: "faq", top: 6300, bottom: 7000 },
  { id: "ubicacion", top: 7000, bottom: 7600 },
];

const setDocument = (value: unknown) => {
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value,
  });
};

const setWindow = (value: unknown) => {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value,
  });
};

describe("section navigation helpers", () => {
  it("keeps the exact landing navigation order with unique ids", () => {
    const ids = NAV_LINKS.map((link) => link.href);

    expect(ids).toEqual([
      "inicio",
      "servicios",
      "cervezas",
      "calculadora",
      "arma-tu-pedido",
      "eventos",
      "como-funciona",
      "faq",
      "ubicacion",
    ]);
    expect(LANDING_SECTION_ORDER).toEqual(ids);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.indexOf("eventos")).toBeLessThan(ids.indexOf("como-funciona"));
  });

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
        documentHeight: 7600,
        headerOffset: 92,
      }),
    ).toBe("ubicacion");
  });

  it("activates eventos before como-funciona in the required page order", () => {
    expect(
      getActiveSectionId({
        sections: orderedSections,
        scrollY: 4850,
        viewportHeight: 768,
        documentHeight: 7600,
        headerOffset: 88,
      }),
    ).toBe("eventos");
  });

  it("does not advance from cervezas while its secondary content still owns the viewport", () => {
    expect(
      getActiveSectionId({
        sections: orderedSections,
        scrollY: 2180,
        viewportHeight: 768,
        documentHeight: 7600,
        headerOffset: 88,
      }),
    ).toBe("cervezas");
  });

  it("moves backward when scrolling up into the previous section", () => {
    expect(
      getActiveSectionId({
        sections: orderedSections,
        scrollY: 4000,
        viewportHeight: 768,
        documentHeight: 7600,
        headerOffset: 88,
      }),
    ).toBe("arma-tu-pedido");
  });

  it("uses the full dynamic section height before activating the next id", () => {
    const dynamicSections: SectionPosition[] = [
      { id: "faq", top: 1000, bottom: 1900 },
      { id: "ubicacion", top: 1900, bottom: 2600 },
    ];

    expect(
      getActiveSectionId({
        sections: dynamicSections,
        scrollY: 1320,
        viewportHeight: 700,
        documentHeight: 2600,
        headerOffset: 84,
        entryGap: 18,
      }),
    ).toBe("faq");
  });

  it("respects header offset and section entry gap near an anchor boundary", () => {
    expect(
      getActiveSectionId({
        sections: orderedSections,
        scrollY: 4585,
        viewportHeight: 768,
        documentHeight: 7600,
        headerOffset: 88,
        entryGap: 16,
      }),
    ).toBe("eventos");
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

    setDocument({ documentElement: { style } });
    setWindow({
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn(() => style.value),
      })),
    });

    setSiteHeaderOffset(91.2);

    expect(style.setProperty).toHaveBeenCalledWith("--site-header-offset", "92px");
    expect(getSiteHeaderOffset()).toBe(92);
  });

  it("uses default offsets when window is unavailable", () => {
    setWindow(undefined);

    expect(getSiteHeaderOffset()).toBe(80);
    expect(getSectionEntryGap()).toBe(12);
  });

  it("uses default offsets when window exists but document is unavailable", () => {
    setWindow({
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn(() => "16px"),
      })),
    });
    setDocument(undefined);

    expect(getSiteHeaderOffset()).toBe(80);
    expect(getSectionEntryGap()).toBe(12);
  });

  it("uses default offsets when documentElement is unavailable", () => {
    setWindow({
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn(() => "16px"),
      })),
    });
    setDocument({});

    expect(getSiteHeaderOffset()).toBe(80);
    expect(getSectionEntryGap()).toBe(12);
  });

  it("uses default offsets when getComputedStyle is unavailable", () => {
    setWindow({});
    setDocument({ documentElement: {} });

    expect(getSiteHeaderOffset()).toBe(80);
    expect(getSectionEntryGap()).toBe(12);
  });

  it("reads valid shared offset CSS variables", () => {
    setDocument({ documentElement: {} });
    setWindow({
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn((name: string) =>
          name === "--site-header-offset" ? "96px" : "16px",
        ),
      })),
    });

    expect(getSiteHeaderOffset()).toBe(96);
    expect(getSectionEntryGap()).toBe(16);
  });

  it("uses default offsets when CSS variables are empty or invalid", () => {
    setDocument({ documentElement: {} });
    setWindow({
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn((name: string) =>
          name === "--site-header-offset" ? "" : "not-a-size",
        ),
      })),
    });

    expect(getSiteHeaderOffset()).toBe(80);
    expect(getSectionEntryGap()).toBe(12);
  });

  it("uses data-section-entry as the preferred scroll target", () => {
    const entry = {} as HTMLElement;
    const section = {
      querySelector: vi.fn(() => entry),
    } as unknown as HTMLElement;

    expect(getSectionScrollTarget(section)).toBe(entry);
    expect(section.querySelector).toHaveBeenCalledWith("[data-section-entry]");
  });

  it("falls back to the section when no data-section-entry exists", () => {
    const section = {
      querySelector: vi.fn(() => null),
    } as unknown as HTMLElement;

    expect(getSectionScrollTarget(section)).toBe(section);
  });

  it("calculates target position with header offset and one visual gap", () => {
    expect(
      getScrollTopForSectionTarget({
        targetTop: 500,
        scrollY: 100,
        headerOffset: 92,
        entryGap: 12,
      }),
    ).toBe(496);
  });

  it("never returns a negative target position", () => {
    expect(
      getScrollTopForSectionTarget({
        targetTop: 20,
        scrollY: 0,
        headerOffset: 92,
        entryGap: 12,
      }),
    ).toBe(0);
  });

  it("scrolls to the internal entry with the dynamic offset and reduced-motion-aware behavior", () => {
    const scrollTo = vi.fn();
    const entry = {
      getBoundingClientRect: vi.fn(() => ({ top: 500 })),
    };
    const element = {
      querySelector: vi.fn(() => entry),
      getBoundingClientRect: vi.fn(() => ({ top: 900 })),
    };

    setDocument({
      documentElement: {
        style: {},
      },
      getElementById: vi.fn(() => element),
    });
    setWindow({
      scrollY: 100,
      scrollTo,
      matchMedia: vi.fn(() => ({ matches: true })),
      getComputedStyle: vi.fn(() => ({
        getPropertyValue: vi.fn((name: string) =>
          name === "--site-header-offset" ? "92px" : "12px",
        ),
      })),
    });

    scrollToSection("calculadora");

    expect(scrollTo).toHaveBeenCalledWith({ top: 496, behavior: "auto" });
  });
});
