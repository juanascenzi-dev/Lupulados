import { validateCommercialSnapshot } from "./commercialSchemas";
import type {
  CommercialSnapshot,
  DeliveryOption,
  ExtraOption,
  Product,
  ProductPresentation,
} from "./commercialTypes";
import { demoStorePresentations, demoStoreProducts } from "./demoStoreCatalog";

const presentationDefinitions: Omit<ProductPresentation, "id" | "productId" | "unitPrice">[] = [
  {
    presentationType: "barril20L",
    label: "Barril 20L",
    category: "barril",
    volumeLiters: 20,
    description: "Aprox 40 pintas · hasta 50 personas",
    active: true,
    sortOrder: 10,
  },
  {
    presentationType: "barril30L",
    label: "Barril 30L",
    category: "barril",
    volumeLiters: 30,
    description: "Aprox 60 pintas · hasta 80 personas",
    active: true,
    sortOrder: 20,
  },
  {
    presentationType: "barril50L",
    label: "Barril 50L",
    category: "barril",
    volumeLiters: 50,
    description: "Aprox 100 pintas · +100 personas",
    active: true,
    sortOrder: 30,
  },
  { presentationType: "growler1L", label: "Growler 1L", category: "growler", volumeLiters: 1, active: true, sortOrder: 40 },
  { presentationType: "growler2L", label: "Growler 2L", category: "growler", volumeLiters: 2, active: true, sortOrder: 50 },
  { presentationType: "porron500ml", label: "Porrón 500ml", category: "porrón", volumeLiters: 0.5, active: true, sortOrder: 60 },
];

const productsWithPrices = [
  {
    product: {
      id: "blonde-ale",
      slug: "blonde-ale",
      name: "Blonde Ale",
      description: "Suave, refrescante, ideal para los que arrancan en la artesanal.",
      style: "Blonde Ale",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 4.8,
      ibu: 15,
      badge: "Suave",
      image: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 10,
    },
    prices: [38000, 54000, 85000, 3200, 5800, 1800],
  },
  {
    product: {
      id: "apa",
      slug: "apa",
      name: "American Pale Ale (APA)",
      description: "Cítrica y lupulada, con amargor presente y final fácil.",
      style: "American Pale Ale",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 5.2,
      ibu: 35,
      badge: "Cítrica",
      image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 20,
    },
    prices: [42000, 60000, 95000, 3600, 6500, 2000],
  },
  {
    product: {
      id: "ipa",
      slug: "ipa",
      name: "IPA",
      description: "Intensa, aromática, para los que les gusta el lúpulo.",
      style: "IPA",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 6.5,
      ibu: 55,
      badge: "Lupulada",
      image: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 30,
    },
    prices: [46000, 66000, 105000, 4000, 7200, 2200],
  },
  {
    product: {
      id: "red-ale",
      slug: "red-ale",
      name: "Red Ale / Amber",
      description: "Maltosa, caramelo, equilibrada.",
      style: "Red Ale / Amber",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 5,
      ibu: 25,
      badge: "Maltosa",
      image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 40,
    },
    prices: [40000, 57000, 90000, 3400, 6200, 1900],
  },
  {
    product: {
      id: "stout",
      slug: "stout",
      name: "Stout",
      description: "Oscura, con notas de café y chocolate.",
      style: "Stout",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 5.8,
      ibu: 30,
      badge: "Oscura",
      image: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 50,
    },
    prices: [44000, 63000, 100000, 3800, 6800, 2100],
  },
  {
    product: {
      id: "honey-wheat",
      slug: "honey-wheat",
      name: "Honey / Wheat",
      description: "Dulce, suave y fácil de tomar.",
      style: "Honey / Wheat",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 4.5,
      ibu: 12,
      badge: "Suave",
      image: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 60,
    },
    prices: [40000, 57000, 90000, 3400, 6200, 1900],
  },
  {
    product: {
      id: "session-ipa",
      slug: "session-ipa",
      name: "Session IPA",
      description: "Lupulada pero liviana, para tomar toda la noche.",
      style: "Session IPA",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 4.2,
      ibu: 40,
      badge: "Liviana",
      image: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 70,
    },
    prices: [42000, 60000, 95000, 3600, 6500, 2000],
  },
  {
    product: {
      id: "scotch-ale",
      slug: "scotch-ale",
      name: "Scotch Ale",
      description: "Fuerte, maltosa y de cuerpo pleno.",
      style: "Scotch Ale",
      category: "beer",
      mainCategory: "beer",
      subcategory: "Barriles, growlers y porrones",
      demo: false,
      abv: 7.5,
      ibu: 20,
      badge: "Intensa",
      image: "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop",
      status: "active",
      sortOrder: 80,
    },
    prices: [48000, 69000, 110000, 4400, 7800, 2400],
  },
] satisfies { product: Product; prices: number[] }[];

const products = [...productsWithPrices.map(({ product }) => product), ...demoStoreProducts];

const productPresentations = [
  ...productsWithPrices.flatMap(({ product, prices }) =>
    presentationDefinitions.map((presentation, index) => ({
      ...presentation,
      ...getBeerPresentationCommercialFields(presentation.presentationType, presentation.volumeLiters),
      id: `${product.id}:${presentation.presentationType}`,
      productId: product.id,
      unitPrice: prices[index],
    })),
  ),
  ...demoStorePresentations,
];

function getBeerPresentationCommercialFields(
  presentationType: ProductPresentation["presentationType"],
  volumeLiters: number,
): Partial<ProductPresentation> {
  if (String(presentationType).startsWith("barril")) {
    return {
      comparisonGroup: "beer-barrel",
      comparisonQuantity: volumeLiters,
      comparisonUnit: "litro",
    };
  }

  if (String(presentationType).startsWith("growler")) {
    return {
      comparisonGroup: "beer-growler",
      comparisonQuantity: volumeLiters,
      comparisonUnit: "litro",
    };
  }

  if (presentationType === "porron500ml") {
    return {
      comparisonGroup: "beer-porron",
      comparisonQuantity: 1,
      comparisonUnit: "botella",
      unitsPerPresentation: 1,
    };
  }

  return {};
}

const deliveryOptions: DeliveryOption[] = [
  {
    id: "fabrica",
    label: "Retiro en fábrica",
    description: "Coordinamos punto y horario · Gratis",
    price: 0,
    requiresAddress: false,
    active: true,
    sortOrder: 10,
  },
  {
    id: "norte",
    label: "Zona Norte GBA",
    description: "Zona Norte GBA",
    price: 8000,
    requiresAddress: true,
    active: true,
    sortOrder: 20,
  },
  {
    id: "caba",
    label: "CABA / Zona Sur",
    description: "CABA / Zona Sur",
    price: 12000,
    requiresAddress: true,
    active: true,
    sortOrder: 30,
  },
];

const extraOptions: ExtraOption[] = [
  { id: "chopera", label: "Alquiler de chopera", price: 15000, unit: "unidad", active: true, sortOrder: 10 },
  { id: "hielo", label: "Hielo", price: 3000, unit: "bolsa", active: true, sortOrder: 20 },
  { id: "vasos", label: "Vasos", price: 800, unit: "unidad", active: true, sortOrder: 30 },
];

export const commercialSnapshot = validateCommercialSnapshot({
  businessProfile: {
    id: "lupulados-public-profile",
    businessName: "Lupulados",
    address: "Primera Junta 2614",
    openingHours: "Atención las 24 horas, todos los días.",
    email: null,
    pricingStatus: "estimated",
    priceDisclaimer: "Los precios son estimativos y están sujetos a confirmación.",
    active: true,
  },
  whatsappChannels: [
    {
      id: "whatsapp-principal",
      label: "WhatsApp principal",
      phoneDisplay: "11 3397-1210",
      phoneE164: "5491133971210",
      purpose: "orders_and_contact",
      isPrimary: true,
      active: true,
      sortOrder: 10,
    },
    {
      id: "whatsapp-alternativo",
      label: "WhatsApp alternativo",
      phoneDisplay: "11 6546-0294",
      phoneE164: "5491165460294",
      purpose: "contact",
      isPrimary: false,
      active: true,
      sortOrder: 20,
    },
  ],
  products,
  productPresentations,
  deliveryOptions,
  extraOptions,
  promotions: [
    {
      id: "primerabirra",
      code: "PRIMERABIRRA",
      type: "percentage",
      value: 0.1,
      active: true,
    },
  ],
  pricingRules: {
    freeGlassesThreshold: 80000,
  },
} satisfies CommercialSnapshot);
