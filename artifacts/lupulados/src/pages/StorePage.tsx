import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Link } from "wouter";
import {
  Beer,
  BottleWine,
  Droplets,
  Gift,
  IceCreamBowl,
  Package,
  ShoppingCart,
  X,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { ConfigurableBeerPackBuilder } from "@/components/ConfigurableBeerPackBuilder";
import { SharedCheckoutPanel } from "@/components/commercial/SharedCheckoutPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoreFilterBar } from "@/components/store/StoreFilterBar";
import { useCart } from "@/context/CartContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import { useEscapeToClose } from "@/hooks/useEscapeToClose";
import { formatPrice } from "@/domain/format";
import { buildBeerCatalog } from "@/domain/commercialAdapters";
import {
  CONFIGURABLE_BEER_PACK_CAPACITY,
  listPackAvailableProducts,
} from "@/domain/configurableBeerPack";
import { createCommercialCartItem, normalizeCatalogQuantity } from "@/domain/productCatalog";
import {
  buildStoreCatalogWithDemo,
  filterStoreCatalog,
  getActiveStoreFilterCount,
  getHumanPresentationLabel,
  getStoreImageSource,
  listStorePresentationOptions,
  listStoreSubcategories,
  sortStoreCatalog,
  type StoreCatalogItem,
  type StoreMainCategory,
  type StorePriceRange,
  type StoreSortOption,
} from "@/domain/storeCatalog";
import {
  buildPresentationComparison,
  getProductMaxSavings,
  hasPromotion,
  hasVolumeSavings,
} from "@/domain/storePricing";
import { getSavingsCopy } from "@/domain/storePageFormatting";
import type { ProductPresentation } from "@/domain/commercialTypes";

function ProductVisual({ item }: { item: StoreCatalogItem }) {
  const imageSource = getStoreImageSource(item.product);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const showImage = Boolean(imageSource && failedSource !== imageSource);
  const Icon =
    item.mainCategory === "beer"
      ? Beer
      : item.mainCategory === "alcohol"
        ? BottleWine
        : item.mainCategory === "non-alcohol"
          ? item.product.category === "ice"
            ? IceCreamBowl
            : Droplets
          : item.mainCategory === "combo"
            ? Gift
            : Package;

  return (
    <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.22),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
      {showImage ? (
        <img
          src={imageSource ?? ""}
          alt={`Imagen de ${item.product.name}`}
          className="h-full w-full object-cover"
          loading="lazy"
          onError={() => setFailedSource(imageSource)}
        />
      ) : (
        <Icon className="h-16 w-16 text-primary/85" aria-hidden="true" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
      <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75">
        {item.subcategory}
      </span>
    </div>
  );
}

function ProductCard({ item }: { item: StoreCatalogItem }) {
  const { addItem } = useCart();
  const [presentationId, setPresentationId] = useState(item.presentations[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ key: number; text: string } | null>(null);
  const presentation =
    item.presentations.find((candidate) => candidate.id === presentationId) ??
    item.presentations[0];
  const line = presentation ? createCommercialCartItem(item.product, presentation) : null;
  const comparison = presentation
    ? buildPresentationComparison(presentation, item.presentations)
    : null;
  const savingsCopy = getSavingsCopy(comparison);
  const promotionActive = presentation?.promotional === true;
  const promotionSavings = comparison?.hasPromotionalSavings ? comparison.promotionalSavings : 0;

  const updateQuantity = (next: number) => setQuantity(normalizeCatalogQuantity(next));

  useEffect(() => {
    setFeedback(null);
  }, [presentationId]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleAdd = () => {
    if (!line || !presentation) return;
    addItem(line, quantity);
    const prefix = quantity > 1 ? `${quantity} ` : "";
    setFeedback({
      key: Date.now(),
      text: `Agregaste ${prefix}${item.product.name} ${getHumanPresentationLabel(presentation)} al carrito.`,
    });
  };

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] shadow-lg shadow-black/20">
      <ProductVisual item={item} />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {item.isDemo && (
              <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-200">
                Precio demo
              </span>
            )}
            {hasPromotion(item.presentations) && (
              <span className="rounded-full border border-amber-300/35 bg-amber-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-100">
                Promo demo
              </span>
            )}
            {hasVolumeSavings(item.presentations) && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/70">
                Ahorro por volumen
              </span>
            )}
            {item.product.category === "beer" && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Producto Lupulados
              </span>
            )}
          </div>
          <h2 className="text-lg font-black leading-tight text-white">{item.product.name}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/58">
            {item.product.description}
          </p>
          {item.product.components && item.product.components.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-white/45">
              Incluye: {item.product.components.join(", ")}.
            </p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/55">
              Presentación
            </span>
            <Select value={presentation?.id ?? ""} onValueChange={setPresentationId}>
              <SelectTrigger className="h-11 rounded-xl border-white/10 bg-black/40 px-3 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary">
                <SelectValue
                  aria-label={presentation ? getHumanPresentationLabel(presentation) : undefined}
                />
              </SelectTrigger>
              <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
                {item.presentations.map((candidate: ProductPresentation) => (
                  <SelectItem
                    key={candidate.id}
                    value={candidate.id}
                    className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                  >
                    {getHumanPresentationLabel(candidate)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="min-h-[104px] rounded-xl border border-white/10 bg-black/25 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {promotionActive ? "Precio promo demo" : "Valor estimado"}
                </p>
                {promotionActive && presentation?.compareAtPrice && promotionSavings > 0 && (
                  <p className="font-mono text-xs font-bold text-white/35 line-through">
                    {formatPrice(presentation.compareAtPrice)}
                  </p>
                )}
                <p className="font-mono text-xl font-black text-primary">
                  {formatPrice(presentation?.unitPrice ?? item.priceFrom)}
                </p>
              </div>
              {promotionActive && (
                <span className="shrink-0 rounded-full border border-amber-300/30 bg-amber-400/15 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-amber-100">
                  {presentation?.promotionLabel ?? "Promo demo"}
                </span>
              )}
            </div>
            {comparison && (
              <div className="mt-2 space-y-1 text-xs leading-relaxed text-white/58">
                <p>
                  {formatPrice(comparison.effectiveUnitPrice)} por {comparison.unitLabel}
                </p>
                {comparison.referenceCost && comparison.hasSavings && (
                  <p className="text-white/45">
                    Referencia: {formatPrice(comparison.referenceCost)}
                  </p>
                )}
                {comparison.bestValueLabel && (
                  <p className="font-bold text-amber-100">{comparison.bestValueLabel}</p>
                )}
                {savingsCopy && <p className="font-bold text-green-200">{savingsCopy}</p>}
              </div>
            )}
          </div>
          <div className="flex items-center justify-end gap-3">
            <label className="w-24">
              <span className="sr-only">Cantidad</span>
              <input
                type="number"
                min={1}
                max={999}
                value={quantity}
                onChange={(event) => updateQuantity(Number(event.target.value))}
                className="h-11 w-full rounded-xl border border-white/10 bg-black/40 px-2 text-center font-bold text-white focus:border-primary focus:outline-none"
              />
            </label>
          </div>
          <button
            type="button"
            disabled={!line}
            onClick={handleAdd}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            {feedback ? "Agregado" : "Agregar"}
          </button>
          <p
            key={feedback?.key ?? "empty"}
            className="min-h-5 text-xs font-bold text-green-300 motion-safe:animate-in motion-safe:fade-in"
            role="status"
            aria-live="polite"
          >
            {feedback?.text ?? ""}
          </p>
        </div>
      </div>
    </article>
  );
}

function ConfigurablePackStoreCard({
  onCustomize,
  buttonRef,
}: {
  onCustomize: () => void;
  buttonRef: RefObject<HTMLButtonElement | null>;
}) {
  const { snapshot } = useCommercialData();
  const beers = useMemo(() => buildBeerCatalog(snapshot), [snapshot]);
  const products = useMemo(() => listPackAvailableProducts(beers), [beers]);
  const [failedImage, setFailedImage] = useState(false);
  const minBottlePrice =
    products.length > 0 ? Math.min(...products.map((product) => product.price)) : 0;
  const priceFrom = minBottlePrice * CONFIGURABLE_BEER_PACK_CAPACITY;
  const image = beers.find((beer) =>
    beer.presentations.some((presentation) => presentation.id === "porron500ml"),
  )?.image;

  return (
    <article className="flex min-h-full flex-col overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.08] shadow-lg shadow-black/20">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.22),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
        {image && !failedImage ? (
          <img
            src={image}
            alt="Pack de porrones configurables"
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setFailedImage(true)}
          />
        ) : (
          <Beer className="h-16 w-16 text-primary/85" aria-hidden="true" />
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white/75">
          Packs
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-primary/35 bg-primary/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-primary">
              Configurable
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
              Producto Lupulados
            </span>
          </div>
          <h2 className="text-lg font-black leading-tight text-white">Pack de porrones x6</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/58">
            Arma uno o varios packs de 6 porrones combinando estilos disponibles.
          </p>
        </div>
        <div className="mt-auto space-y-3">
          <div className="min-h-[104px] rounded-xl border border-white/10 bg-black/25 p-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
              Precio estimado desde
            </p>
            <p className="font-mono text-xl font-black text-primary">
              {priceFrom > 0 ? formatPrice(priceFrom) : "No disponible"}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-white/58">
              El precio final suma los 6 porrones elegidos segun el precio activo de cada estilo.
            </p>
          </div>
          <button
            ref={buttonRef}
            type="button"
            disabled={products.length === 0}
            onClick={onCustomize}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Personalizar pack
          </button>
        </div>
      </div>
    </article>
  );
}

export default function StorePage() {
  const { snapshot } = useCommercialData();
  const { totalItems, addItem } = useCart();
  const beers = useMemo(() => buildBeerCatalog(snapshot), [snapshot]);
  const items = useMemo(() => buildStoreCatalogWithDemo(snapshot), [snapshot]);
  const [query, setQuery] = useState("");
  const [mainCategory, setMainCategory] = useState<StoreMainCategory>("all");
  const [subcategory, setSubcategory] = useState("all");
  const [presentationType, setPresentationType] = useState("all");
  const [sortBy, setSortBy] = useState<StoreSortOption>("recommended");
  const [onlyPromotions, setOnlyPromotions] = useState(false);
  const [onlyVolumeSavings, setOnlyVolumeSavings] = useState(false);
  const [priceRange, setPriceRange] = useState<StorePriceRange>("all");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [packBuilderOpen, setPackBuilderOpen] = useState(false);
  const checkoutButtonRef = useRef<HTMLButtonElement | null>(null);
  const packBuilderButtonRef = useRef<HTMLButtonElement | null>(null);

  const subcategories = useMemo(
    () => listStoreSubcategories(items, mainCategory),
    [items, mainCategory],
  );
  const presentationOptions = useMemo(() => listStorePresentationOptions(items), [items]);
  const filters = useMemo(
    () => ({
      query,
      mainCategory,
      subcategory,
      presentationType,
      onlyPromotions,
      onlyVolumeSavings,
      priceRange,
    }),
    [
      query,
      mainCategory,
      subcategory,
      presentationType,
      onlyPromotions,
      onlyVolumeSavings,
      priceRange,
    ],
  );
  const filtered = useMemo(
    () => sortStoreCatalog(filterStoreCatalog(items, filters), sortBy),
    [items, filters, sortBy],
  );
  const activeFilterCount = getActiveStoreFilterCount(filters);

  const clearFilters = () => {
    setQuery("");
    setMainCategory("all");
    setSubcategory("all");
    setPresentationType("all");
    setOnlyPromotions(false);
    setOnlyVolumeSavings(false);
    setPriceRange("all");
  };

  useEscapeToClose(checkoutOpen, () => setCheckoutOpen(false), checkoutButtonRef);
  useEscapeToClose(packBuilderOpen, () => setPackBuilderOpen(false), packBuilderButtonRef);

  return (
    <div className="min-h-screen bg-background text-white">
      <a href="#tienda-contenido" className="skip-link">
        Saltar al catálogo
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-black text-white">
            Lupulados
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-xl px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white"
            >
              Inicio
            </Link>
            <button
              ref={checkoutButtonRef}
              type="button"
              onClick={() => setCheckoutOpen(true)}
              className="relative rounded-xl bg-primary px-3 py-2 text-sm font-black text-black"
            >
              Carrito
              {totalItems > 0 && (
                <span className="ml-2 rounded-full bg-black px-1.5 py-0.5 text-[10px] text-primary">
                  {totalItems}
                </span>
              )}
            </button>
          </nav>
        </div>
      </header>

      <main id="tienda-contenido" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              Tienda mockup V1
            </p>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl">
              Presupuestá lo que necesitás
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/62">
              Revisá productos, elegí presentaciones y armá un pedido mixto. Al finalizar se prepara
              un mensaje de WhatsApp para coordinar detalles.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
            Catálogo de demostración. Los productos, precios y disponibilidad son ilustrativos y
            deben confirmarse por WhatsApp. Prohibida la venta de bebidas alcohólicas a menores de
            18 años. Beber con moderación.
          </div>
        </section>

        <StoreFilterBar
          query={query}
          onQueryChange={setQuery}
          subcategory={subcategory}
          onSubcategoryChange={setSubcategory}
          subcategories={subcategories}
          presentationType={presentationType}
          onPresentationTypeChange={setPresentationType}
          presentationOptions={presentationOptions}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          mainCategory={mainCategory}
          onMainCategoryChange={(category) => {
            setMainCategory(category);
            setSubcategory("all");
          }}
          onlyPromotions={onlyPromotions}
          onToggleOnlyPromotions={() => setOnlyPromotions((value) => !value)}
          onlyVolumeSavings={onlyVolumeSavings}
          onToggleOnlyVolumeSavings={() => setOnlyVolumeSavings((value) => !value)}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearFilters}
          resultCount={filtered.length}
        />

        {filtered.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
            <h2 className="text-xl font-bold text-white">
              No encontramos productos con esos filtros
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Proba limpiar filtros o buscar por otra palabra.
            </p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ConfigurablePackStoreCard
              buttonRef={packBuilderButtonRef}
              onCustomize={() => setPackBuilderOpen(true)}
            />
            {filtered.map((item) => (
              <ProductCard key={item.product.id} item={item} />
            ))}
          </section>
        )}
      </main>

      {packBuilderOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Configurar pack de porrones"
        >
          <div className="mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-black text-white">Pack de porrones</h2>
              <button
                type="button"
                onClick={() => {
                  setPackBuilderOpen(false);
                  packBuilderButtonRef.current?.focus();
                }}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar configurador de pack"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <ConfigurableBeerPackBuilder
                beers={beers}
                onAddPacks={(lines) => {
                  lines.forEach((line) => addItem(line.item, line.qty));
                  setPackBuilderOpen(false);
                  packBuilderButtonRef.current?.focus();
                }}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
        >
          <div className="mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-black text-white">Checkout</h2>
              <button
                type="button"
                onClick={() => {
                  setCheckoutOpen(false);
                  checkoutButtonRef.current?.focus();
                }}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
                aria-label="Cerrar checkout"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <SharedCheckoutPanel demoNotice />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
