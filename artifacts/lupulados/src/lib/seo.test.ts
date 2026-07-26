import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { commercialSnapshot } from "@/domain/commercialData";
import {
  OG_IMAGE_URL,
  SITE_URL,
  buildLocalBusinessJsonLd,
  getRouteMetadata,
} from "./seo";

function readProjectFile(relativeFromSrc: string) {
  return readFileSync(fileURLToPath(new URL(`../${relativeFromSrc}`, import.meta.url)), "utf8");
}

describe("route metadata", () => {
  it("indexes the public home with the production canonical", () => {
    expect(getRouteMetadata("/")).toMatchObject({
      canonical: SITE_URL,
      robots: "index, follow",
    });
  });

  it("marks administrative routes as noindex without public canonical", () => {
    expect(getRouteMetadata("/admin")).toMatchObject({
      canonical: null,
      robots: "noindex, nofollow",
    });
    expect(getRouteMetadata("/admin/login")).toMatchObject({
      canonical: null,
      robots: "noindex, nofollow",
    });
  });

  it("marks unknown routes as noindex", () => {
    expect(getRouteMetadata("/no-existe")).toMatchObject({
      canonical: null,
      robots: "noindex, nofollow",
    });
  });
});

describe("local business JSON-LD", () => {
  it("uses only confirmed business fields", () => {
    const jsonLd = buildLocalBusinessJsonLd(commercialSnapshot);

    expect(jsonLd).toMatchObject({
      "@type": "LocalBusiness",
      name: "Lupulados",
      url: SITE_URL,
      address: {
        "@type": "PostalAddress",
        streetAddress: "Primera Junta 2614",
      },
      telephone: "+5491133971210",
    });
    expect(JSON.stringify(jsonLd)).not.toContain("geo");
    expect(JSON.stringify(jsonLd)).not.toContain("taxID");
    expect(JSON.stringify(jsonLd)).not.toContain("aggregateRating");
    expect(JSON.stringify(jsonLd)).not.toContain("sameAs");
    expect(JSON.stringify(jsonLd)).not.toContain("priceRange");
  });
});

describe("static SEO and PWA assets", () => {
  it("defines base public metadata without duplicate JSON-LD", () => {
    const html = readProjectFile("../index.html");

    expect(html).toContain('<html lang="es">');
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}" />`);
    expect(html).toContain(`<meta property="og:image" content="${OG_IMAGE_URL}" />`);
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).not.toContain('application/ld+json');
  });

  it("keeps only the public home in sitemap and excludes admin in robots", () => {
    const robots = readProjectFile("../public/robots.txt");
    const sitemap = readProjectFile("../public/sitemap.xml");

    expect(robots).toContain("Disallow: /admin");
    expect(robots).toContain("Disallow: /admin/login");
    expect(sitemap).toContain(`<loc>${SITE_URL}</loc>`);
    expect(sitemap).not.toContain("/admin");
  });

  it("declares a valid manifest from existing assets only", () => {
    const manifest = JSON.parse(readProjectFile("../public/manifest.webmanifest"));

    expect(manifest).toMatchObject({
      name: "Lupulados",
      short_name: "Lupulados",
      start_url: "/",
      scope: "/",
      display: "standalone",
    });
    expect(manifest.icons).toEqual([
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ]);
  });

  it("keeps the skip link wired to the main content target", () => {
    const landing = readProjectFile("../src/pages/Landing.tsx");

    expect(landing).toContain('href="#contenido-principal"');
    expect(landing).toContain('id="contenido-principal"');
    expect(landing).not.toContain("tabIndex={1}");
  });
});
