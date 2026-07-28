import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANDING_SECTION_ORDER } from "@/lib/sectionNavigation";

const landingSource = readFileSync(new URL("./Landing.tsx", import.meta.url), "utf8");

describe("Landing section composition", () => {
  it("renders navigable sections in the same order used by the navbar and scrollspy", () => {
    const markers = [
      "<Hero />",
      "<Services />",
      "<Cervezas />",
      "<Calculadora onUseRecommendation={useRecommendation} />",
      "<ArmaTuPedido",
      "<Eventos />",
      "<ComoFunciona />",
      "<FAQ />",
      "<Ubicacion />",
    ];

    const positions = markers.map((marker) => landingSource.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(LANDING_SECTION_ORDER).toEqual([
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
  });

  it("keeps lazy fallbacks addressable by the same ids as the loaded sections", () => {
    ["calculadora", "arma-tu-pedido", "eventos", "como-funciona", "faq", "ubicacion"].forEach(
      (id) => {
        expect(landingSource).toMatch(new RegExp(`<RouteFallback\\s+id="${id}"`));
      },
    );
  });
});
