import { afterEach, describe, expect, it, vi } from "vitest";
import {
  confirmArchive,
  emptyAdminData,
  formatArgentinaDate,
  matchesProductSearch,
  matchesStatus,
  tabs,
} from "./adminDashboardHelpers";
import type { Product } from "@/domain/commercialTypes";

function buildProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "ipa-artesanal",
    slug: "ipa-artesanal",
    name: "IPA Artesanal",
    description: "Cerveza intensa y lupulada",
    category: "beer",
    image: "ipa.png",
    status: "active",
    sortOrder: 0,
    ...overrides,
  };
}

describe("matchesProductSearch", () => {
  it("matches everything when the search term is empty or blank", () => {
    const product = buildProduct();
    expect(matchesProductSearch(product, "")).toBe(true);
    expect(matchesProductSearch(product, "   ")).toBe(true);
  });

  it("matches by name, case-insensitively", () => {
    expect(matchesProductSearch(buildProduct({ name: "IPA Artesanal" }), "ipa")).toBe(true);
    expect(matchesProductSearch(buildProduct({ name: "IPA Artesanal" }), "ARTESANAL")).toBe(true);
  });

  it("matches by product id even when it does not match the name", () => {
    expect(
      matchesProductSearch(buildProduct({ id: "sku-123", name: "Otra Cosa" }), "sku-123"),
    ).toBe(true);
  });

  it("does not accent-fold: an accented name does not match its unaccented search term", () => {
    expect(matchesProductSearch(buildProduct({ name: "Cervéza Roja" }), "cerveza")).toBe(false);
  });

  it("returns false when neither name nor id contain the term", () => {
    expect(matchesProductSearch(buildProduct({ name: "IPA", id: "ipa" }), "stout")).toBe(false);
  });
});

describe("matchesStatus", () => {
  it("'all' matches regardless of active state", () => {
    expect(matchesStatus(true, "all")).toBe(true);
    expect(matchesStatus(false, "all")).toBe(true);
  });

  it("'active' only matches active items", () => {
    expect(matchesStatus(true, "active")).toBe(true);
    expect(matchesStatus(false, "active")).toBe(false);
  });

  it("'archived' only matches inactive items", () => {
    expect(matchesStatus(false, "archived")).toBe(true);
    expect(matchesStatus(true, "archived")).toBe(false);
  });
});

describe("confirmArchive", () => {
  // This spec runs in vitest's "node" project (no DOM), so `window` does not exist globally —
  // stub the minimal shape confirmArchive() needs instead of switching this file to jsdom.
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prompts window.confirm with the exact expected message and returns its result", () => {
    const confirm = vi.fn().mockReturnValue(true);
    vi.stubGlobal("window", { confirm });
    const result = confirmArchive("IPA Artesanal");
    expect(confirm).toHaveBeenCalledWith("¿Confirmás archivar o desactivar IPA Artesanal?");
    expect(result).toBe(true);
  });

  it("returns false when the user cancels the confirmation", () => {
    vi.stubGlobal("window", { confirm: vi.fn().mockReturnValue(false) });
    expect(confirmArchive("IPA Artesanal")).toBe(false);
  });
});

describe("formatArgentinaDate", () => {
  it("formats an ISO string as a short Argentina date and time", () => {
    const formatted = formatArgentinaDate("2026-08-07T15:30:00Z");
    expect(formatted).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}/);
  });

  it("produces a different result for a different point in time", () => {
    const morning = formatArgentinaDate("2026-08-07T09:00:00Z");
    const nextDay = formatArgentinaDate("2026-08-08T09:00:00Z");
    expect(morning).not.toBe(nextDay);
  });
});

describe("tabs / emptyAdminData contract", () => {
  it("declares exactly 9 tabs with unique ids", () => {
    expect(tabs).toHaveLength(9);
    expect(new Set(tabs.map((tab) => tab.id)).size).toBe(9);
  });

  it("starts every list of emptyAdminData empty", () => {
    expect(
      Object.values(emptyAdminData).every((list) => Array.isArray(list) && list.length === 0),
    ).toBe(true);
  });
});
