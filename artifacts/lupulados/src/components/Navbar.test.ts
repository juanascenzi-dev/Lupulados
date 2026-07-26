import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Navbar } from "./Navbar";

describe("Navbar accessibility", () => {
  it("exposes menu state and controls for mobile navigation", () => {
    const html = renderToStaticMarkup(createElement(Navbar, { bannerVisible: false, bannerHeight: 44 }));

    expect(html).toContain('aria-label="Navegacion principal"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('aria-controls="menu-mobile"');
    expect(html).toContain('aria-haspopup="menu"');
    expect(html).not.toContain('tabIndex="1"');
  });
});
