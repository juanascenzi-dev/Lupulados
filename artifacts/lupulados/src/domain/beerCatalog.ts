import { formatPrice } from "./format";
import { commercialSnapshot } from "./commercialData";
import { buildBeerCatalog, getCartItemLitersFromSnapshot } from "./commercialAdapters";
import { createCartLineKey } from "./productCatalog";
import type { PresentationType } from "./commercialTypes";

export type CartCategory = "barril" | "growler" | "porrón" | "pack";
export type BeerPresentationId = PresentationType;

export interface BeerPresentation {
  id: BeerPresentationId;
  label: string;
  price: number;
  category: CartCategory;
  liters?: number;
  description?: string;
}

export interface Beer {
  id: string;
  name: string;
  description: string;
  desc: string;
  abv: number;
  ibu: number;
  badge?: string;
  image: string;
  img: string;
  precios: Record<BeerPresentationId, number>;
  presentations: BeerPresentation[];
}

export interface CartItemDraft {
  id: string;
  name: string;
  price: number;
  category: CartCategory;
  productId?: string;
  productName?: string;
  beerId?: string;
  beerName?: string;
  presentationId?: string;
  presentationLabel?: string;
  presentationType?: string;
  presentationCategory?: CartCategory;
  productCategory?: "beer" | "pack";
  variantId?: string;
  variantLabel?: string;
}

const presentationIds: BeerPresentationId[] = [
  "barril20L",
  "barril30L",
  "barril50L",
  "growler1L",
  "growler2L",
  "porron500ml",
];

export const beerCatalog: Beer[] = buildBeerCatalog();

export const barrelPresentationIds: BeerPresentationId[] = ["barril20L", "barril30L", "barril50L"];
export const growlerPresentationIds: BeerPresentationId[] = ["growler1L", "growler2L"];
export const packagedPresentationIds: BeerPresentationId[] = ["porron500ml"];

export const tastingPack = {
  id: "pack-degustacion",
  name: "Pack Degustación — 6 estilos",
  price: 10500,
  category: "pack" as CartCategory,
  productId: "pack-degustacion",
  productName: "Pack DegustaciÃ³n",
  presentationId: "pack-degustacion",
  presentationLabel: "6 estilos",
};

function getMinimumPresentationPrice(ids: BeerPresentationId[]) {
  return Math.min(
    ...beerCatalog.flatMap((beer) => ids.map((presentationId) => beer.precios[presentationId])),
  );
}

function formatStartingPrice(price: number, suffix = "") {
  return `Desde ${formatPrice(price)}${suffix}`;
}

const barrelStartingPrice = getMinimumPresentationPrice(barrelPresentationIds);
const growlerStartingPrice = getMinimumPresentationPrice(growlerPresentationIds);
const packagedStartingPrice = getMinimumPresentationPrice(packagedPresentationIds);

export const orderTypeOptions = [
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
    desdePrice: tastingPack.price,
    desde: formatPrice(tastingPack.price),
    detail: "6 botellas · 6 estilos distintos",
    img: "https://images.unsplash.com/photo-1505075106905-fb052892c116?w=600&h=400&fit=crop",
  },
] as const;

export function getBeerPresentation(beer: Beer, presentationId: BeerPresentationId) {
  return beer.presentations.find((presentation) => presentation.id === presentationId);
}

export function createBeerCartItem(beer: Beer, presentationId: BeerPresentationId): CartItemDraft {
  const presentation = getBeerPresentation(beer, presentationId);
  if (!presentation) {
    throw new Error(`Presentation ${presentationId} not found for ${beer.id}`);
  }

  return {
    id: createCartLineKey({
      category: presentation.category,
      productCategory: "beer",
      productId: beer.id,
      presentationId: `${beer.id}:${presentation.id}`,
      variantId: beer.name,
    }),
    name: `${beer.name} — ${presentation.label}`,
    price: presentation.price,
    category: presentation.category,
    productCategory: "beer",
    productId: beer.id,
    productName: beer.name,
    beerId: beer.id,
    beerName: beer.name,
    presentationId: `${beer.id}:${presentation.id}`,
    presentationLabel: presentation.label,
    presentationType: presentation.id,
    presentationCategory: presentation.category,
    variantId: beer.name,
    variantLabel: beer.name,
  };
}

export function getCartItemImage(itemName: string) {
  return beerCatalog.find((beer) => itemName.startsWith(beer.name))?.image;
}

export function getCartItemPresentationId(itemId: string): BeerPresentationId | null {
  const keyPresentation = /(?:^|\|)presentation=[^:|]+:([^|]+)/.exec(itemId)?.[1];
  if (presentationIds.includes(keyPresentation as BeerPresentationId)) {
    return keyPresentation as BeerPresentationId;
  }

  const directId = itemId.split(":")[1];
  if (presentationIds.includes(directId as BeerPresentationId)) {
    return directId as BeerPresentationId;
  }

  return presentationIds.find((id) => itemId.includes(id)) ?? null;
}

export function getCartItemLiters(itemId: string) {
  return getCartItemLitersFromSnapshot(itemId, commercialSnapshot);
}
