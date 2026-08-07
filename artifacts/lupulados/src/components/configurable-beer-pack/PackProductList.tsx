import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatPrice } from "@/domain/format";
import {
  CONFIGURABLE_BEER_PACK_CAPACITY,
  type PackAvailableProduct,
  type PackDraft,
} from "@/domain/configurableBeerPack";

export function PackProductList({
  products,
  activeDraft,
  activeIndex,
  selectedCount,
  onUpdateSelection,
}: {
  products: readonly PackAvailableProduct[];
  activeDraft: PackDraft;
  activeIndex: number;
  selectedCount: number;
  onUpdateSelection: (productId: string, quantity: number) => void;
}) {
  return (
    <div className="grid min-h-0 gap-2 overflow-visible lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
      {products.map((product) => {
        const quantity =
          activeDraft.selections.find((selection) => selection.productId === product.productId)
            ?.quantity ?? 0;
        const canAdd = selectedCount < CONFIGURABLE_BEER_PACK_CAPACITY;
        return (
          <div
            key={product.productId}
            className="grid grid-cols-[minmax(0,1fr)_128px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2 sm:grid-cols-[minmax(0,1fr)_136px] sm:gap-3 sm:p-2.5"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{product.name}</p>
              <p className="font-mono text-xs text-primary">{formatPrice(product.price)} c/u</p>
            </div>
            <QuantityStepper
              value={quantity}
              onChange={(next) => onUpdateSelection(product.productId, next)}
              min={0}
              max={CONFIGURABLE_BEER_PACK_CAPACITY}
              disableDecrease={quantity <= 0}
              disableIncrease={!canAdd}
              decreaseAriaLabel={`Restar ${product.name} del Pack ${activeIndex + 1}`}
              increaseAriaLabel={`Sumar ${product.name} al Pack ${activeIndex + 1}`}
              valueAriaLabel={`Cantidad de ${product.name} en Pack ${activeIndex + 1}`}
              wrapperClassName="grid grid-cols-[40px_1fr_40px] items-center rounded-xl bg-white/10 p-1"
              buttonClassName="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              valueClassName="w-full"
            />
          </div>
        );
      })}
    </div>
  );
}
