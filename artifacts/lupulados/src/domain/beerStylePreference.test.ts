import { describe, expect, it } from "vitest";
import { beerCatalog } from "./beerCatalog";
import {
  normalizeBeerStyleSelection,
  summarizeBeerStyleSelection,
  toggleBeerStyleSelection,
} from "./beerStylePreference";

describe("beerStylePreference", () => {
  it("uses an empty selection as Cualquiera", () => {
    expect(summarizeBeerStyleSelection([], beerCatalog)).toBe("Cualquiera");
  });

  it("allows multiple selected styles", () => {
    const first = beerCatalog[0].id;
    const second = beerCatalog[1].id;
    const selected = toggleBeerStyleSelection([first], second, beerCatalog);

    expect(selected).toEqual([first, second]);
    expect(summarizeBeerStyleSelection(selected, beerCatalog)).toBe("2 estilos seleccionados");
  });

  it("toggles an existing style off without touching the rest", () => {
    const first = beerCatalog[0].id;
    const second = beerCatalog[1].id;

    expect(toggleBeerStyleSelection([first, second], first, beerCatalog)).toEqual([second]);
  });

  it("drops duplicate or unknown ids", () => {
    const first = beerCatalog[0].id;

    expect(normalizeBeerStyleSelection([first, "missing", first], beerCatalog)).toEqual([first]);
  });
});
