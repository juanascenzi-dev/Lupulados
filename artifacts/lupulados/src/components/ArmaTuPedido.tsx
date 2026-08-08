import { type CSSProperties, type RefObject } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import type { BeverageMixItemEstimate } from "@/domain/beverageMix";
import { OrderWizardBubbles } from "@/components/order-wizard/OrderWizardBubbles";
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
import { LiveOrderSummary } from "@/components/order-wizard/LiveOrderSummary";
import { useOrderWizardState } from "@/hooks/useOrderWizardState";

interface ArmaTuPedidoProps {
  pendingRecommendation: BarrelRecommendation | null;
  pendingBeverageMix: BeverageMixItemEstimate[] | null;
  pendingBeerPreferenceIds: string[];
  sectionRef: RefObject<HTMLElement | null>;
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
    whatsAppOrderError,
    stepAnnouncement,
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
      <OrderWizardBubbles />

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
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {stepAnnouncement}
        </p>
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
            <h3 className="text-xl font-bold text-white mb-2">Catálogo no disponible</h3>
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
              whatsAppOrderError={whatsAppOrderError}
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
