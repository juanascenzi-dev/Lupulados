import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { Beer, BottleWine, Droplets, Gift, IceCreamBowl, Package, Search, ShoppingCart, SlidersHorizontal, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { SharedCheckoutPanel } from "@/components/commercial/SharedCheckoutPanel";
import { useCart } from "@/context/CartContext";
import { useCommercialData } from "@/context/CommercialDataContext";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import { createCommercialCartItem, normalizeCatalogQuantity } from "@/domain/productCatalog";
import {
  STORE_MAIN_CATEGORY_LABELS,
  buildStoreCatalog,
  filterStoreCatalog,
  getStoreResultLabel,
  listStorePresentationTypes,
  listStoreSubcategories,
  type StoreCatalogItem,
  type StoreMainCategory,
} from "@/domain/storeCatalog";
import type { ProductPresentation } from "@/domain/commercialTypes";

const mainCategories: StoreMainCategory[] = ["all", "beer", "alcohol", "non-alcohol", "combo", "accessory"];

function ProductVisual({ item }: { item: StoreCatalogItem }) {
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
      <Icon className="h-16 w-16 text-primary/85" aria-hidden="true" />
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
  const presentation = item.presentations.find((candidate) => candidate.id === presentationId) ?? item.presentations[0];
  const line = presentation ? createCommercialCartItem(item.product, presentation) : null;

  const updateQuantity = (next: number) => setQuantity(normalizeCatalogQuantity(next));

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
            {item.product.category === "beer" && (
              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                Producto Lupulados
              </span>
            )}
          </div>
          <h2 className="text-lg font-black leading-tight text-white">{item.product.name}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/58">{item.product.description}</p>
          {item.product.components && item.product.components.length > 0 && (
            <p className="mt-2 text-xs leading-relaxed text-white/45">Incluye: {item.product.components.join(", ")}.</p>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-white/55">Presentacion</span>
            <select
              value={presentation?.id ?? ""}
              onChange={(event) => setPresentationId(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-primary focus:outline-none"
            >
              {item.presentations.map((candidate: ProductPresentation) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Valor estimado</p>
              <p className="font-mono text-xl font-black text-primary">{formatPrice(presentation?.unitPrice ?? item.priceFrom)}</p>
            </div>
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
            onClick={() => {
              if (line) addItem(line, quantity);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        </div>
      </div>
    </article>
  );
}

export default function StorePage() {
  const { snapshot } = useCommercialData();
  const { totalItems } = useCart();
  const items = useMemo(() => buildStoreCatalog(snapshot), [snapshot]);
  const [query, setQuery] = useState("");
  const [mainCategory, setMainCategory] = useState<StoreMainCategory>("all");
  const [subcategory, setSubcategory] = useState("all");
  const [presentationType, setPresentationType] = useState("all");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutButtonRef = useRef<HTMLButtonElement | null>(null);

  const subcategories = useMemo(() => listStoreSubcategories(items, mainCategory), [items, mainCategory]);
  const presentationTypes = useMemo(() => listStorePresentationTypes(items), [items]);
  const filtered = useMemo(
    () => filterStoreCatalog(items, { query, mainCategory, subcategory, presentationType }),
    [items, query, mainCategory, subcategory, presentationType],
  );

  const clearFilters = () => {
    setQuery("");
    setMainCategory("all");
    setSubcategory("all");
    setPresentationType("all");
  };

  useEffect(() => {
    if (!checkoutOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setCheckoutOpen(false);
      checkoutButtonRef.current?.focus();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [checkoutOpen]);

  return (
    <div className="min-h-screen bg-background text-white">
      <a href="#tienda-contenido" className="skip-link">Saltar al catalogo</a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="font-display text-xl font-black text-white">Lupulados</Link>
          <nav className="flex items-center gap-2">
            <Link href="/" className="rounded-xl px-3 py-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white">Inicio</Link>
            <button ref={checkoutButtonRef} type="button" onClick={() => setCheckoutOpen(true)} className="relative rounded-xl bg-primary px-3 py-2 text-sm font-black text-black">
              Carrito
              {totalItems > 0 && <span className="ml-2 rounded-full bg-black px-1.5 py-0.5 text-[10px] text-primary">{totalItems}</span>}
            </button>
          </nav>
        </div>
      </header>

      <main id="tienda-contenido" className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
        <section className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">Tienda mockup V1</p>
            <h1 className="font-display text-4xl font-black leading-tight text-white sm:text-5xl">Presupuesta lo que necesitas</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/62">
              Revisa productos, elegi presentaciones y arma un pedido mixto. Al finalizar se prepara un mensaje de WhatsApp para coordinar detalles.
            </p>
          </div>
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-relaxed text-amber-100">
            Catalogo de demostracion. Los productos, precios y disponibilidad son ilustrativos y deben confirmarse por WhatsApp. Prohibida la venta de bebidas alcoholicas a menores de 18 anos. Beber con moderacion.
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <span className="sr-only">Buscar productos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre, estilo, tipo..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/35 pl-10 pr-3 text-white placeholder:text-white/35 focus:border-primary focus:outline-none"
              />
            </label>
            <label>
              <span className="sr-only">Subcategoria</span>
              <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white focus:border-primary focus:outline-none">
                <option value="all">Todas las subcategorias</option>
                {subcategories.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label>
              <span className="sr-only">Tipo o presentacion</span>
              <select value={presentationType} onChange={(event) => setPresentationType(event.target.value)} className="h-11 w-full rounded-xl border border-white/10 bg-black/35 px-3 text-white focus:border-primary focus:outline-none">
                <option value="all">Todas las presentaciones</option>
                {presentationTypes.map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {mainCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setMainCategory(category);
                  setSubcategory("all");
                }}
                className={cn(
                  "rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                  mainCategory === category ? "border-primary bg-primary text-black" : "border-white/10 bg-white/5 text-white/65 hover:border-primary/60",
                )}
              >
                {STORE_MAIN_CATEGORY_LABELS[category]}
              </button>
            ))}
            <button type="button" onClick={clearFilters} className="ml-auto flex items-center gap-1 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-white/55 hover:bg-white/10">
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Limpiar filtros
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/50" role="status">
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {getStoreResultLabel(filtered.length)}
          </p>
        </section>

        {filtered.length === 0 ? (
          <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-10 text-center">
            <h2 className="text-xl font-bold text-white">No encontramos productos con esos filtros</h2>
            <p className="mt-2 text-sm text-white/55">Proba limpiar filtros o buscar por otra palabra.</p>
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => <ProductCard key={item.product.id} item={item} />)}
          </section>
        )}
      </main>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Checkout">
          <div className="mx-auto flex max-h-[calc(100vh-1.5rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#101010] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h2 className="text-lg font-black text-white">Checkout</h2>
              <button type="button" onClick={() => {
                setCheckoutOpen(false);
                checkoutButtonRef.current?.focus();
              }} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar checkout">
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
