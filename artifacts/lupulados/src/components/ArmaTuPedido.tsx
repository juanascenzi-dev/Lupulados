import { type CSSProperties, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { ShoppingCart, Trash2, Beer, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCartItemImage } from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import { getCartLineTitle, getCompactCartLineDescription } from "@/domain/cartLineFormatting";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import type { BeverageMixItemEstimate } from "@/domain/beverageMix";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { BUBBLES } from "@/domain/orderWizardConstants";
import { OrderTypeGrid } from "@/components/order-wizard/OrderTypeGrid";
import { BeerStyleGrid } from "@/components/order-wizard/BeerStyleGrid";
import { PendingRecommendationSummary } from "@/components/order-wizard/PendingRecommendationSummary";
import { BeerQuantityStep } from "@/components/order-wizard/BeerQuantityStep";
import { GenericProductQuantityCard } from "@/components/order-wizard/GenericProductQuantityCard";
import { DeliveryOptionPicker } from "@/components/order-wizard/DeliveryOptionPicker";
import { PromoCodeField } from "@/components/order-wizard/PromoCodeField";
import { CustomerDetailsForm } from "@/components/order-wizard/CustomerDetailsForm";
import { OrderTicket } from "@/components/order-wizard/OrderTicket";
import { WizardActionBar } from "@/components/order-wizard/WizardActionBar";
import { MobileCartSummary } from "@/components/order-wizard/MobileCartSummary";
import { BeerGlassStepper } from "@/components/order-wizard/BeerGlassStepper";
import { CategorySelector } from "@/components/order-wizard/CategorySelector";
import { ProductSelector } from "@/components/order-wizard/ProductSelector";
import { PresentationSelector } from "@/components/order-wizard/PresentationSelector";
import { useOrderWizardState } from "@/hooks/useOrderWizardState";

interface ArmaTuPedidoProps {
  pendingRecommendation: BarrelRecommendation | null;
  pendingBeverageMix: BeverageMixItemEstimate[] | null;
  pendingBeerPreferenceIds: string[];
  sectionRef: RefObject<HTMLElement | null>;
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
          "min-h-0 flex-1 overscroll-contain pr-1",
          asDrawer ? "overflow-y-auto" : "overflow-visible",
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
                    <div className="mt-1">
                      <QuantityStepper
                        size="cart"
                        value={item.qty}
                        onChange={(next) => updateQty(item.id, next)}
                        decreaseAriaLabel={`Restar una unidad de ${item.name}`}
                        increaseAriaLabel={`Sumar una unidad de ${item.name}`}
                        valueAriaLabel={`Cantidad de ${item.name}`}
                      />
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

const wizardViewportStyle = {
  "--wizard-action-bottom-inset": "max(0.75rem, env(safe-area-inset-bottom))",
  "--wizard-viewport-height":
    "calc(100dvh - var(--site-sticky-offset) - 1.5rem - var(--wizard-action-bottom-inset))",
  scrollMarginTop: "calc(var(--site-sticky-offset) + var(--section-entry-gap))",
} as CSSProperties;

export function ArmaTuPedido({
  pendingRecommendation,
  pendingBeverageMix,
  pendingBeerPreferenceIds,
  sectionRef,
}: ArmaTuPedidoProps) {
  const {
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
    state,
    derived,
    handlers,
  } = useOrderWizardState({
    pendingRecommendation,
    pendingBeverageMix,
    pendingBeerPreferenceIds,
    sectionRef,
  });

  const {
    step,
    direction,
    orderId,
    orderType,
    selectedBeer,
    selectedProductId,
    selectedPresentationId,
    genericQuantity,
    lastAddedMessage,
    promoInput,
    promoStatus,
    drawerOpen,
    formData,
    recommendationStatus,
    recommendationError,
    whatsAppOpening,
    wizardTopRef,
    drawerToggleRef,
  } = state;

  const {
    visibleCategories,
    activeCategory,
    activeCategoryProducts,
    isBeerCategory,
    selectedProduct,
    selectedPresentation,
    pendingBeerPreferenceNames,
    today,
    deliveryRequiresAddress,
    hasCatalogProducts,
    genericCartDraft,
    isConfigurablePackStep,
    canProceed,
    validationMessage,
    whatsAppOrderUrl,
    slideVariants,
    whatsAppChannels,
    selectedWhatsAppChannel,
    primaryActionLabel,
  } = derived;

  const {
    setSelectedBeer,
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
  } = handlers;

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
          "relative z-10 mx-auto flex flex-col px-4 focus:outline-none sm:px-6 lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:px-8",
          isConfigurablePackStep
            ? "min-h-0"
            : "min-h-[min(760px,calc(100dvh-var(--site-sticky-offset)-1rem-var(--wizard-action-bottom-inset)))] lg:h-[var(--wizard-viewport-height)] lg:min-h-[min(620px,var(--wizard-viewport-height))]",
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
            <PendingRecommendationSummary
              recommendation={pendingRecommendation}
              selectedBeer={selectedBeer}
              pendingBeerPreferenceNames={pendingBeerPreferenceNames}
            />
          )}

          <CategorySelector
            categories={visibleCategories}
            selectedCategory={activeCategory}
            onSelect={handleSelectCategory}
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
                "min-h-0 flex-1 pb-[calc(6rem+max(0.75rem,env(safe-area-inset-bottom)))] lg:grid lg:gap-5 lg:pb-[calc(5.5rem+max(0.75rem,env(safe-area-inset-bottom)))]",
                isConfigurablePackStep ? "overflow-visible" : "overflow-hidden",
                isConfigurablePackStep ? "lg:grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_320px]",
              )}
            >
              {/* Wizard */}
              <div
                className={cn(
                  "relative min-h-0 min-w-0 pr-0 lg:pr-1",
                  isConfigurablePackStep
                    ? "overflow-visible"
                    : "overflow-y-auto overscroll-contain",
                )}
              >
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
                          <OrderTypeGrid
                            orderTypes={ORDER_TYPES}
                            selectedOrderType={orderType}
                            canProceed={canProceed}
                            validationMessage={validationMessage}
                            onSelect={handleSelectOrderType}
                          />
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-bold text-white mb-5 text-center">
                            Elegí un producto
                          </h3>
                          <ProductSelector
                            products={activeCategoryProducts}
                            selectedProductId={selectedProductId}
                            onSelect={handleSelectProduct}
                          />
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
                          <BeerStyleGrid
                            beers={BEERS}
                            selectedBeerId={selectedBeer?.id ?? null}
                            orderType={orderType}
                            onSelect={setSelectedBeer}
                          />
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
                            onSelect={handleSelectPresentation}
                          />
                        </>
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                          <p className="text-white font-bold">
                            Seleccioná un producto para continuar
                          </p>
                        </div>
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
                        <BeerQuantityStep
                          isConfigurablePackStep={isConfigurablePackStep}
                          orderType={orderType}
                          selectedBeer={selectedBeer}
                          beers={BEERS}
                          lastAddedMessage={lastAddedMessage}
                          items={items}
                          totalItems={totalItems}
                          getDraftQuantity={getDraftQuantity}
                          setDraftQuantity={setDraftQuantity}
                          updateQty={updateQty}
                          onAddDraft={addDraftToOrder}
                          onAddPacks={(lines) =>
                            lines.forEach((line) => addItem(line.item, line.qty))
                          }
                          onLastAddedMessage={setLastAddedMessage}
                          pendingRecommendation={pendingRecommendation}
                          recommendationStatus={recommendationStatus}
                          recommendationError={recommendationError}
                          onApplyRecommendation={applyPendingRecommendation}
                          onAddAnother={handleAddAnotherBeerProduct}
                        />
                      ) : selectedProduct && selectedPresentation && genericCartDraft ? (
                        <GenericProductQuantityCard
                          selectedProduct={selectedProduct}
                          selectedPresentation={selectedPresentation}
                          genericCartDraft={genericCartDraft}
                          genericQuantity={genericQuantity}
                          lastAddedMessage={lastAddedMessage}
                          totalItems={totalItems}
                          onQuantityChange={setNormalizedGenericQuantity}
                          onAdd={addGenericDraftToOrder}
                          onAddAnother={handleAddAnotherGenericProduct}
                        />
                      ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                          <p className="text-white font-bold">
                            Seleccioná una presentación para continuar
                          </p>
                        </div>
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
                          <DeliveryOptionPicker
                            deliveryOptions={deliveryOptions}
                            selectedDeliveryId={extras.delivery}
                            onSelect={(id) => setExtras((p) => ({ ...p, delivery: id }))}
                          />
                          <PromoCodeField
                            value={promoInput}
                            onChange={setPromoInput}
                            onApply={applyPromo}
                            status={promoStatus}
                            discountType={promotionConfig.type}
                            discountValue={promotionConfig.value}
                            placeholderCode={promotionConfig.code}
                          />
                        </div>

                        <CustomerDetailsForm
                          step={step}
                          canProceed={canProceed}
                          formData={formData}
                          onChange={setFormData}
                          today={today}
                          deliveryRequiresAddress={deliveryRequiresAddress}
                        />
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
                      <OrderTicket
                        orderId={orderId}
                        formData={formData}
                        orderSummary={orderSummary}
                        items={items}
                        totalPrice={totalPrice}
                        priceDisclaimer={priceDisclaimer}
                        whatsAppChannels={whatsAppChannels}
                        selectedChannelId={selectedWhatsAppChannel?.id ?? ""}
                        onSelectWhatsAppChannel={setSelectedWhatsAppChannelId}
                      />
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
            <MobileCartSummary
              step={step}
              totalItems={totalItems}
              totalPrice={totalPrice}
              drawerOpen={drawerOpen}
              onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
              drawerToggleRef={drawerToggleRef}
            >
              <LiveOrderSummary
                asDrawer
                onClose={() => {
                  setDrawerOpen(false);
                  drawerToggleRef.current?.focus();
                }}
              />
            </MobileCartSummary>
            <WizardActionBar
              step={step}
              canProceed={canProceed}
              validationMessage={validationMessage}
              primaryActionLabel={primaryActionLabel}
              whatsAppOrderUrl={whatsAppOrderUrl}
              whatsAppOpening={whatsAppOpening}
              onPrev={goPrev}
              onNext={goNext}
              onGoToTicketPrev={goToTicketPrev}
              onWhatsAppClick={handleWhatsAppOrderClick}
              onWhatsAppKeyDown={handleWhatsAppOrderKeyDown}
            />
          </>
        )}
      </div>
    </section>
  );
}
