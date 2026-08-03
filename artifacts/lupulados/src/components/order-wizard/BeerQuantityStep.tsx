import { BeerPresentationLineCard } from "@/components/BeerPresentationLineCard";
import { ConfigurableBeerPackBuilder } from "@/components/ConfigurableBeerPackBuilder";
import { TastingPackCard } from "@/components/order-wizard/TastingPackCard";
import { RecommendationApplyCard } from "@/components/order-wizard/RecommendationApplyCard";
import {
  barrelPresentationIds,
  growlerPresentationIds,
  type Beer as CatalogBeer,
} from "@/domain/beerCatalog";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import type { StoredCartItem } from "@/domain/cartStorage";
import type { OrderType } from "@/domain/orderFlow";

interface BeerQuantityStepProps {
  isConfigurablePackStep: boolean;
  orderType: OrderType;
  selectedBeer: CatalogBeer | null;
  beers: CatalogBeer[];
  lastAddedMessage: string;
  items: StoredCartItem[];
  totalItems: number;
  getDraftQuantity: (id: string) => number;
  setDraftQuantity: (id: string, qty: number) => void;
  updateQty: (id: string, qty: number) => void;
  onAddDraft: (cartDraft: Omit<StoredCartItem, "qty">, qty: number) => void;
  onAddPacks: (lines: Array<{ item: Omit<StoredCartItem, "qty">; qty: number }>) => void;
  onLastAddedMessage: (message: string) => void;
  pendingRecommendation: BarrelRecommendation | null;
  recommendationStatus: "idle" | "added" | "error";
  recommendationError: string;
  onApplyRecommendation: () => void;
  onAddAnother: () => void;
}

export function BeerQuantityStep({
  isConfigurablePackStep,
  orderType,
  selectedBeer,
  beers,
  lastAddedMessage,
  items,
  totalItems,
  getDraftQuantity,
  setDraftQuantity,
  updateQty,
  onAddDraft,
  onAddPacks,
  onLastAddedMessage,
  pendingRecommendation,
  recommendationStatus,
  recommendationError,
  onApplyRecommendation,
  onAddAnother,
}: BeerQuantityStepProps) {
  return (
    <>
      {!isConfigurablePackStep && (
        <div className="text-center mb-6">
          <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            {orderType === "paquete" ? "Pack Degustación" : selectedBeer?.name}
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white">¿Cuánto necesitás?</h3>
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
          <TastingPackCard
            getDraftQuantity={getDraftQuantity}
            setDraftQuantity={setDraftQuantity}
            onAdd={onAddDraft}
          />
        )}
        {orderType === "barril" &&
          selectedBeer &&
          barrelPresentationIds.map((presentationId) => (
            <BeerPresentationLineCard
              key={presentationId}
              beer={selectedBeer}
              presentationId={presentationId}
              showDescription
              items={items}
              getDraftQuantity={getDraftQuantity}
              setDraftQuantity={setDraftQuantity}
              updateQty={updateQty}
              onAdd={onAddDraft}
            />
          ))}

        {orderType === "growler" &&
          selectedBeer &&
          growlerPresentationIds.map((presentationId) => (
            <BeerPresentationLineCard
              key={presentationId}
              beer={selectedBeer}
              presentationId={presentationId}
              showDescription={false}
              items={items}
              getDraftQuantity={getDraftQuantity}
              setDraftQuantity={setDraftQuantity}
              updateQty={updateQty}
              onAdd={onAddDraft}
            />
          ))}

        {orderType === "porrón" && (
          <ConfigurableBeerPackBuilder
            beers={beers}
            onAddPacks={onAddPacks}
            onAdded={onLastAddedMessage}
            layout="wide"
          />
        )}
      </div>

      {pendingRecommendation &&
        orderType === "barril" &&
        (selectedBeer || pendingRecommendation.parts.length === 0) && (
          <RecommendationApplyCard
            selectedBeerName={selectedBeer?.name ?? null}
            status={recommendationStatus}
            error={recommendationError}
            onApply={onApplyRecommendation}
          />
        )}

      {totalItems > 0 && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={onAddAnother}
            className="px-5 py-3 rounded-xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
          >
            Agregar otro producto
          </button>
        </div>
      )}
    </>
  );
}
