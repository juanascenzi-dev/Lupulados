import { useEffect } from "react";
import { useLocation } from "wouter";
import { useCommercialData } from "@/context/CommercialDataContext";
import {
  OG_IMAGE_URL,
  SITE_NAME,
  THEME_COLOR,
  buildLocalBusinessJsonLd,
  getRouteMetadata,
} from "@/lib/seo";

function upsertMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertLink(rel: string, href: string | null) {
  const selector = `link[rel="${rel}"]`;
  const existing = document.head.querySelector<HTMLLinkElement>(selector);
  if (!href) {
    existing?.remove();
    return;
  }

  const element = existing ?? document.createElement("link");
  element.rel = rel;
  element.href = href;
  if (!existing) document.head.appendChild(element);
}

function upsertJsonLd(id: string, data: unknown | null) {
  const existing = document.getElementById(id);
  if (!data) {
    existing?.remove();
    return;
  }

  const element = (existing ?? document.createElement("script")) as HTMLScriptElement;
  element.id = id;
  element.type = "application/ld+json";
  element.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(element);
}

export function SeoManager() {
  const [pathname] = useLocation();
  const { snapshot } = useCommercialData();

  useEffect(() => {
    const metadata = getRouteMetadata(pathname);

    document.documentElement.lang = "es";
    document.title = metadata.title;
    upsertMeta('meta[name="description"]', { name: "description", content: metadata.description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: metadata.robots });
    upsertMeta('meta[name="theme-color"]', { name: "theme-color", content: THEME_COLOR });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: metadata.title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: metadata.description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: OG_IMAGE_URL });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: metadata.canonical ?? window.location.href });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: metadata.title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: metadata.description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: OG_IMAGE_URL });
    upsertLink("canonical", metadata.canonical);
    upsertJsonLd("lupulados-local-business-jsonld", pathname === "/" ? buildLocalBusinessJsonLd(snapshot) : null);
  }, [pathname, snapshot]);

  return null;
}
