import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type RefObject,
} from "react";
import type { Variants } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import type { Beer as CatalogBeer } from "@/domain/beerCatalog";
import { getGuardedActivationState } from "@/domain/activationGuard";
import { BEVERAGE_LABELS, type BeverageMixItemEstimate } from "@/domain/beverageMix";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import {
  getDefaultWhatsAppChannelId,
  getTodayInputValue,
  listOrderWhatsAppChannels,
} from "@/domain/checkout";
import type { ProductCategory } from "@/domain/commercialTypes";
import {
  buildRecommendationKey,
  buildRecommendedBarrelItems,
  buildRecommendedBeverageMixItems,
  hasCurrentSelectionInCart,
  type OrderType,
} from "@/domain/orderFlow";
import {
  CONFIGURABLE_PACK_ORDER_TYPE,
  getNextWizardStep,
  getPrevWizardStep,
  QUICK_ORDER_CATEGORIES,
  WHATSAPP_ACTIVATION_GUARD_MS,
  type Step,
} from "@/domain/orderWizardConstants";
import {
  getOrderWizardCanProceed,
  getOrderWizardValidationMessage,
} from "@/domain/orderWizardValidation";
import {
  createCommercialCartItem,
  listCatalogProductsByCategory,
  listVisibleCatalogCategories,
  normalizeCatalogQuantity,
} from "@/domain/productCatalog";
import { resolveAppliedPromotion } from "@/domain/promotionMatching";
import { buildWhatsAppOrderMessage, buildWhatsAppOrderUrl } from "@/domain/whatsAppOrder";

interface UseOrderWizardStateInput {
  pendingRecommendation: BarrelRecommendation | null;
  pendingBeverageMix: BeverageMixItemEstimate[] | null;
  pendingBeerPreferenceIds: string[];
  sectionRef: RefObject<HTMLElement | null>;
}

export function useOrderWizardState({
  pendingRecommendation,
  pendingBeverageMix,
  pendingBeerPreferenceIds,
  sectionRef,
}: UseOrderWizardStateInput) {
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
  const pendingBeerPreferenceNames = useMemo(
    () =>
      pendingBeerPreferenceIds
        .map((beerId) => BEERS.find((beer) => beer.id === beerId)?.name)
        .filter((name): name is string => Boolean(name)),
    [BEERS, pendingBeerPreferenceIds],
  );

  useEffect(() => {
    if (!pendingRecommendation) return;

    setSelectedCategory("beer");
    setOrderType("barril");
    if (pendingRecommendation.beerId) {
      const recommendedBeer = BEERS.find((beer) => beer.id === pendingRecommendation.beerId);
      if (recommendedBeer) setSelectedBeer(recommendedBeer);
    } else if (pendingBeerPreferenceIds.length === 1) {
      const preferredBeer = BEERS.find((beer) => beer.id === pendingBeerPreferenceIds[0]);
      if (preferredBeer) setSelectedBeer(preferredBeer);
    }
    // Si la recomendación no incluye cerveza (mezcla 100% espirituosas), no tiene sentido
    // forzar al usuario a elegir una cerveza para poder avanzar: se salta directo al paso
    // donde está el botón de aplicar la recomendación.
    setStep(pendingRecommendation.parts.length > 0 ? 2 : 3);
    setDirection(1);
    setRecommendationStatus("idle");
    setRecommendationError("");
    appliedRecommendationKeyRef.current = "";
  }, [BEERS, pendingRecommendation, pendingBeverageMix, pendingBeerPreferenceIds]);

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

  const today = getTodayInputValue();

  const selectedDeliveryOption =
    deliveryOptions.find((option) => option.id === extras.delivery) ?? deliveryOptions[0];
  const deliveryRequiresAddress = selectedDeliveryOption?.requiresAddress ?? false;
  const hasCurrentSelection = hasCurrentSelectionInCart(items, selectedBeer, orderType);
  const hasCatalogProducts = visibleCategories.length > 0;
  const genericCartDraft =
    selectedProduct && selectedPresentation
      ? createCommercialCartItem(selectedProduct.product, selectedPresentation)
      : null;
  const hasGenericSelection = Boolean(
    selectedProduct && selectedPresentation && genericQuantity > 0,
  );
  const isConfigurablePackStep =
    isBeerCategory && step === 3 && orderType === CONFIGURABLE_PACK_ORDER_TYPE;
  const canProceed = getOrderWizardCanProceed({
    hasCatalogProducts,
    isBeerCategory,
    step,
    orderType,
    hasSelectedBeer: selectedBeer !== null,
    hasCurrentSelection,
    hasSelectedProduct: selectedProduct !== null,
    hasSelectedPresentation: selectedPresentation !== null,
    hasCartItems: totalItems > 0,
    customerName: formData.nombre,
    date: formData.fecha,
    today,
    deliveryRequiresAddress,
    address: formData.direccion,
  });
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
    setStep(getNextWizardStep(step, isBeerCategory, orderType));
  };

  const goPrev = () => {
    setDirection(-1);
    setStep(getPrevWizardStep(step, isBeerCategory, orderType));
  };

  const applyPendingRecommendation = () => {
    if (!pendingRecommendation) return;
    const hasBeerPart = pendingRecommendation.parts.length > 0;
    if (hasBeerPart && !selectedBeer) return;

    const recommendationKey = buildRecommendationKey({
      selectedBeerId: selectedBeer?.id ?? null,
      recommendation: pendingRecommendation,
      beverageMix: pendingBeverageMix,
      beerPreferenceIds: pendingBeerPreferenceIds,
    });
    if (appliedRecommendationKeyRef.current === recommendationKey) return;

    try {
      appliedRecommendationKeyRef.current = recommendationKey;
      const addedGroups: string[] = [];

      if (hasBeerPart && selectedBeer) {
        const recommendedItems = buildRecommendedBarrelItems(selectedBeer, pendingRecommendation);
        recommendedItems.forEach((item) => {
          const { qty, ...cartDraft } = item;
          for (let index = 0; index < qty; index += 1) {
            addItem(cartDraft);
          }
        });
        addedGroups.push("cerveza");
      }

      if (pendingBeverageMix) {
        const { items: mixItems, skipped } = buildRecommendedBeverageMixItems(
          pendingBeverageMix,
          snapshot,
        );
        mixItems.forEach((item) => {
          const { qty, ...cartDraft } = item;
          addItem(cartDraft, qty);
        });
        if (mixItems.length > 0) addedGroups.push("espirituosas");
        if (skipped.length > 0) {
          setRecommendationError(
            `No se pudo agregar: ${skipped.map((type) => BEVERAGE_LABELS[type]).join(", ")} (sin productos disponibles en el catálogo).`,
          );
        } else {
          setRecommendationError("");
        }
      } else {
        setRecommendationError("");
      }

      setRecommendationStatus("added");
      setLastAddedMessage(
        addedGroups.length > 0
          ? `Recomendación agregada al pedido (${addedGroups.join(" + ")}).`
          : "Recomendación agregada al pedido.",
      );
    } catch (error) {
      appliedRecommendationKeyRef.current = "";
      setRecommendationStatus("error");
      setRecommendationError(
        error instanceof Error ? error.message : "No se pudo agregar la recomendación",
      );
    }
  };

  const applyPromo = () => {
    const matched = resolveAppliedPromotion(promoInput, snapshot);
    if (matched) {
      setExtras((p) => ({
        ...p,
        promoCode: matched.code,
        discount: matched.value,
        discountType: matched.type,
      }));
      setPromoStatus("valid");
    } else {
      setExtras((p) => ({ ...p, promoCode: "", discount: 0, discountType: "percentage" }));
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

  const primaryActionLabel =
    step === 4 ? "Ver resumen" : step === 5 ? "Confirmar" : step === 3 ? "Continuar" : "Siguiente";

  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    setStep(1);
    setDirection(1);
  };

  const handleSelectOrderType = (id: OrderType) => {
    setOrderType(id);
    setLastAddedMessage("");
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setSelectedPresentationId("");
    setLastAddedMessage("");
  };

  const handleSelectPresentation = (presentationId: string) => {
    setSelectedPresentationId(presentationId);
    setLastAddedMessage("");
  };

  const handleAddAnotherBeerProduct = () => {
    setDirection(-1);
    if (orderType === "barril" || orderType === "growler") {
      setStep(2);
    } else {
      setStep(1);
      setOrderType(null);
    }
    setSelectedBeer(null);
    setLastAddedMessage("");
  };

  const handleAddAnotherGenericProduct = () => {
    setDirection(-1);
    setStep(1);
    setSelectedProductId("");
    setSelectedPresentationId("");
    setLastAddedMessage("");
  };

  const goToTicketPrev = () => {
    setDirection(-1);
    setStep(4);
  };

  return {
    // Commercial/cart context passthrough
    snapshot,
    beerCatalog: BEERS,
    deliveryOptions,
    orderTypeOptions: ORDER_TYPES,
    priceDisclaimer,
    promotionConfig,
    items,
    addItem,
    updateQty,
    totalItems,
    totalPrice,
    orderSummary,
    extras,

    // Raw state and the DOM refs JSX needs to attach to
    state: {
      step,
      direction,
      orderId,
      selectedCategory,
      orderType,
      selectedBeer,
      selectedProductId,
      selectedPresentationId,
      genericQuantity,
      draftQuantities,
      lastAddedMessage,
      promoInput,
      promoStatus,
      drawerOpen,
      formData,
      recommendationStatus,
      recommendationError,
      whatsAppOpening,
      selectedWhatsAppChannelId,
      wizardTopRef,
      drawerToggleRef,
    },

    // Derived values, recomputed every render from state
    derived: {
      visibleCategories,
      activeCategory,
      activeCategoryProducts,
      isBeerCategory,
      selectedProduct,
      selectedPresentation,
      pendingBeerPreferenceNames,
      today,
      selectedDeliveryOption,
      deliveryRequiresAddress,
      hasCurrentSelection,
      hasCatalogProducts,
      genericCartDraft,
      hasGenericSelection,
      isConfigurablePackStep,
      canProceed,
      validationMessage,
      whatsAppOrderUrl,
      slideVariants,
      whatsAppChannels,
      selectedWhatsAppChannel,
      primaryActionLabel,
    },

    // Handlers, including the direct setters used as-is by simple selectors
    handlers: {
      setStep,
      setDirection,
      setSelectedCategory,
      setOrderType,
      setSelectedBeer,
      setSelectedProductId,
      setSelectedPresentationId,
      setLastAddedMessage,
      setPromoInput,
      setFormData,
      setDrawerOpen,
      setSelectedWhatsAppChannelId,
      setExtras,
      goNext,
      goPrev,
      applyPendingRecommendation,
      applyPromo,
      getDraftQuantity,
      setDraftQuantity,
      addDraftToOrder,
      setNormalizedGenericQuantity,
      addGenericDraftToOrder,
      handleWhatsAppOrderClick,
      handleWhatsAppOrderKeyDown,
      handleSelectCategory,
      handleSelectOrderType,
      handleSelectProduct,
      handleSelectPresentation,
      handleAddAnotherBeerProduct,
      handleAddAnotherGenericProduct,
      goToTicketPrev,
    },
  };
}

export type UseOrderWizardStateResult = ReturnType<typeof useOrderWizardState>;
