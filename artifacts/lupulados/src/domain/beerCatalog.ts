import { formatPrice } from "./format";

export type CartCategory = "barril" | "growler" | "porrón" | "pack";

export type BeerPresentationId =
  | "barril20L"
  | "barril30L"
  | "barril50L"
  | "growler1L"
  | "growler2L"
  | "porron500ml";

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
}

const presentationDefinitions: Omit<BeerPresentation, "price">[] = [
  { id: "barril20L", label: "Barril 20L", category: "barril", liters: 20, description: "Aprox 40 pintas · hasta 50 personas" },
  { id: "barril30L", label: "Barril 30L", category: "barril", liters: 30, description: "Aprox 60 pintas · hasta 80 personas" },
  { id: "barril50L", label: "Barril 50L", category: "barril", liters: 50, description: "Aprox 100 pintas · +100 personas" },
  { id: "growler1L", label: "Growler 1L", category: "growler", liters: 1 },
  { id: "growler2L", label: "Growler 2L", category: "growler", liters: 2 },
  { id: "porron500ml", label: "Porrón 500ml", category: "porrón", liters: 0.5 },
];

const rawBeers = [
  {
    id: "blonde-ale",
    name: "Blonde Ale",
    description: "Suave, refrescante, ideal para los que arrancan en la artesanal.",
    abv: 4.8,
    ibu: 15,
    badge: "Popular",
    image: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop",
    prices: [38000, 54000, 85000, 3200, 5800, 1800],
  },
  {
    id: "apa",
    name: "American Pale Ale (APA)",
    description: "Cítrica y lupulada, nuestro caballito de batalla.",
    abv: 5.2,
    ibu: 35,
    badge: "Disponible en barril",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop",
    prices: [42000, 60000, 95000, 3600, 6500, 2000],
  },
  {
    id: "ipa",
    name: "IPA",
    description: "Intensa, aromática, para los que les gusta el lúpulo.",
    abv: 6.5,
    ibu: 55,
    badge: "Disponible en barril",
    image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
    prices: [46000, 66000, 105000, 4000, 7200, 2200],
  },
  {
    id: "red-ale",
    name: "Red Ale / Amber",
    description: "Maltosa, caramelo, equilibrada.",
    abv: 5,
    ibu: 25,
    badge: "Disponible en barril",
    image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop",
    prices: [40000, 57000, 90000, 3400, 6200, 1900],
  },
  {
    id: "stout",
    name: "Stout",
    description: "Oscura, con notas de café y chocolate.",
    abv: 5.8,
    ibu: 30,
    badge: "Disponible en barril",
    image: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop",
    prices: [44000, 63000, 100000, 3800, 6800, 2100],
  },
  {
    id: "honey-wheat",
    name: "Honey / Wheat",
    description: "Dulce, con miel patagónica, suavecita.",
    abv: 4.5,
    ibu: 12,
    badge: "Disponible en barril",
    image: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
    prices: [40000, 57000, 90000, 3400, 6200, 1900],
  },
  {
    id: "session-ipa",
    name: "Session IPA",
    description: "Lupulada pero liviana, para tomar toda la noche.",
    abv: 4.2,
    ibu: 40,
    badge: "Novedad",
    image: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop",
    prices: [42000, 60000, 95000, 3600, 6500, 2000],
  },
  {
    id: "scotch-ale",
    name: "Scotch Ale",
    description: "Fuerte, maltosa, para el invierno.",
    abv: 7.5,
    ibu: 20,
    badge: "Temporada",
    image: "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop",
    prices: [48000, 69000, 110000, 4400, 7800, 2400],
  },
] as const;

const presentationIds = presentationDefinitions.map((p) => p.id);

export const beerCatalog: Beer[] = rawBeers.map((beer) => {
  const precios = Object.fromEntries(
    presentationIds.map((id, index) => [id, beer.prices[index]]),
  ) as Record<BeerPresentationId, number>;

  const presentations = presentationDefinitions.map((presentation) => ({
    ...presentation,
    price: precios[presentation.id],
  }));

  return {
    ...beer,
    desc: beer.description,
    img: beer.image,
    precios,
    presentations,
  };
});

export const barrelPresentationIds: BeerPresentationId[] = ["barril20L", "barril30L", "barril50L"];
export const growlerPresentationIds: BeerPresentationId[] = ["growler1L", "growler2L"];
export const packagedPresentationIds: BeerPresentationId[] = ["porron500ml"];

export const tastingPack = {
  id: "pack-degustacion",
  name: "Pack Degustación — 6 estilos",
  price: 10500,
  category: "pack" as CartCategory,
};

function getMinimumPresentationPrice(presentationIds: BeerPresentationId[]) {
  return Math.min(
    ...beerCatalog.flatMap((beer) => presentationIds.map((presentationId) => beer.precios[presentationId])),
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
    id: `${beer.id}:${presentation.id}`,
    name: `${beer.name} — ${presentation.label}`,
    price: presentation.price,
    category: presentation.category,
  };
}

export function getCartItemImage(itemName: string) {
  return beerCatalog.find((beer) => itemName.startsWith(beer.name))?.image;
}

export function getCartItemPresentationId(itemId: string): BeerPresentationId | null {
  const directId = itemId.split(":")[1];
  if (presentationIds.includes(directId as BeerPresentationId)) {
    return directId as BeerPresentationId;
  }

  return presentationIds.find((id) => itemId.includes(id)) ?? null;
}

export function getCartItemLiters(itemId: string) {
  const presentationId = getCartItemPresentationId(itemId);
  if (!presentationId) return 0;
  return presentationDefinitions.find((presentation) => presentation.id === presentationId)?.liters ?? 0;
}
