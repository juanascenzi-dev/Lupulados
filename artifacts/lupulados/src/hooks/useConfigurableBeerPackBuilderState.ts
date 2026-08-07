import { useMemo, useRef, useState } from "react";
import type { Beer } from "@/domain/beerCatalog";
import type { StoredCartItem } from "@/domain/cartStorage";
import {
  CONFIGURABLE_BEER_PACK_CAPACITY,
  applyCompositionToAllPacks,
  buildConfigurablePackCartItem,
  calculatePackPrice,
  copyPackComposition,
  createEmptyPackDraft,
  getPackRemainingCount,
  getPackSelectedCount,
  groupIdenticalPacks,
  hasOtherConfiguredPacks,
  isPackComplete,
  listPackAvailableProducts,
  normalizePackCount,
  resizePackDrafts,
  updatePackSelection,
  type PackDraft,
  type PendingPackConfirmation,
} from "@/domain/configurableBeerPack";

export interface UseConfigurableBeerPackBuilderStateInput {
  beers: readonly Beer[];
  onAddPacks: (items: Array<{ item: Omit<StoredCartItem, "qty">; qty: number }>) => void;
  onAdded?: (message: string) => void;
}

export function useConfigurableBeerPackBuilderState({
  beers,
  onAddPacks,
  onAdded,
}: UseConfigurableBeerPackBuilderStateInput) {
  const products = useMemo(() => listPackAvailableProducts(beers), [beers]);
  const validProductIds = useMemo(
    () => new Set(products.map((product) => product.productId)),
    [products],
  );
  const [drafts, setDrafts] = useState<PackDraft[]>(() => [createEmptyPackDraft()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingPackConfirmation>(null);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  const completeCount = drafts.filter(isPackComplete).length;
  const totalBottles = drafts.length * CONFIGURABLE_BEER_PACK_CAPACITY;
  const grouped = groupIdenticalPacks(drafts, products);
  const totalPrice = grouped.reduce((total, group) => total + group.unitPrice * group.qty, 0);
  const allComplete = drafts.length > 0 && completeCount === drafts.length;
  const activeDraft = drafts[activeIndex] ?? drafts[0];
  const selectedCount = activeDraft ? getPackSelectedCount(activeDraft) : 0;
  const remainingCount = activeDraft
    ? getPackRemainingCount(activeDraft)
    : CONFIGURABLE_BEER_PACK_CAPACITY;
  const activePrice = activeDraft ? calculatePackPrice(activeDraft, products) : 0;

  const setPackCount = (nextCount: number) => {
    const count = normalizePackCount(nextCount);
    const resized = resizePackDrafts(drafts, count);
    if (resized.needsConfirmation) {
      setPendingConfirmation({ type: "reduce", count });
      return;
    }
    setDrafts(resized.drafts);
    setActiveIndex((index) => Math.min(index, resized.drafts.length - 1));
  };

  const updateActiveSelection = (productId: string, quantity: number) => {
    setDrafts((current) =>
      current.map((draft, index) =>
        index === activeIndex
          ? updatePackSelection(draft, productId, quantity, validProductIds)
          : draft,
      ),
    );
  };

  const copyPrevious = () => {
    if (activeIndex <= 0) return;
    setDrafts((current) =>
      current.map((draft, index) =>
        index === activeIndex ? copyPackComposition(current[activeIndex - 1], draft.id) : draft,
      ),
    );
  };

  const applyToAll = () => {
    if (hasOtherConfiguredPacks(drafts, activeIndex)) {
      setPendingConfirmation({ type: "apply-all", sourceIndex: activeIndex });
      return;
    }
    setDrafts((current) => applyCompositionToAllPacks(current, activeIndex));
  };

  const clearActive = () => {
    setDrafts((current) =>
      current.map((draft, index) => (index === activeIndex ? createEmptyPackDraft(index) : draft)),
    );
  };

  const confirmPending = () => {
    if (!pendingConfirmation) return;
    if (pendingConfirmation.type === "reduce") {
      const resized = resizePackDrafts(drafts, pendingConfirmation.count, {
        allowDiscardConfigured: true,
      });
      setDrafts(resized.drafts);
      setActiveIndex((index) => Math.min(index, resized.drafts.length - 1));
    }
    if (pendingConfirmation.type === "apply-all") {
      setDrafts((current) => applyCompositionToAllPacks(current, pendingConfirmation.sourceIndex));
    }
    setPendingConfirmation(null);
    window.setTimeout(() => activeButtonRef.current?.focus(), 0);
  };

  const handleAdd = () => {
    if (!allComplete) return;
    const lines = grouped.map((group) => ({
      item: buildConfigurablePackCartItem(group.draft, products),
      qty: group.qty,
    }));
    onAddPacks(lines);
    onAdded?.(`Agregaste ${drafts.length} packs configurables, ${totalBottles} porrones en total.`);
    setDrafts([createEmptyPackDraft()]);
    setActiveIndex(0);
  };

  return {
    state: {
      drafts,
      activeIndex,
      pendingConfirmation,
      activeButtonRef,
    },

    derived: {
      products,
      completeCount,
      totalBottles,
      totalPrice,
      allComplete,
      activeDraft,
      selectedCount,
      remainingCount,
      activePrice,
    },

    handlers: {
      setActiveIndex,
      setPendingConfirmation,
      setPackCount,
      updateActiveSelection,
      copyPrevious,
      applyToAll,
      clearActive,
      confirmPending,
      handleAdd,
    },
  };
}

export type UseConfigurableBeerPackBuilderStateResult = ReturnType<
  typeof useConfigurableBeerPackBuilderState
>;
