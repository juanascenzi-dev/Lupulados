import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LANDING_SECTION_ORDER } from "@/lib/sectionNavigation";

const landingSource = readFileSync(new URL("./Landing.tsx", import.meta.url), "utf8");
const servicesSource = readFileSync(new URL("../components/Services.tsx", import.meta.url), "utf8");
const howItWorksSource = readFileSync(new URL("../components/ComoFunciona.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

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

  it("centralizes hash restoration through section navigation", () => {
    expect(landingSource).toContain("getSectionIdFromHash");
    expect(landingSource).toContain('window.addEventListener("hashchange", scrollToCurrentHash)');
    expect(landingSource).toContain('window.addEventListener("popstate", scrollToCurrentHash)');
    expect(landingSource).toContain('window.addEventListener("resize", scrollToCurrentHash)');
    expect(landingSource).toContain("scrollToSection(sectionId)");
  });

  it("keeps compact landing sections viewport-aware without targeting centered content", () => {
    expect(servicesSource).toContain('className="site-section services-section site-section-compact');
    expect(servicesSource).toContain('<span data-section-entry className="absolute top-0');
    expect(cssSource).toContain(".services-section");
    expect(cssSource).toContain("min-height: calc(100dvh - var(--site-sticky-offset));");

    expect(howItWorksSource).toContain('className="site-section how-it-works-section site-section-compact');
    expect(howItWorksSource).toContain('<span data-section-entry className="absolute top-0');
    expect(howItWorksSource).toContain('viewport={{ once: true, amount: 0.1, margin: "0px 0px 96px 0px" }}');
    expect(howItWorksSource).not.toContain('margin: "-100px"');
  });
});
