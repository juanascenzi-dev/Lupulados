import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";
import { NAV_LINKS } from "@/lib/sectionNavigation";

describe("Navbar accessibility", () => {
  it("exposes menu state and controls for mobile navigation", () => {
    const html = renderToStaticMarkup(createElement(Navbar, { bannerVisible: false, bannerHeight: 44 }));

    expect(html).toContain('aria-label="Navegacion principal"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="menu-mobile"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-current="location"');
    expect(html).not.toContain('tabIndex="1"');
  });

  it("keeps one unique navigation source for all landing sections", () => {
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
    expect(new Set(ids).size).toBe(ids.length);
  });
});
