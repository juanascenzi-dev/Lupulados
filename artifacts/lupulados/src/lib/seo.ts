import type { CommercialSnapshot } from "@/domain/commercialTypes";

export const SITE_URL = "https://lupulados-lupulados.vercel.app/";
export const SITE_NAME = "Lupulados";
export const SITE_TITLE = "Lupulados - Cerveza artesanal para eventos";
export const SITE_DESCRIPTION =
  "Cerveza artesanal, barriles, choperas y pedidos guiados para eventos. Calcula litros, arma tu pedido y cerralo por WhatsApp.";
export const THEME_COLOR = "#f5a400";
export const OG_IMAGE_URL = `${SITE_URL}opengraph.jpg`;

export type SeoRobots = "index, follow" | "noindex, nofollow";

export interface RouteMetadata {
  title: string;
  description: string;
  robots: SeoRobots;
  canonical: string | null;
}

export function getRouteMetadata(pathname: string): RouteMetadata {
  if (pathname === "/") {
    return {
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      robots: "index, follow",
      canonical: SITE_URL,
    };
  }

  if (pathname === "/tienda") {
    return {
      title: "Tienda demo - Lupulados",
      description: "Catalogo demostrativo de bebidas, combos y accesorios para preparar pedidos mixtos por WhatsApp.",
      robots: "index, follow",
      canonical: `${SITE_URL}tienda`,
    };
  }

  if (pathname === "/admin") {
    return {
      title: "Administracion - Lupulados",
      description: "Acceso administrativo de Lupulados.",
      robots: "noindex, nofollow",
      canonical: null,
    };
  }

  if (pathname === "/admin/login") {
    return {
      title: "Ingreso administrativo - Lupulados",
      description: "Ingreso administrativo de Lupulados.",
      robots: "noindex, nofollow",
      canonical: null,
    };
  }

  return {
    title: "Pagina no encontrada - Lupulados",
    description: "La pagina solicitada no existe.",
    robots: "noindex, nofollow",
    canonical: null,
  };
}

export function buildLocalBusinessJsonLd(snapshot: CommercialSnapshot) {
  const primaryWhatsApp = snapshot.whatsappChannels
    .filter((channel) => channel.active)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder)[0];

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: snapshot.businessProfile.businessName,
    url: SITE_URL,
    address: {
      "@type": "PostalAddress",
      streetAddress: snapshot.businessProfile.address,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        opens: "00:00",
        closes: "23:59",
      },
    ],
    ...(primaryWhatsApp ? { telephone: `+${primaryWhatsApp.phoneE164}` } : {}),
  };
}
