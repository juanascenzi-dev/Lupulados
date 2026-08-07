import { cn } from "@/lib/utils";
import type { Beer } from "@/domain/beerCatalog";
import type { StoredCartItem } from "@/domain/cartStorage";
import { useConfigurableBeerPackBuilderState } from "@/hooks/useConfigurableBeerPackBuilderState";
import { PackBuilderHeader } from "@/components/configurable-beer-pack/PackBuilderHeader";
import { PackTabList } from "@/components/configurable-beer-pack/PackTabList";
import { PackEditorHeader } from "@/components/configurable-beer-pack/PackEditorHeader";
import { PackProductList } from "@/components/configurable-beer-pack/PackProductList";
import { PackSummaryPanel } from "@/components/configurable-beer-pack/PackSummaryPanel";
import { PackConfirmationDialog } from "@/components/configurable-beer-pack/PackConfirmationDialog";

interface ConfigurableBeerPackBuilderProps {
  beers: readonly Beer[];
  onAddPacks: (items: Array<{ item: Omit<StoredCartItem, "qty">; qty: number }>) => void;
  onAdded?: (message: string) => void;
  compact?: boolean;
  layout?: "default" | "wide";
}

export function ConfigurableBeerPackBuilder({
  beers,
  onAddPacks,
  onAdded,
  compact = false,
  layout = "default",
}: ConfigurableBeerPackBuilderProps) {
  const { state, derived, handlers } = useConfigurableBeerPackBuilderState({
    beers,
    onAddPacks,
    onAdded,
  });
  const { drafts, activeIndex, pendingConfirmation, activeButtonRef } = state;
  const {
    products,
    completeCount,
    totalBottles,
    totalPrice,
    allComplete,
    activeDraft,
    selectedCount,
    remainingCount,
    activePrice,
  } = derived;

  if (products.length === 0) {
    return (
      <section
        className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center"
        role="alert"
      >
        <h3 className="text-lg font-bold text-white">Pack de porrones no disponible</h3>
        <p className="mt-2 text-sm text-white/55">
          No hay estilos activos con porrón 500 ml y precio válido.
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "h-full min-h-0 rounded-2xl border border-white/10 bg-white/[0.045] p-2.5 md:p-4",
        compact ? "" : "",
      )}
    >
      <div
        className={cn(
          "flex h-full min-h-0 flex-col gap-3 lg:grid lg:items-stretch",
          layout === "wide"
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] xl:grid-cols-[minmax(0,1fr)_400px]"
            : "lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)]",
        )}
      >
        <div className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-3">
          <PackBuilderHeader
            packCount={drafts.length}
            onPackCountChange={handlers.setPackCount}
            decreaseButtonRef={activeButtonRef}
          />

          <PackTabList
            drafts={drafts}
            activeIndex={activeIndex}
            onSelect={handlers.setActiveIndex}
          />

          {activeDraft && (
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-2xl border border-white/10 bg-black/20 p-3">
              <PackEditorHeader
                activeIndex={activeIndex}
                draftsLength={drafts.length}
                selectedCount={selectedCount}
                remainingCount={remainingCount}
                activePrice={activePrice}
                onCopyPrevious={handlers.copyPrevious}
                onApplyToAll={handlers.applyToAll}
                onClearActive={handlers.clearActive}
              />
              <PackProductList
                products={products}
                activeDraft={activeDraft}
                activeIndex={activeIndex}
                selectedCount={selectedCount}
                onUpdateSelection={handlers.updateActiveSelection}
              />
            </div>
          )}
        </div>

        <PackSummaryPanel
          totalPrice={totalPrice}
          drafts={drafts}
          totalBottles={totalBottles}
          completeCount={completeCount}
          products={products}
          allComplete={allComplete}
          onAdd={handlers.handleAdd}
        />
      </div>

      <PackConfirmationDialog
        pendingConfirmation={pendingConfirmation}
        onOpenChange={(open) => !open && handlers.setPendingConfirmation(null)}
        onConfirm={handlers.confirmPending}
      />
    </section>
  );
}
