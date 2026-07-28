import { formatPrice } from "./format";
import { buildWhatsAppOrderUrl } from "./whatsAppOrder";
import {
  getBusinessProfile,
  getFreeGlassesThreshold,
  getPricingConfig,
  getPrimaryOrderWhatsAppChannel,
  listActiveDeliveryOptions,
  listActiveExtraOptions,
  listActiveProductPresentations,
  listActiveProducts,
  listActivePromotions,
  listActiveWhatsAppChannels,
} from "./commercialSelectors";
import { commercialSnapshot } from "./commercialData";
import type { CommercialSnapshot } from "./commercialTypes";
import type { Beer, BeerPresentation, BeerPresentationId, CartCategory } from "./beerCatalog";

export const presentationIds: BeerPresentationId[] = [
  "barril20L",
  "barril30L",
  "barril50L",
  "growler1L",
  "growler2L",
  "porron500ml",
];

export function buildBeerCatalog(snapshot: CommercialSnapshot = commercialSnapshot): Beer[] {
  return listActiveProducts(snapshot)
    .filter((product) => product.category === "beer")
    .map((product) => {
      const presentations: BeerPresentation[] = listActiveProductPresentations(product.id, snapshot).map((presentation) => ({
        id: presentation.presentationType,
        label: presentation.label,
        price: presentation.unitPrice,
        category: presentation.category as CartCategory,
        liters: presentation.volumeLiters,
        description: presentation.description,
      }));

      const precios = Object.fromEntries(
        presentationIds.map((id) => [id, presentations.find((presentation) => presentation.id === id)?.price ?? 0]),
      ) as Record<BeerPresentationId, number>;

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        desc: product.description,
        abv: product.abv ?? 0,
        ibu: product.ibu ?? 0,
        badge: product.badge,
        image: product.image,
        img: product.image,
        precios,
        presentations,
      };
    });
}

function getMinimumPresentationPrice(catalog: readonly Beer[], ids: readonly BeerPresentationId[]) {
  const prices = catalog.flatMap((beer) => ids.map((presentationId) => beer.precios[presentationId]).filter((price) => price > 0));
  return prices.length > 0 ? Math.min(...prices) : 0;
}

function formatStartingPrice(price: number, suffix = "") {
  return `Desde ${formatPrice(price)}${suffix}`;
}

export function buildOrderTypeOptions(snapshot: CommercialSnapshot = commercialSnapshot) {
  const catalog = buildBeerCatalog(snapshot);
  const barrelStartingPrice = getMinimumPresentationPrice(catalog, ["barril20L", "barril30L", "barril50L"]);
  const growlerStartingPrice = getMinimumPresentationPrice(catalog, ["growler1L", "growler2L"]);
  const packagedStartingPrice = getMinimumPresentationPrice(catalog, ["porron500ml"]);

  return [
    {
      id: "barril",
      emoji: "🛢️",
      title: "Barril",
      desc: "La experiencia completa para eventos de +20 personas.",
      desdePrice: barrelStartingPrice,
      desde: formatStartingPrice(barrelStartingPrice),
      detail: "20L · 30L · 50L disponibles",
      img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
    },
    {
      id: "growler",
      emoji: "🍺",
      title: "Growler",
      desc: "Recargable de 1L o 2L. Ideal para compartir en casa.",
      desdePrice: growlerStartingPrice,
      desde: formatStartingPrice(growlerStartingPrice),
      detail: "1L y 2L disponibles",
      img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
    },
    {
      id: "porrón",
      emoji: "🍻",
      title: "Pack Porrones",
      desc: "Botellas individuales 500ml. Perfecto para regalo o probar.",
      desdePrice: packagedStartingPrice,
      desde: formatStartingPrice(packagedStartingPrice, " c/u"),
      detail: "Botella 500ml artesanal",
      img: "https://images.unsplash.com/photo-1572463395542-3e951278d04c?w=600&h=400&fit=crop",
    },
    {
      id: "paquete",
      emoji: "🎁",
      title: "Pack Degustación",
      desc: "6 estilos surtidos para descubrir tu favorita.",
      desdePrice: 10500,
      desde: formatPrice(10500),
      detail: "6 botellas · 6 estilos distintos",
      img: "https://images.unsplash.com/photo-1505075106905-fb052892c116?w=600&h=400&fit=crop",
    },
  ] as const;
}

export function buildBusinessConfig(snapshot: CommercialSnapshot = commercialSnapshot) {
  const profile = getBusinessProfile(snapshot);
  const pricing = getPricingConfig(snapshot);
  const whatsappChannels = listActiveWhatsAppChannels(snapshot);
  const primaryOrderWhatsAppChannel = getPrimaryOrderWhatsAppChannel(snapshot.whatsappChannels);
  const deliveryOptions = listActiveDeliveryOptions(snapshot).map((option) => ({
    id: option.id,
    label: option.label,
    desc: option.price > 0 ? `+${formatPrice(option.price)}` : "Gratis",
    cost: option.price,
    requiresAddress: option.requiresAddress,
  }));
  const extrasById = Object.fromEntries(listActiveExtraOptions(snapshot).map((extra) => [extra.id, extra]));
  const activePromotion = listActivePromotions(snapshot)[0];

  return {
    businessProfile: profile,
    pricing,
    priceDisclaimer: pricing.disclaimer,
    whatsappChannels,
    primaryOrderWhatsAppChannel,
    whatsappNumber: primaryOrderWhatsAppChannel?.phoneE164 ?? "",
    whatsappDisplayLabel: primaryOrderWhatsAppChannel
      ? `${primaryOrderWhatsAppChannel.label}: ${primaryOrderWhatsAppChannel.phoneDisplay}`
      : "WhatsApp no disponible",
    publicContactEmail: profile.email,
    businessLocation: {
      factoryLabel: "Retiro en fábrica",
      locality: profile.address,
      address: profile.address,
      openingHours: profile.openingHours,
    },
    deliveryOptions,
    additionalCosts: {
      chopera: extrasById.chopera?.price ?? 0,
      hielo: extrasById.hielo?.price ?? 0,
      vasos: extrasById.vasos?.price ?? 0,
      freeGlassesThreshold: getFreeGlassesThreshold(snapshot),
    },
    promotionConfig: {
      code: activePromotion?.code ?? "",
      discountRate: activePromotion?.type === "percentage" ? activePromotion.value : 0,
      bannerClosedStorageKey: "promoBannerClosed",
    },
  };
}

export function getDeliveryOptionFromSnapshot(id: string, snapshot: CommercialSnapshot = commercialSnapshot) {
  const options = buildBusinessConfig(snapshot).deliveryOptions;
  return options.find((option) => option.id === id) ?? options[0];
}

export function buildWhatsAppUrlFromSnapshot(message: string, phone: string | undefined, snapshot: CommercialSnapshot = commercialSnapshot) {
  const selectedPhone = phone ?? buildBusinessConfig(snapshot).whatsappNumber;
  return buildWhatsAppOrderUrl(selectedPhone, message);
}

export function getCartItemLitersFromSnapshot(itemId: string, snapshot: CommercialSnapshot = commercialSnapshot) {
  const directPresentation = snapshot.productPresentations.find((presentation) => presentation.id === itemId);
  if (directPresentation) return directPresentation.volumeLiters;

  const presentationId =
    /(?:^|\|)presentation=[^:|]+:([^|]+)/.exec(itemId)?.[1] ??
    (itemId.includes(":") ? itemId.split(":")[1] : itemId);
  if (!presentationId) return 0;
  return snapshot.productPresentations.find((presentation) => presentation.presentationType === presentationId)?.volumeLiters ?? 0;
}
