import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useCart } from "@/context/CartContext";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Calendar,
  MapPin,
  User,
  Clock,
  Beer,
  Gift,
  Truck,
  Store,
  Tag,
  X,
  ChevronUp,
  ChevronDown,
  Edit,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  barrelPresentationIds,
  createBeerCartItem,
  getBeerPresentation,
  getCartItemImage,
  growlerPresentationIds,
  tastingPack,
  type Beer as CatalogBeer,
} from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "@/domain/whatsAppOrder";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import {
  buildRecommendedBarrelItems,
  hasCurrentSelectionInCart,
  type OrderType,
} from "@/domain/orderFlow";
import { getOrderWizardValidationMessage } from "@/domain/orderWizardValidation";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import { getGuardedActivationState } from "@/domain/activationGuard";
import { WhatsAppChannelSelector } from "@/components/commercial/WhatsAppChannelSelector";
import { ConfigurableBeerPackBuilder } from "@/components/ConfigurableBeerPackBuilder";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDefaultWhatsAppChannelId, listOrderWhatsAppChannels } from "@/domain/checkout";
import {
  createCommercialCartItem,
  listCatalogProductsByCategory,
  listVisibleCatalogCategories,
  normalizeCatalogQuantity,
  PRODUCT_CATEGORY_LABELS,
  shouldShowCategorySelector,
  type CatalogProductOption,
} from "@/domain/productCatalog";
import type { ProductCategory, ProductPresentation } from "@/domain/commercialTypes";

type Step = 1 | 2 | 3 | 4 | 5;

interface ArmaTuPedidoProps {
  pendingRecommendation: BarrelRecommendation | null;
  sectionRef: RefObject<HTMLElement | null>;
}

const PHASE_LABELS = ["Productos", "Datos", "Confirmacion"];
const STEP_LABELS = ["Productos", "Productos", "Productos", "Datos", "Confirmacion"];
const WHATSAPP_ACTIVATION_GUARD_MS = 1500;
const QUICK_ORDER_CATEGORIES: ProductCategory[] = [
  "beer",
  "wine",
  "fernet",
  "gin",
  "whisky",
  "mixer",
  "soft-drink",
  "pack",
  "accessory",
];
const CONFIGURABLE_PACK_ORDER_TYPE: Exclude<OrderType, null> = "porr\u00f3n";

function OrderTypeVisual({
  option,
  selected,
}: {
  option: { img: string; title: string; emoji: string };
  selected: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative h-28 md:h-32 overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.22),transparent_36%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]">
      {!failed && option.img ? (
        <img
          src={option.img}
          alt={`Imagen de ${option.title}`}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            selected ? "brightness-75" : "brightness-50 group-hover:brightness-[0.65]",
          )}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-4xl" aria-hidden="true">
          {option.emoji}
        </div>
      )}
      <div className={cn("absolute inset-0", selected ? "bg-amber-500/10" : "bg-black/20")} />
    </div>
  );
}

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 8 + Math.random() * 18,
  left: 5 + Math.random() * 90,
  delay: Math.random() * 8,
  duration: 5 + Math.random() * 6,
}));

function BeerGlass({ state, label }: { state: "done" | "active" | "future"; label: string }) {
  const hasBeer = state !== "future";
  const fillH = state === "done" ? "88%" : state === "active" ? "58%" : "0%";
  const borderColor = hasBeer ? "border-amber-500" : "border-white/15";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className={cn(
          "relative w-8 h-12 border-2 rounded-b-md overflow-hidden bg-transparent transition-colors duration-500",
          borderColor,
        )}
      >
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-amber-500"
          initial={{ height: 0 }}
          animate={{ height: fillH }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {hasBeer && (
          <motion.div
            className="absolute left-0 right-0 h-2.5 bg-white/90"
            style={{ borderRadius: "50% 50% 0 0 / 80% 80% 0 0" }}
            initial={{ opacity: 0, bottom: "0%" }}
            animate={{ opacity: 1, bottom: state === "done" ? "84%" : "53%" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        )}
        {state === "done" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
        {state === "active" && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span
        className={cn(
          "hidden md:block text-[9px] font-bold uppercase tracking-widest w-max text-center",
          hasBeer ? "text-amber-400" : "text-white/25",
        )}
      >
        {label}
      </span>
    </div>
  );
}

function BeerGlassStepper({ step }: { step: Step }) {
  const phase = step <= 3 ? 1 : step === 4 ? 2 : 3;
  const progress = ((phase - 1) / 2) * 100;
  return (
    <div className="w-full">
      <div className="hidden md:flex justify-between items-end relative mx-auto max-w-md lg:max-w-sm xl:max-w-md">
        <div className="absolute left-4 right-4 h-0.5 bg-white/10 bottom-7 z-0" />
        <motion.div
          className="absolute left-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 bottom-7 z-0"
          initial={{ width: 0 }}
          animate={{ width: `calc(${progress}% - 0px)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {([1, 2, 3] as const).map((i) => (
          <div key={i} className="relative z-10">
            <BeerGlass
              state={phase > i ? "done" : phase === i ? "active" : "future"}
              label={PHASE_LABELS[i - 1]}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{["🛢️", "🍺", "📏", "✨", "🎟️"][step - 1]}</span>
          <div>
            <p className="text-white font-bold text-sm">
              Paso {step} de 5 — {STEP_LABELS[step - 1]}
            </p>
          </div>
        </div>
        <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

function getCartLineTitle(item: {
  category: string;
  productName?: string;
  beerName?: string;
  name: string;
}) {
  if (item.category === "pack") return item.productName ?? item.name;
  return item.productName ?? item.beerName ?? item.name;
}

function getCartLineBeer(item: {
  category: string;
  productCategory?: string;
  beerName?: string;
  productName?: string;
  variantLabel?: string;
  name: string;
}) {
  if (
    item.productCategory &&
    item.productCategory !== "beer" &&
    item.productCategory in PRODUCT_CATEGORY_LABELS
  ) {
    return item.variantLabel && item.variantLabel !== item.productName
      ? item.variantLabel
      : PRODUCT_CATEGORY_LABELS[item.productCategory as keyof typeof PRODUCT_CATEGORY_LABELS];
  }
  if (item.category === "pack") return null;
  return item.beerName ?? item.productName ?? item.name.split("—")[0]?.trim() ?? item.name;
}

function getCartLinePresentation(item: { presentationLabel?: string; name: string }) {
  return item.presentationLabel ?? item.name.split("—")[1]?.trim() ?? null;
}

function getCompactCartLineDescription(item: {
  category: string;
  productCategory?: string;
  pack?: { type: string; capacity: number; composition: Array<{ productId: string }> };
  presentationLabel?: string;
  variantLabel?: string;
  qty: number;
  name: string;
}) {
  if (item.pack?.type === "configurable-beer-pack") {
    const styleCount = new Set(item.pack.composition.map((selection) => selection.productId)).size;
    return `${item.qty * item.pack.capacity} porrones · ${styleCount} ${styleCount === 1 ? "estilo" : "estilos"}`;
  }
  if (item.category === "pack") return "6 estilos surtidos";
  if (item.presentationLabel) return item.presentationLabel;
  if (item.variantLabel) return item.variantLabel;
  return getCartLinePresentation(item) ?? item.category;
}

function ProductImageFallback({ className = "w-full h-full" }: { className?: string }) {
  return (
    <div className={cn(className, "bg-primary/15 flex items-center justify-center")}>
      <Beer className="w-7 h-7 text-primary" aria-hidden="true" />
    </div>
  );
}

function getPresentationDetails(presentation: ProductPresentation) {
  return [
    presentation.description,
    presentation.volumeLiters > 0 ? `${presentation.volumeLiters} L` : null,
    presentation.presentationType && presentation.presentationType !== presentation.label
      ? presentation.presentationType
      : null,
  ].filter((part): part is string => Boolean(part));
}

function CategorySelector({
  categories,
  selectedCategory,
  onSelect,
}: {
  categories: ReturnType<typeof listVisibleCatalogCategories>;
  selectedCategory: ProductCategory;
  onSelect: (category: ProductCategory) => void;
}) {
  if (!shouldShowCategorySelector(categories)) return null;

  const selectedIndex = Math.max(
    0,
    categories.findIndex((category) => category.id === selectedCategory),
  );

  const focusTab = (index: number) => {
    const tab = document.getElementById(`order-category-${categories[index]?.id}`);
    tab?.focus();
  };

  return (
    <div className="mb-6" role="tablist" aria-label="Categorias de productos">
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((category) => {
          const selected = category.id === selectedCategory;
          return (
            <button
              key={category.id}
              id={`order-category-${category.id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(category.id)}
              onKeyDown={(event) => {
                if (
                  event.key !== "ArrowRight" &&
                  event.key !== "ArrowLeft" &&
                  event.key !== "Home" &&
                  event.key !== "End"
                )
                  return;
                event.preventDefault();
                const nextIndex =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? categories.length - 1
                      : event.key === "ArrowRight"
                        ? (selectedIndex + 1) % categories.length
                        : (selectedIndex - 1 + categories.length) % categories.length;
                onSelect(categories[nextIndex].id);
                window.requestAnimationFrame(() => focusTab(nextIndex));
              }}
              className={cn(
                "min-h-11 rounded-xl px-4 py-2 text-sm font-bold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                selected
                  ? "bg-primary text-black border-primary"
                  : "bg-white/5 text-white/75 border-white/10 hover:border-primary/60 hover:text-white",
              )}
            >
              {category.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductSelector({
  products,
  selectedProductId,
  onSelect,
}: {
  products: CatalogProductOption[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white font-bold">No hay productos disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">
          Elegí otra categoría o intentá nuevamente más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {products.map(({ product, variantLabel, priceFrom }) => {
        const selected = selectedProductId === product.id;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product.id)}
            aria-pressed={selected}
            className={cn(
              "group text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
              selected
                ? "border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
                : "border-transparent bg-white/5 hover:border-amber-500/40",
            )}
          >
            <div className="relative h-28 overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <ProductImageFallback />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              {selected && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </div>
            <div
              className={cn("p-3 transition-colors", selected ? "bg-amber-500/10" : "bg-white/5")}
            >
              <h4
                className={cn(
                  "font-bold text-sm mb-1 leading-tight",
                  selected ? "text-amber-300" : "text-white",
                )}
              >
                {product.name}
              </h4>
              {variantLabel && variantLabel !== product.name && (
                <p className="text-xs text-white/65 mb-1">{variantLabel}</p>
              )}
              {product.description && (
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mb-2">
                  {product.description}
                </p>
              )}
              <p className="text-primary font-mono text-xs font-bold">
                Desde {formatPrice(priceFrom)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function PresentationSelector({
  product,
  selectedPresentationId,
  onSelect,
}: {
  product: CatalogProductOption;
  selectedPresentationId: string;
  onSelect: (presentationId: string) => void;
}) {
  return (
    <div className="grid gap-3">
      {product.presentations.map((presentation) => {
        const selected = selectedPresentationId === presentation.id;
        const details = getPresentationDetails(presentation);
        return (
          <button
            key={presentation.id}
            type="button"
            onClick={() => onSelect(presentation.id)}
            aria-pressed={selected}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-white/5 hover:border-primary/60",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-bold">{presentation.label}</p>
                {details.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{details.join(" · ")}</p>
                )}
              </div>
              <p className="text-primary font-mono font-bold shrink-0">
                {formatPrice(presentation.unitPrice)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function LiveOrderSummary({
  onClose,
  asDrawer = false,
  detailed = false,
}: {
  onClose?: () => void;
  asDrawer?: boolean;
  detailed?: boolean;
}) {
  const { items, removeItem, updateQty, totalPrice, totalItems, extras, orderSummary, clearCart } =
    useCart();
  const { snapshot, deliveryOptions, priceDisclaimer } = useCommercialDerivedData();
  const deliveryCost = deliveryOptions.find((option) => option.id === extras.delivery)?.cost ?? 0;
  const totalLiters = orderSummary.totalLiters;

  return (
    <div className={cn("flex h-full min-h-0 flex-col", asDrawer ? "max-h-[65dvh]" : "")}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-white text-lg">Tu pedido</h3>
          {totalItems > 0 && (
            <span className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </div>
        {asDrawer && onClose && (
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="p-1 text-white/50 hover:text-white"
            aria-label="Cerrar carrito"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1",
          items.length > 0 ? "space-y-2" : "",
        )}
      >
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-5xl mb-4">🍺</span>
            <p className="text-white/60 text-sm font-medium">Tu carrito está vacío</p>
            <p className="text-white/30 text-xs mt-1">¡Empezá a elegir tus cervezas!</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => {
              const beerImg =
                snapshot.products.find((product) => product.id === item.productId)?.image ||
                getCartItemImage(item.name);
              const lineTitle = getCartLineTitle(item);
              const lineDescription = getCompactCartLineDescription(item);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-2.5"
                >
                  {beerImg ? (
                    <img
                      src={beerImg}
                      alt={item.name}
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20">
                      <Beer className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 text-sm font-bold leading-tight text-white">
                      {lineTitle}
                    </p>
                    {lineDescription && (
                      <p className="truncate text-xs text-white/50">{lineDescription}</p>
                    )}
                    {detailed && item.pack?.type === "configurable-beer-pack" && (
                      <div className="mt-2 space-y-0.5 rounded-lg border border-white/10 bg-black/20 p-2 text-[11px] text-white/60">
                        {item.pack.composition.map((selection) => (
                          <p key={selection.productId}>
                            {selection.quantity} {selection.name ?? "Estilo"}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="mt-1 flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label={`Restar una unidad de ${item.name}`}
                        onClick={() => updateQty(item.id, item.qty - 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Minus className="w-3 h-3" aria-hidden="true" />
                      </button>
                      <input
                        aria-label={`Cantidad de ${item.name}`}
                        type="number"
                        min={1}
                        max={999}
                        step={1}
                        value={item.qty}
                        onChange={(event) => updateQty(item.id, Number(event.target.value))}
                        className="h-10 w-11 rounded-lg bg-transparent text-center text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        aria-label={`Sumar una unidad de ${item.name}`}
                        onClick={() => updateQty(item.id, item.qty + 1)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Plus className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-right text-xs font-bold text-white">
                      {formatPrice(item.price * item.qty)}
                    </span>
                    <button
                      type="button"
                      aria-label={`Eliminar ${item.name} del carrito`}
                      onClick={() => removeItem(item.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-3 shrink-0 space-y-2 border-t border-white/10 pt-3">
          {totalLiters > 0 && (
            <p className="text-xs text-amber-400 font-bold">🍺 {totalLiters}L en barriles</p>
          )}
          {deliveryCost > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery</span>
              <span>{formatPrice(deliveryCost)}</span>
            </div>
          )}
          {extras.discount > 0 && (
            <div className="flex justify-between text-xs text-green-400 font-bold">
              <span>Descuento ({extras.promoCode})</span>
              <span>-10%</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white">
            <span>Total estimado</span>
            <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
          </div>
          <p className="text-[11px] text-white/35 leading-snug">{priceDisclaimer}</p>
          <button
            type="button"
            onClick={clearCart}
            className="mt-1 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-2 text-xs text-white/45 transition-all hover:bg-red-500/10 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" /> Vaciar pedido
          </button>
        </div>
      )}
    </div>
  );
}

export function ArmaTuPedido({ pendingRecommendation, sectionRef }: ArmaTuPedidoProps) {
  const { items, addItem, updateQty, totalItems, totalPrice, orderSummary, extras, setExtras } =
    useCart();
  const {
    snapshot,
    beerCatalog: BEERS,
    deliveryOptions,
    orderTypeOptions: ORDER_TYPES,
    priceDisclaimer,
    promotionConfig,
  } = useCommercialDerivedData();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [orderId] = useState(() => Math.floor(10000 + Math.random() * 90000));
  const visibleCategories = useMemo(
    () =>
      listVisibleCatalogCategories(snapshot).filter((category) =>
        QUICK_ORDER_CATEGORIES.includes(category.id),
      ),
    [snapshot],
  );
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>(
    visibleCategories[0]?.id ?? "beer",
  );
  const activeCategory = visibleCategories.some((category) => category.id === selectedCategory)
    ? selectedCategory
    : (visibleCategories[0]?.id ?? "beer");
  const activeCategoryProducts = useMemo(
    () => listCatalogProductsByCategory(snapshot, activeCategory),
    [snapshot, activeCategory],
  );
  const isBeerCategory = activeCategory === "beer";
  const [orderType, setOrderType] = useState<OrderType>(null);
  const [selectedBeer, setSelectedBeer] = useState<CatalogBeer | null>(null);
  const [selectedProductId, setSelectedProductId] = useState("");
  const selectedProduct =
    activeCategoryProducts.find((item) => item.product.id === selectedProductId) ?? null;
  const [selectedPresentationId, setSelectedPresentationId] = useState("");
  const selectedPresentation =
    selectedProduct?.presentations.find(
      (presentation) => presentation.id === selectedPresentationId,
    ) ?? null;
  const [genericQuantity, setGenericQuantity] = useState(1);
  const [draftQuantities, setDraftQuantities] = useState<Record<string, number>>({});
  const [lastAddedMessage, setLastAddedMessage] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<"none" | "valid" | "invalid">("none");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    fecha: "",
    horario: "Mañana 9-12hs",
    direccion: "",
    comentarios: "",
  });
  const [recommendationStatus, setRecommendationStatus] = useState<"idle" | "added" | "error">(
    "idle",
  );
  const [recommendationError, setRecommendationError] = useState("");
  const appliedRecommendationKeyRef = useRef("");
  const drawerToggleRef = useRef<HTMLButtonElement | null>(null);
  const whatsAppLastActivationRef = useRef(0);
  const whatsAppUnlockTimerRef = useRef<number | null>(null);
  const [whatsAppOpening, setWhatsAppOpening] = useState(false);
  const wizardTopRef = useRef<HTMLDivElement | null>(null);
  const previousStepRef = useRef<Step>(step);
  const whatsAppChannels = useMemo(
    () => listOrderWhatsAppChannels(snapshot.whatsappChannels),
    [snapshot.whatsappChannels],
  );
  const [selectedWhatsAppChannelId, setSelectedWhatsAppChannelId] = useState(() =>
    getDefaultWhatsAppChannelId(snapshot.whatsappChannels),
  );
  const selectedWhatsAppChannel =
    whatsAppChannels.find((channel) => channel.id === selectedWhatsAppChannelId) ??
    whatsAppChannels[0];

  useEffect(() => {
    if (!pendingRecommendation) return;

    setSelectedCategory("beer");
    setOrderType("barril");
    if (pendingRecommendation.beerId) {
      const recommendedBeer = BEERS.find((beer) => beer.id === pendingRecommendation.beerId);
      if (recommendedBeer) setSelectedBeer(recommendedBeer);
    }
    setStep(2);
    setDirection(1);
    setRecommendationStatus("idle");
    setRecommendationError("");
    appliedRecommendationKeyRef.current = "";
  }, [pendingRecommendation]);

  useEffect(() => {
    if (visibleCategories.length === 0) {
      setSelectedProductId("");
      setSelectedPresentationId("");
      setSelectedBeer(null);
      setOrderType(null);
      return;
    }

    if (!visibleCategories.some((category) => category.id === selectedCategory)) {
      setSelectedCategory(visibleCategories[0].id);
    }
  }, [selectedCategory, visibleCategories]);

  useEffect(() => {
    setLastAddedMessage("");
    setSelectedProductId("");
    setSelectedPresentationId("");
    setGenericQuantity(1);
    if (!isBeerCategory) {
      setSelectedBeer(null);
      setOrderType(null);
    }
  }, [activeCategory, isBeerCategory]);

  useEffect(() => {
    if (isBeerCategory) return;

    if (
      selectedProductId &&
      !activeCategoryProducts.some((item) => item.product.id === selectedProductId)
    ) {
      setSelectedProductId("");
    }
  }, [activeCategoryProducts, isBeerCategory, selectedProductId]);

  useEffect(() => {
    if (!selectedProduct) {
      setSelectedPresentationId("");
      return;
    }

    if (
      selectedProduct.presentations.length === 1 &&
      selectedPresentationId !== selectedProduct.presentations[0].id
    ) {
      setSelectedPresentationId(selectedProduct.presentations[0].id);
      return;
    }

    if (
      selectedPresentationId &&
      !selectedProduct.presentations.some(
        (presentation) => presentation.id === selectedPresentationId,
      )
    ) {
      setSelectedPresentationId("");
    }
  }, [selectedProduct, selectedPresentationId]);

  useEffect(() => {
    setRecommendationStatus("idle");
    setRecommendationError("");
    appliedRecommendationKeyRef.current = "";
  }, [selectedBeer?.id]);

  useEffect(() => {
    if (!drawerOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen]);

  useEffect(() => {
    return () => {
      if (whatsAppUnlockTimerRef.current !== null) {
        window.clearTimeout(whatsAppUnlockTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (
      selectedWhatsAppChannelId &&
      whatsAppChannels.some((channel) => channel.id === selectedWhatsAppChannelId)
    )
      return;
    setSelectedWhatsAppChannelId(whatsAppChannels[0]?.id ?? "");
  }, [selectedWhatsAppChannelId, whatsAppChannels]);

  useEffect(() => {
    if (previousStepRef.current === step) return;
    previousStepRef.current = step;

    const target = wizardTopRef.current ?? sectionRef.current;
    if (!target) return;

    const frame = window.requestAnimationFrame(() => {
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      target.scrollIntoView({
        block: "start",
        behavior: reducedMotion ? "auto" : "smooth",
      });
      target.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [sectionRef, step]);

  const today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

  const selectedDeliveryOption =
    deliveryOptions.find((option) => option.id === extras.delivery) ?? deliveryOptions[0];
  const deliveryRequiresAddress = selectedDeliveryOption?.requiresAddress ?? false;
  const hasCurrentSelection = hasCurrentSelectionInCart(items, selectedBeer, orderType);
  const hasCatalogProducts = visibleCategories.length > 0;
  const genericCartDraft =
    selectedProduct && selectedPresentation
      ? createCommercialCartItem(selectedProduct.product, selectedPresentation)
      : null;
  const tastingPackDraft = { ...tastingPack, productCategory: "pack" as const };
  const hasGenericSelection = Boolean(
    selectedProduct && selectedPresentation && genericQuantity > 0,
  );
  const isConfigurablePackStep =
    isBeerCategory && step === 3 && orderType === CONFIGURABLE_PACK_ORDER_TYPE;
  const canProceed = (() => {
    if (!hasCatalogProducts) return false;
    if (isBeerCategory) {
      if (step === 1) return orderType !== null;
      if (step === 2) return selectedBeer !== null;
      if (step === 3) return orderType === "paquete" ? hasCurrentSelection : totalItems > 0;
    } else {
      if (step === 1) return selectedProduct !== null;
      if (step === 2) return selectedPresentation !== null;
      if (step === 3) return totalItems > 0;
    }
    if (step === 4)
      return (
        totalItems > 0 &&
        !!formData.nombre.trim() &&
        !!formData.fecha &&
        formData.fecha >= today &&
        (!deliveryRequiresAddress || !!formData.direccion.trim())
      );
    return true;
  })();
  const validationMessage = getOrderWizardValidationMessage({
    step,
    orderType,
    hasSelectedBeer: isBeerCategory ? selectedBeer !== null : selectedProduct !== null,
    hasCurrentSelection:
      step === 3 ? totalItems > 0 : isBeerCategory ? hasCurrentSelection : hasGenericSelection,
    hasCartItems: totalItems > 0,
    customerName: formData.nombre,
    date: formData.fecha,
    today,
    delivery: extras.delivery,
    deliveryRequiresAddress,
    address: formData.direccion,
  });

  const goNext = () => {
    if (!canProceed) return;
    setDirection(1);
    if (isBeerCategory && step === 1 && (orderType === "paquete" || orderType === "porrón")) {
      setStep(3);
      return;
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const goPrev = () => {
    setDirection(-1);
    if (isBeerCategory && step === 3 && (orderType === "paquete" || orderType === "porrón")) {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const applyPendingRecommendation = () => {
    if (!pendingRecommendation || !selectedBeer) return;

    const recommendationKey = [
      selectedBeer.id,
      pendingRecommendation.requiredLiters,
      pendingRecommendation.coveredLiters,
      pendingRecommendation.label,
      ...pendingRecommendation.parts.map((part) => `${part.presentationId}:${part.count}`),
    ].join("|");
    if (appliedRecommendationKeyRef.current === recommendationKey) return;

    try {
      appliedRecommendationKeyRef.current = recommendationKey;
      const recommendedItems = buildRecommendedBarrelItems(selectedBeer, pendingRecommendation);
      recommendedItems.forEach((item) => {
        const { qty, ...cartDraft } = item;
        for (let index = 0; index < qty; index += 1) {
          addItem(cartDraft);
        }
      });
      setRecommendationStatus("added");
      setLastAddedMessage("Recomendación agregada al pedido.");
      setRecommendationError("");
    } catch (error) {
      appliedRecommendationKeyRef.current = "";
      setRecommendationStatus("error");
      setRecommendationError(
        error instanceof Error ? error.message : "No se pudo agregar la recomendación",
      );
    }
  };

  const applyPromo = () => {
    if (promotionConfig.code && promoInput.toUpperCase() === promotionConfig.code) {
      setExtras((p) => ({
        ...p,
        promoCode: promotionConfig.code,
        discount: promotionConfig.discountRate,
      }));
      setPromoStatus("valid");
    } else {
      setExtras((p) => ({ ...p, promoCode: "", discount: 0 }));
      setPromoStatus("invalid");
    }
  };

  const getDraftQuantity = (id: string) => draftQuantities[id] ?? 1;

  const setDraftQuantity = (id: string, qty: number) => {
    setDraftQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(999, Math.trunc(qty) || 1)),
    }));
  };

  const addDraftToOrder = (cartDraft: Omit<(typeof items)[number], "qty">, qty: number) => {
    addItem(cartDraft, qty);
    setLastAddedMessage(`${cartDraft.name} agregado al pedido.`);
    setDraftQuantity(cartDraft.id, 1);
  };

  const setNormalizedGenericQuantity = (qty: number) => {
    setGenericQuantity(normalizeCatalogQuantity(qty));
  };

  const addGenericDraftToOrder = () => {
    if (!genericCartDraft) return;
    addItem(genericCartDraft, genericQuantity);
    setLastAddedMessage(`${genericCartDraft.name} agregado al pedido.`);
    setGenericQuantity(1);
  };

  const handleWhatsAppOrderClick = (event: MouseEvent<HTMLAnchorElement>) => {
    const result = getGuardedActivationState(
      whatsAppLastActivationRef.current,
      Date.now(),
      WHATSAPP_ACTIVATION_GUARD_MS,
    );

    if (!result.allowed) {
      event.preventDefault();
      return;
    }

    whatsAppLastActivationRef.current = result.lastActivatedAt;
    setWhatsAppOpening(true);
    if (whatsAppUnlockTimerRef.current !== null) {
      window.clearTimeout(whatsAppUnlockTimerRef.current);
    }
    whatsAppUnlockTimerRef.current = window.setTimeout(() => {
      setWhatsAppOpening(false);
      whatsAppUnlockTimerRef.current = null;
    }, WHATSAPP_ACTIVATION_GUARD_MS);
  };

  const handleWhatsAppOrderKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (event.key !== " ") return;
    event.preventDefault();
    event.currentTarget.click();
  };

  const whatsAppOrderMessage = buildWhatsAppOrderMessage({
    customer: {
      name: formData.nombre,
      eventDate: formData.fecha,
      timeSlot: formData.horario,
      address: formData.direccion,
      notes: formData.comentarios,
    },
    summary: orderSummary,
    snapshot,
  });
  let whatsAppOrderUrl: string | null = null;
  try {
    whatsAppOrderUrl = selectedWhatsAppChannel
      ? buildWhatsAppOrderUrl(selectedWhatsAppChannel.phoneE164, whatsAppOrderMessage)
      : null;
  } catch {
    whatsAppOrderUrl = null;
  }
  const slideVariants: Variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 60 }),
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: -dir * 60,
      transition: { duration: 0.25, ease: "easeIn" },
    }),
  };

  const NavButtons = () => null;

  const wizardViewportStyle = {
    "--wizard-action-bottom-inset": "max(0.75rem, env(safe-area-inset-bottom))",
    "--wizard-viewport-height":
      "calc(100dvh - var(--site-sticky-offset) - 1.5rem - var(--wizard-action-bottom-inset))",
    scrollMarginTop: "calc(var(--site-sticky-offset) + var(--section-entry-gap))",
  } as CSSProperties;

  const primaryActionLabel =
    step === 4 ? "Ver resumen" : step === 5 ? "Confirmar" : step === 3 ? "Continuar" : "Siguiente";
  const WizardActionBar = () => (
    <div className="sticky bottom-[var(--wizard-action-bottom-inset)] z-20 shrink-0 border-t border-white/10 bg-background/95 pt-3 pb-[var(--wizard-action-bottom-inset)] backdrop-blur-md">
      <div className="flex items-center gap-3">
        {step > 1 && (
          <button
            type="button"
            onClick={
              step === 5
                ? () => {
                    setDirection(-1);
                    setStep(4);
                  }
                : goPrev
            }
            className="flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-bold text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Anterior
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
            title={!canProceed ? (validationMessage ?? undefined) : undefined}
            aria-describedby={!canProceed ? `order-step-${step}-error` : undefined}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-base font-bold transition-all",
              canProceed
                ? "bg-gradient-to-r from-primary to-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.22)] hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(251,191,36,0.34)]"
                : "cursor-not-allowed bg-white/10 text-white/30",
            )}
          >
            {primaryActionLabel} <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        ) : (
          <a
            href={whatsAppOrderUrl ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!whatsAppOrderUrl || whatsAppOpening}
            onClick={handleWhatsAppOrderClick}
            onKeyDown={handleWhatsAppOrderKeyDown}
            className={cn(
              "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-center text-base font-bold text-white transition-colors hover:bg-[#1db954] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              !whatsAppOrderUrl || whatsAppOpening ? "pointer-events-none opacity-70" : "",
            )}
          >
            {whatsAppOpening ? "Abriendo WhatsApp..." : "Confirmar por WhatsApp"}
          </a>
        )}
      </div>
      {!canProceed && step < 5 && (
        <p id={`order-step-${step}-error`} className="mt-2 text-xs text-white/70" role="alert">
          {validationMessage}
        </p>
      )}
    </div>
  );

  const MobileCartSummary = () => {
    if (step < 3 || step > 4) return null;
    return (
      <div className="shrink-0 rounded-2xl border border-primary/20 bg-[#0f0f0f]/95 p-3 lg:hidden">
        <button
          ref={drawerToggleRef}
          type="button"
          onClick={() => setDrawerOpen(!drawerOpen)}
          className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={drawerOpen}
          aria-controls="mobile-order-drawer"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
              {totalItems > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">
                  {totalItems}
                </span>
              )}
            </span>
            <span>
              <span className="block text-xs leading-none text-white/50">
                {totalItems} item{totalItems !== 1 ? "s" : ""}
              </span>
              <span className="block text-base font-bold leading-tight text-white">
                {formatPrice(totalPrice)}
              </span>
            </span>
          </span>
          {drawerOpen ? (
            <ChevronDown className="h-4 w-4 text-white/45" aria-hidden="true" />
          ) : (
            <ChevronUp className="h-4 w-4 text-white/45" aria-hidden="true" />
          )}
        </button>
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              id="mobile-order-drawer"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 max-h-[45dvh] overflow-y-auto border-t border-white/10 pt-3">
                <LiveOrderSummary
                  asDrawer
                  onClose={() => {
                    setDrawerOpen(false);
                    drawerToggleRef.current?.focus();
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <section
      id="arma-tu-pedido"
      ref={sectionRef}
      className="site-section site-section-standard relative overflow-x-clip overflow-y-visible border-t border-white/5 bg-background"
    >
      {/* Beer bubble decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BUBBLES.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              bottom: "-5%",
              background: "radial-gradient(circle, rgba(245,158,11,0.25), transparent)",
            }}
            animate={{
              y: [0, -window.innerHeight * 1.2],
              opacity: [0, 0.15, 0],
            }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        ))}
      </div>

      <div
        data-section-entry
        ref={wizardTopRef}
        tabIndex={-1}
        style={wizardViewportStyle}
        className={cn(
          "relative z-10 mx-auto flex min-h-[min(760px,calc(100dvh-var(--site-sticky-offset)-1rem-var(--wizard-action-bottom-inset)))] flex-col px-4 focus:outline-none sm:px-6 lg:grid lg:h-[var(--wizard-viewport-height)] lg:min-h-[min(620px,var(--wizard-viewport-height))] lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:px-8",
          isConfigurablePackStep ? "max-w-7xl" : "max-w-6xl",
        )}
      >
        <div className="shrink-0">
          <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:items-center">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl md:text-4xl font-display font-bold text-white mb-1.5">
                Armá tu pedido
              </h2>
              <p className="text-sm md:text-base text-muted-foreground">
                Configurá tu experiencia cervecera paso a paso.
              </p>
              <p className="text-xs text-white/40 mt-1.5">{priceDisclaimer}</p>
            </div>
            {hasCatalogProducts && (
              <div className="min-w-0">
                <BeerGlassStepper step={step} />
              </div>
            )}
          </div>

          {pendingRecommendation && step < 3 && (
            <div className="max-w-3xl mx-auto mb-4 rounded-2xl border border-primary/20 bg-primary/10 p-3">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
                    Recomendación calculada
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                        Necesitás
                      </p>
                      <p className="text-white font-bold text-sm">
                        {pendingRecommendation.requiredLiters} L
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                        Sugerimos
                      </p>
                      <p className="text-white font-bold text-sm">{pendingRecommendation.label}</p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                        Total
                      </p>
                      <p className="text-white font-bold text-sm">
                        {pendingRecommendation.coveredLiters} L
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                        Excedente
                      </p>
                      <p className="text-white font-bold text-sm">
                        {pendingRecommendation.excessLiters} L
                      </p>
                    </div>
                  </div>
                </div>
                <div className="md:text-right shrink-0">
                  <p className="text-[11px] uppercase tracking-widest text-white/40 mb-1">
                    {pendingRecommendation.beerId && selectedBeer
                      ? `Precio para ${selectedBeer.name}`
                      : "Estimado desde"}
                  </p>
                  <p className="text-primary font-mono font-bold text-lg">
                    {formatPrice(pendingRecommendation.estimatedPrice)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <CategorySelector
            categories={visibleCategories}
            selectedCategory={activeCategory}
            onSelect={(category) => {
              setSelectedCategory(category);
              setStep(1);
              setDirection(1);
            }}
          />
        </div>

        {!hasCatalogProducts ? (
          <div className="max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
            <ShoppingCart className="w-10 h-10 text-primary mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-xl font-bold text-white mb-2">Catalogo no disponible</h3>
            <p className="text-sm text-muted-foreground">
              No hay productos activos para armar un pedido en este momento.
            </p>
          </div>
        ) : (
          <>
            <div
              data-section-secondary
              className={cn(
                "min-h-0 flex-1 overflow-hidden pb-[calc(6rem+max(0.75rem,env(safe-area-inset-bottom)))] lg:grid lg:gap-5 lg:pb-[calc(5.5rem+max(0.75rem,env(safe-area-inset-bottom)))]",
                isConfigurablePackStep ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_320px]",
              )}
            >
              {/* Wizard */}
              <div className="relative min-h-0 min-w-0 overflow-y-auto overscroll-contain pr-0 lg:pr-1">
                <AnimatePresence mode="wait" custom={direction}>
                  {/* STEP 1: TIPO */}
                  {step === 1 && (
                    <motion.div
                      key="s1"
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {isBeerCategory ? (
                        <>
                          <h3 className="text-xl font-bold text-white mb-5 text-center">
                            ¿Qué querés pedir?
                          </h3>
                          <div className="grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                            {ORDER_TYPES.map((opt) => {
                              const selected = orderType === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => {
                                    setOrderType(opt.id as OrderType);
                                    setLastAddedMessage("");
                                  }}
                                  className={cn(
                                    "group relative flex flex-col text-left rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
                                    selected
                                      ? "border-amber-500 shadow-[0_0_25px_rgba(217,119,6,0.3)]"
                                      : "border-white/10 hover:border-amber-500/50",
                                  )}
                                >
                                  <div className="relative">
                                    <OrderTypeVisual option={opt} selected={selected} />
                                    {selected && (
                                      <motion.div
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{
                                          type: "spring",
                                          stiffness: 400,
                                          damping: 15,
                                        }}
                                        className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                                      >
                                        <Check className="w-4 h-4 text-black" strokeWidth={3} />
                                      </motion.div>
                                    )}
                                    <div className="absolute bottom-3 left-3 text-3xl">
                                      {opt.emoji}
                                    </div>
                                  </div>
                                  <div
                                    className={cn(
                                      "p-3.5 flex-1 transition-colors",
                                      selected ? "bg-amber-500/10" : "bg-white/5",
                                    )}
                                  >
                                    <h4
                                      className={cn(
                                        "font-bold text-base mb-1",
                                        selected ? "text-amber-300" : "text-white",
                                      )}
                                    >
                                      {opt.title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground leading-snug mb-2">
                                      {opt.desc}
                                    </p>
                                    <p
                                      className={cn(
                                        "text-sm font-bold font-mono",
                                        selected ? "text-amber-400" : "text-primary",
                                      )}
                                    >
                                      {opt.desde}
                                    </p>
                                    <p className="text-[10px] text-white/30 mt-1">{opt.detail}</p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          {!canProceed && (
                            <p className="mt-3 text-center text-xs text-white/35">
                              {validationMessage}
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-white mb-5 text-center">
                            Elegí un producto
                          </h3>
                          <ProductSelector
                            products={activeCategoryProducts}
                            selectedProductId={selectedProductId}
                            onSelect={(productId) => {
                              setSelectedProductId(productId);
                              setSelectedPresentationId("");
                              setLastAddedMessage("");
                            }}
                          />
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 2: CERVEZA */}
                  {step === 2 && (
                    <motion.div
                      key="s2"
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      {isBeerCategory ? (
                        <>
                          <h3 className="text-xl font-bold text-white mb-5 text-center">
                            Elegí el estilo
                          </h3>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {BEERS.map((beer) => {
                              const sel = selectedBeer?.id === beer.id;
                              return (
                                <button
                                  type="button"
                                  key={beer.id}
                                  onClick={() => setSelectedBeer(beer)}
                                  aria-pressed={sel}
                                  className={cn(
                                    "group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
                                    sel
                                      ? "border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
                                      : "border-transparent bg-white/5 hover:border-amber-500/40",
                                  )}
                                >
                                  <div className="relative h-24 md:h-28 overflow-hidden">
                                    <img
                                      src={beer.img}
                                      alt={beer.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                    <div className="absolute bottom-2 left-2 flex gap-1">
                                      <span className="text-[9px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">
                                        IBU {beer.ibu}
                                      </span>
                                      <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded">
                                        ALC {beer.abv}%
                                      </span>
                                    </div>
                                    {sel && (
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 400 }}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                                      >
                                        <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                                      </motion.div>
                                    )}
                                  </div>
                                  <div
                                    className={cn(
                                      "p-2.5 transition-colors",
                                      sel ? "bg-amber-500/10" : "bg-white/5",
                                    )}
                                  >
                                    <h4
                                      className={cn(
                                        "font-bold text-sm mb-0.5 leading-tight",
                                        sel ? "text-amber-300" : "text-white",
                                      )}
                                    >
                                      {beer.name}
                                    </h4>
                                    <p className="text-primary font-mono text-xs font-bold">
                                      Desde{" "}
                                      {formatPrice(
                                        orderType === "barril"
                                          ? beer.precios.barril20L
                                          : orderType === "growler"
                                            ? beer.precios.growler1L
                                            : beer.precios.porron500ml,
                                      )}
                                    </p>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      ) : selectedProduct ? (
                        <>
                          <div className="text-center mb-6">
                            <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                              {selectedProduct.product.name}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-white">
                              Elegí la presentación
                            </h3>
                            {selectedProduct.variantLabel &&
                              selectedProduct.variantLabel !== selectedProduct.product.name && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {selectedProduct.variantLabel}
                                </p>
                              )}
                          </div>
                          <PresentationSelector
                            product={selectedProduct}
                            selectedPresentationId={selectedPresentationId}
                            onSelect={(presentationId) => {
                              setSelectedPresentationId(presentationId);
                              setLastAddedMessage("");
                            }}
                          />
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                            <p className="text-white font-bold">
                              Seleccioná un producto para continuar
                            </p>
                          </div>
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 3: CANTIDAD */}
                  {step === 3 && (
                    <motion.div
                      key="s3"
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className={cn(
                        "mx-auto w-full",
                        isConfigurablePackStep ? "max-w-none" : "max-w-2xl",
                      )}
                    >
                      {isBeerCategory ? (
                        <>
                          {!isConfigurablePackStep && (
                            <div className="text-center mb-6">
                              <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                                {orderType === "paquete" ? "Pack Degustación" : selectedBeer?.name}
                              </div>
                              <h3 className="text-xl md:text-2xl font-bold text-white">
                                ¿Cuánto necesitás?
                              </h3>
                              {lastAddedMessage && (
                                <p className="mt-3 text-sm font-bold text-green-300" role="status">
                                  {lastAddedMessage}
                                </p>
                              )}
                            </div>
                          )}
                          {isConfigurablePackStep && lastAddedMessage && (
                            <p className="mb-3 text-sm font-bold text-green-300" role="status">
                              {lastAddedMessage}
                            </p>
                          )}

                          <div className="grid gap-4">
                            {orderType === "paquete" && (
                              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-5">
                                <div className="min-w-0">
                                  <h4 className="text-xl font-bold text-white">Pack Degustación</h4>
                                  <p className="mt-2 text-sm text-muted-foreground">
                                    Pack cerrado de 6 estilos surtidos. No requiere elegir un estilo
                                    individual.
                                  </p>
                                  <p className="mt-2 text-xs text-white/45">
                                    Incluye 6 botellas de estilos distintos.
                                  </p>
                                  <p className="text-primary font-mono font-bold mt-2">
                                    {formatPrice(tastingPack.price)} por pack
                                  </p>
                                  <p className="text-xs text-white/45 mt-1">
                                    Subtotal:{" "}
                                    {formatPrice(
                                      tastingPack.price * getDraftQuantity(tastingPack.id),
                                    )}
                                  </p>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                                  <div className="flex items-center bg-white/10 rounded-xl p-1">
                                    <button
                                      type="button"
                                      aria-label="Restar cantidad de Pack Degustación"
                                      onClick={() =>
                                        setDraftQuantity(
                                          tastingPack.id,
                                          getDraftQuantity(tastingPack.id) - 1,
                                        )
                                      }
                                      className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                    >
                                      <Minus className="w-4 h-4 text-white" aria-hidden="true" />
                                    </button>
                                    <input
                                      aria-label="Cantidad de Pack Degustación"
                                      type="number"
                                      min={1}
                                      max={999}
                                      step={1}
                                      value={getDraftQuantity(tastingPack.id)}
                                      onChange={(event) =>
                                        setDraftQuantity(tastingPack.id, Number(event.target.value))
                                      }
                                      className="w-14 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg"
                                    />
                                    <button
                                      type="button"
                                      aria-label="Sumar cantidad de Pack Degustación"
                                      onClick={() =>
                                        setDraftQuantity(
                                          tastingPack.id,
                                          getDraftQuantity(tastingPack.id) + 1,
                                        )
                                      }
                                      className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                    >
                                      <Plus className="w-4 h-4 text-white" aria-hidden="true" />
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      addDraftToOrder(
                                        tastingPackDraft,
                                        getDraftQuantity(tastingPack.id),
                                      )
                                    }
                                    className="px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                                  >
                                    Agregar al pedido
                                  </button>
                                </div>
                              </div>
                            )}
                            {orderType === "barril" &&
                              barrelPresentationIds.map((presentationId) => {
                                if (!selectedBeer) return null;
                                const size = getBeerPresentation(selectedBeer, presentationId);
                                if (!size) return null;
                                const cartDraft = createBeerCartItem(selectedBeer, presentationId);
                                const itemId = cartDraft.id;
                                const cartItem = items.find((i) => i.id === itemId);
                                return (
                                  <div
                                    key={size.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                  >
                                    <div className="flex-1">
                                      <h4 className="text-lg font-bold text-white">{size.label}</h4>
                                      <p className="text-xs text-muted-foreground">
                                        {size.description}
                                      </p>
                                      <p className="text-primary font-mono font-bold mt-1">
                                        {formatPrice(size.price)}
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                                      {cartItem ? (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                          <button
                                            type="button"
                                            aria-label={`Restar una unidad de ${cartDraft.name}`}
                                            onClick={() => updateQty(itemId, cartItem.qty - 1)}
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Minus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                          <span
                                            className="w-9 text-center font-bold text-white"
                                            aria-label={`Cantidad actual ${cartItem.qty}`}
                                          >
                                            {cartItem.qty}
                                          </span>
                                          <button
                                            type="button"
                                            aria-label={`Sumar una unidad de ${cartDraft.name}`}
                                            onClick={() => updateQty(itemId, cartItem.qty + 1)}
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Plus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                          <button
                                            type="button"
                                            aria-label={`Restar cantidad a agregar de ${cartDraft.name}`}
                                            onClick={() =>
                                              setDraftQuantity(itemId, getDraftQuantity(itemId) - 1)
                                            }
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Minus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                          <input
                                            aria-label={`Cantidad de ${cartDraft.name}`}
                                            type="number"
                                            min={1}
                                            max={999}
                                            step={1}
                                            value={getDraftQuantity(itemId)}
                                            onChange={(event) =>
                                              setDraftQuantity(itemId, Number(event.target.value))
                                            }
                                            className="w-12 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg"
                                          />
                                          <button
                                            type="button"
                                            aria-label={`Sumar cantidad a agregar de ${cartDraft.name}`}
                                            onClick={() =>
                                              setDraftQuantity(itemId, getDraftQuantity(itemId) + 1)
                                            }
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Plus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addDraftToOrder(
                                            cartDraft,
                                            cartItem ? 1 : getDraftQuantity(itemId),
                                          )
                                        }
                                        className="px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                                      >
                                        Agregar al pedido
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                            {orderType === "growler" &&
                              growlerPresentationIds.map((presentationId) => {
                                if (!selectedBeer) return null;
                                const size = getBeerPresentation(selectedBeer, presentationId);
                                if (!size) return null;
                                const cartDraft = createBeerCartItem(selectedBeer, presentationId);
                                const itemId = cartDraft.id;
                                const cartItem = items.find((i) => i.id === itemId);
                                return (
                                  <div
                                    key={size.id}
                                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                                  >
                                    <div>
                                      <h4 className="text-lg font-bold text-white">{size.label}</h4>
                                      <p className="text-primary font-mono font-bold mt-1">
                                        {formatPrice(size.price)}
                                      </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                                      {cartItem ? (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                          <button
                                            type="button"
                                            aria-label={`Restar una unidad de ${cartDraft.name}`}
                                            onClick={() => updateQty(itemId, cartItem.qty - 1)}
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Minus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                          <span
                                            className="w-9 text-center font-bold text-white"
                                            aria-label={`Cantidad actual ${cartItem.qty}`}
                                          >
                                            {cartItem.qty}
                                          </span>
                                          <button
                                            type="button"
                                            aria-label={`Sumar una unidad de ${cartDraft.name}`}
                                            onClick={() => updateQty(itemId, cartItem.qty + 1)}
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Plus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                          <button
                                            type="button"
                                            aria-label={`Restar cantidad a agregar de ${cartDraft.name}`}
                                            onClick={() =>
                                              setDraftQuantity(itemId, getDraftQuantity(itemId) - 1)
                                            }
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Minus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                          <input
                                            aria-label={`Cantidad de ${cartDraft.name}`}
                                            type="number"
                                            min={1}
                                            max={999}
                                            step={1}
                                            value={getDraftQuantity(itemId)}
                                            onChange={(event) =>
                                              setDraftQuantity(itemId, Number(event.target.value))
                                            }
                                            className="w-12 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg"
                                          />
                                          <button
                                            type="button"
                                            aria-label={`Sumar cantidad a agregar de ${cartDraft.name}`}
                                            onClick={() =>
                                              setDraftQuantity(itemId, getDraftQuantity(itemId) + 1)
                                            }
                                            className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                          >
                                            <Plus
                                              className="w-4 h-4 text-white"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          addDraftToOrder(
                                            cartDraft,
                                            cartItem ? 1 : getDraftQuantity(itemId),
                                          )
                                        }
                                        className="px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                                      >
                                        Agregar al pedido
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                            {orderType === "porrón" && (
                              <ConfigurableBeerPackBuilder
                                beers={BEERS}
                                onAddPacks={(lines) => {
                                  lines.forEach((line) => addItem(line.item, line.qty));
                                }}
                                onAdded={setLastAddedMessage}
                                layout="wide"
                              />
                            )}
                          </div>

                          {pendingRecommendation && selectedBeer && orderType === "barril" && (
                            <div className="mt-5 rounded-2xl border border-primary/20 bg-black/30 p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                  <p className="text-white font-bold">
                                    Aplicar recomendación a {selectedBeer.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Podés ajustar cantidades o sumar otros estilos después.
                                  </p>
                                </div>
                                <button
                                  onClick={applyPendingRecommendation}
                                  disabled={recommendationStatus === "added"}
                                  className={cn(
                                    "shrink-0 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                    recommendationStatus === "added"
                                      ? "bg-green-500/20 text-green-300 border border-green-500/30 cursor-default"
                                      : "bg-primary text-black hover:bg-amber-400",
                                  )}
                                >
                                  {recommendationStatus === "added" ? (
                                    <>
                                      <Check className="w-4 h-4" /> Agregada al pedido
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-4 h-4" /> Agregar recomendación al
                                      pedido
                                    </>
                                  )}
                                </button>
                              </div>
                              {recommendationStatus === "error" && (
                                <p className="text-red-400 text-xs font-bold mt-3">
                                  {recommendationError}
                                </p>
                              )}
                            </div>
                          )}

                          {totalItems > 0 && (
                            <div className="mt-5 flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirection(-1);
                                  setStep(1);
                                  setOrderType(null);
                                  setSelectedBeer(null);
                                  setLastAddedMessage("");
                                }}
                                className="px-5 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
                              >
                                Agregar otro producto
                              </button>
                            </div>
                          )}

                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      ) : selectedProduct && selectedPresentation && genericCartDraft ? (
                        <>
                          <div className="text-center mb-6">
                            <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                              {selectedProduct.product.name}
                            </div>
                            <h3 className="text-xl md:text-2xl font-bold text-white">
                              Elegí la cantidad
                            </h3>
                            {lastAddedMessage && (
                              <p className="mt-3 text-sm font-bold text-green-300" role="status">
                                {lastAddedMessage}
                              </p>
                            )}
                          </div>
                          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                            <div className="min-w-0">
                              <h4 className="text-lg font-bold text-white">
                                {selectedPresentation.label}
                              </h4>
                              {selectedProduct.variantLabel &&
                                selectedProduct.variantLabel !== selectedProduct.product.name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {selectedProduct.variantLabel}
                                  </p>
                                )}
                              <p className="text-primary font-mono font-bold mt-1">
                                {formatPrice(selectedPresentation.unitPrice)}
                              </p>
                              <p className="text-xs text-white/45 mt-1">
                                Subtotal:{" "}
                                {formatPrice(selectedPresentation.unitPrice * genericQuantity)}
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
                              <div className="flex items-center bg-white/10 rounded-xl p-1">
                                <button
                                  type="button"
                                  aria-label={`Restar cantidad a agregar de ${genericCartDraft.name}`}
                                  onClick={() => setNormalizedGenericQuantity(genericQuantity - 1)}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                >
                                  <Minus className="w-4 h-4 text-white" aria-hidden="true" />
                                </button>
                                <input
                                  aria-label={`Cantidad de ${genericCartDraft.name}`}
                                  type="number"
                                  min={1}
                                  max={999}
                                  step={1}
                                  value={genericQuantity}
                                  onChange={(event) =>
                                    setNormalizedGenericQuantity(Number(event.target.value))
                                  }
                                  className="w-14 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg"
                                />
                                <button
                                  type="button"
                                  aria-label={`Sumar cantidad a agregar de ${genericCartDraft.name}`}
                                  onClick={() => setNormalizedGenericQuantity(genericQuantity + 1)}
                                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                >
                                  <Plus className="w-4 h-4 text-white" aria-hidden="true" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={addGenericDraftToOrder}
                                className="px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                              >
                                Agregar al pedido
                              </button>
                            </div>
                          </div>
                          {totalItems > 0 && (
                            <div className="mt-5 flex justify-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setDirection(-1);
                                  setStep(1);
                                  setSelectedProductId("");
                                  setSelectedPresentationId("");
                                  setLastAddedMessage("");
                                }}
                                className="px-5 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
                              >
                                Agregar otro producto
                              </button>
                            </div>
                          )}
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                            <p className="text-white font-bold">
                              Seleccioná una presentación para continuar
                            </p>
                          </div>
                          <div className="relative">
                            <NavButtons />
                          </div>
                        </>
                      )}
                    </motion.div>
                  )}

                  {/* STEP 4: EXTRAS + DATOS */}
                  {step === 4 && (
                    <motion.div
                      key="s4"
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                    >
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Truck className="w-5 h-5 text-primary" /> Entrega
                            </h3>
                            <div className="grid gap-3">
                              {deliveryOptions.map((d) => {
                                const iconByDelivery: Record<string, LucideIcon> = {
                                  fabrica: Store,
                                  norte: Truck,
                                  caba: MapPin,
                                };
                                const Icon =
                                  iconByDelivery[d.id] ?? (d.requiresAddress ? Truck : Store);

                                return (
                                  <button
                                    key={d.id}
                                    onClick={() =>
                                      setExtras((p) => ({
                                        ...p,
                                        delivery: d.id,
                                      }))
                                    }
                                    className={cn(
                                      "w-full p-3 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                                      extras.delivery === d.id
                                        ? "bg-primary/10 border-primary"
                                        : "bg-white/5 border-transparent hover:bg-white/10",
                                    )}
                                  >
                                    <div
                                      className={cn(
                                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                                        extras.delivery === d.id
                                          ? "bg-primary text-black"
                                          : "bg-white/10 text-white",
                                      )}
                                    >
                                      <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="font-bold text-white leading-none mb-1">
                                        {d.label}
                                      </p>
                                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                                    </div>
                                    {extras.delivery === d.id && (
                                      <Check className="w-5 h-5 text-primary shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                              <Tag className="w-5 h-5 text-primary" /> Código Promocional
                            </h3>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <input
                                  id="promo-code"
                                  type="text"
                                  value={promoInput}
                                  onChange={(e) => setPromoInput(e.target.value)}
                                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                                  placeholder={`Ej: ${promotionConfig.code}`}
                                  autoComplete="off"
                                  aria-invalid={promoStatus === "invalid"}
                                  aria-describedby={
                                    promoStatus === "invalid"
                                      ? "promo-code-error"
                                      : promoStatus === "valid"
                                        ? "promo-code-success"
                                        : undefined
                                  }
                                  className={cn(
                                    "w-full bg-white/5 border-2 rounded-xl py-3 px-4 text-white focus:outline-none transition-all uppercase placeholder:normal-case placeholder:text-white/30",
                                    promoStatus === "valid"
                                      ? "border-green-500/60"
                                      : promoStatus === "invalid"
                                        ? "border-red-500/60"
                                        : "border-white/10 focus:border-primary",
                                  )}
                                />
                                {promoStatus === "valid" && (
                                  <Check
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5"
                                    aria-hidden="true"
                                  />
                                )}
                                {promoStatus === "invalid" && (
                                  <X
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 w-5 h-5"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={applyPromo}
                                className="px-5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/10"
                              >
                                Aplicar
                              </button>
                            </div>
                            {promoStatus === "valid" && (
                              <p
                                id="promo-code-success"
                                className="text-green-400 text-xs mt-2 font-bold"
                                role="status"
                              >
                                ✓ ¡Descuento del {promotionConfig.discountRate * 100}% aplicado!
                              </p>
                            )}
                            {promoStatus === "invalid" && (
                              <p
                                id="promo-code-error"
                                className="text-red-300 text-xs mt-2 font-bold"
                                role="alert"
                              >
                                ✗ Código no válido
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Tus datos
                          </h3>
                          <div>
                            <label
                              htmlFor="order-name"
                              className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
                            >
                              Nombre Completo *
                            </label>
                            <input
                              id="order-name"
                              type="text"
                              value={formData.nombre}
                              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                              placeholder="Ej: Juan Pérez"
                              required
                              autoComplete="name"
                              aria-invalid={step === 4 && !formData.nombre.trim()}
                              aria-describedby={
                                step === 4 && !canProceed ? `order-step-${step}-error` : undefined
                              }
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label
                                htmlFor="order-date"
                                className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
                              >
                                Fecha *
                              </label>
                              <input
                                id="order-date"
                                type="date"
                                min={today}
                                value={formData.fecha}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    fecha: e.target.value,
                                  })
                                }
                                required
                                aria-invalid={
                                  step === 4 && (!formData.fecha || formData.fecha < today)
                                }
                                aria-describedby={
                                  step === 4 && !canProceed ? `order-step-${step}-error` : undefined
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor="order-time-slot"
                                className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
                              >
                                Horario
                              </label>
                              <Select
                                value={formData.horario}
                                onValueChange={(value) =>
                                  setFormData({
                                    ...formData,
                                    horario: value,
                                  })
                                }
                              >
                                <SelectTrigger
                                  id="order-time-slot"
                                  className="h-11 rounded-xl border-white/10 bg-white/5 px-4 pr-4 text-white focus:ring-1 focus:ring-primary [&>svg]:ml-3 [&>svg]:text-primary"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="z-[80] border-white/10 bg-[#15110d] text-white shadow-2xl shadow-black/50">
                                  <SelectItem
                                    value="Mañana 9-12hs"
                                    className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                                  >
                                    Mañana (9-12hs)
                                  </SelectItem>
                                  <SelectItem
                                    value="Tarde 12-16hs"
                                    className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                                  >
                                    Tarde (12-16hs)
                                  </SelectItem>
                                  <SelectItem
                                    value="Noche 16-20hs"
                                    className="text-white focus:bg-primary/20 focus:text-white data-[highlighted]:bg-primary/20 data-[highlighted]:text-white"
                                  >
                                    Noche (16-20hs)
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          {deliveryRequiresAddress && (
                            <div>
                              <label
                                htmlFor="order-address"
                                className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
                              >
                                Dirección *
                              </label>
                              <input
                                id="order-address"
                                type="text"
                                value={formData.direccion}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    direccion: e.target.value,
                                  })
                                }
                                placeholder="Ej: Av. Corrientes 1234, CABA"
                                required
                                autoComplete="street-address"
                                aria-invalid={
                                  step === 4 &&
                                  deliveryRequiresAddress &&
                                  !formData.direccion.trim()
                                }
                                aria-describedby={
                                  step === 4 && !canProceed ? `order-step-${step}-error` : undefined
                                }
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20"
                              />
                            </div>
                          )}
                          <div>
                            <label
                              htmlFor="order-comments"
                              className="text-xs font-bold text-white/70 uppercase tracking-widest mb-1.5 block"
                            >
                              Comentarios
                            </label>
                            <textarea
                              id="order-comments"
                              value={formData.comentarios}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  comentarios: e.target.value,
                                })
                              }
                              placeholder="Detalles de entrega, preferencias, etc."
                              autoComplete="off"
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-20 resize-none placeholder:text-white/20"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <NavButtons />
                      </div>
                    </motion.div>
                  )}

                  {/* STEP 5: TICKET */}
                  {step === 5 && (
                    <motion.div
                      key="s5"
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="max-w-sm mx-auto w-full"
                    >
                      <div className="relative bg-[#fafaf8] text-[#222] rounded-lg shadow-2xl overflow-hidden">
                        <div
                          className="absolute top-0 left-0 w-full overflow-hidden leading-none"
                          style={{ height: "16px" }}
                        >
                          <svg
                            viewBox="0 0 1200 20"
                            className="w-full h-full"
                            preserveAspectRatio="none"
                          >
                            {Array.from({ length: 30 }).map((_, i) => (
                              <polygon
                                key={i}
                                points={`${i * 40},0 ${i * 40 + 20},20 ${i * 40 + 40},0`}
                                fill="#0a0a0a"
                              />
                            ))}
                          </svg>
                        </div>
                        <div
                          className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180"
                          style={{ height: "16px" }}
                        >
                          <svg
                            viewBox="0 0 1200 20"
                            className="w-full h-full"
                            preserveAspectRatio="none"
                          >
                            {Array.from({ length: 30 }).map((_, i) => (
                              <polygon
                                key={i}
                                points={`${i * 40},0 ${i * 40 + 20},20 ${i * 40 + 40},0`}
                                fill="#0a0a0a"
                              />
                            ))}
                          </svg>
                        </div>

                        <div className="pt-8 pb-8 px-7">
                          <div className="text-center mb-5">
                            <p className="text-3xl mb-1">🍺</p>
                            <h3 className="text-2xl font-black uppercase tracking-tighter">
                              LUPULADOS
                            </h3>
                            <p className="text-[10px] font-mono text-[#999] mt-0.5">
                              CERVECERÍA ARTESANAL · ENTREGA A COORDINAR
                            </p>
                            <div className="mt-4 py-2 border-y-2 border-dashed border-[#ccc]">
                              <p className="font-mono font-bold text-sm tracking-widest">
                                ORDEN #{orderId}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-2 font-mono text-sm">
                            {[
                              { label: "CLIENTE", value: formData.nombre || "—" },
                              { label: "FECHA", value: formData.fecha || "—" },
                              { label: "HORARIO", value: formData.horario },
                              {
                                label: "ENVÍO",
                                value: orderSummary.delivery.label,
                              },
                            ].map((row) => (
                              <div key={row.label} className="flex items-end gap-1">
                                <span className="text-[#777] text-[11px] shrink-0">
                                  {row.label}
                                </span>
                                <div className="flex-1 border-b border-dotted border-[#ccc] mb-0.5 mx-1" />
                                <span className="text-[11px] shrink-0 text-right max-w-[120px] truncate">
                                  {row.value}
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#ddd]">
                            <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#999] mb-3">
                              Detalle del pedido
                            </p>
                            <div className="space-y-2">
                              {items.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between items-start font-mono text-xs gap-2"
                                >
                                  <div className="flex-1">
                                    <p className="font-bold text-[#333] leading-tight">
                                      {item.name}
                                    </p>
                                    <p className="text-[10px] text-[#999]">
                                      {item.qty} u. × {formatPrice(item.price)}
                                    </p>
                                  </div>
                                  <span className="font-bold text-[#222] shrink-0">
                                    {formatPrice(item.price * item.qty)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {orderSummary.extraLines.length > 0 && (
                            <div className="mt-3 space-y-1 font-mono text-xs">
                              {orderSummary.extraLines.map((extra) => (
                                <div key={extra.id} className="flex justify-between text-[#555]">
                                  <span>{extra.label.toUpperCase()}</span>
                                  <span>{formatPrice(extra.total)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {orderSummary.deliveryCost > 0 && (
                            <div className="mt-3 flex justify-between font-mono text-xs text-[#555]">
                              <span>ENVIO</span>
                              <span>{formatPrice(orderSummary.deliveryCost)}</span>
                            </div>
                          )}

                          {orderSummary.discountAmount > 0 && (
                            <div className="mt-3 flex justify-between font-mono text-xs text-green-600 font-bold">
                              <span>DESCUENTO {orderSummary.discountCode}</span>
                              <span>-{formatPrice(orderSummary.discountAmount)}</span>
                            </div>
                          )}
                          <div className="mt-4 pt-4 border-t-2 border-dashed border-[#ccc] text-center">
                            <p className="text-[10px] font-mono text-[#999] uppercase tracking-widest mb-1">
                              Total estimado
                            </p>
                            <p className="text-4xl font-black tracking-tight text-[#111]">
                              {formatPrice(totalPrice)}
                            </p>
                            <p className="text-[9px] font-mono text-[#777] mt-2 leading-snug">
                              {priceDisclaimer}
                            </p>
                          </div>

                          <p className="text-center text-[9px] font-mono text-[#bbb] mt-5 leading-relaxed">
                            NO ES COMPROBANTE FISCAL
                            <br />
                            GRACIAS POR ELEGIRNOS 🍻 LUPULADOS.AR
                          </p>
                        </div>
                      </div>

                      <div className="mt-6">
                        <WhatsAppChannelSelector
                          channels={whatsAppChannels}
                          selectedChannelId={selectedWhatsAppChannel?.id ?? ""}
                          onSelect={setSelectedWhatsAppChannelId}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Desktop order summary sidebar */}
              {!isConfigurablePackStep && (
                <div className="hidden min-h-0 lg:block">
                  <div className="h-full min-h-0 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <LiveOrderSummary />
                  </div>
                </div>
              )}
            </div>
            <MobileCartSummary />
            <WizardActionBar />
          </>
        )}
      </div>
    </section>
  );
}
