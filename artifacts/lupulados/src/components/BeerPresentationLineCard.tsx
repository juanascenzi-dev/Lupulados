import {
  createBeerCartItem,
  getBeerPresentation,
  type Beer as CatalogBeer,
} from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import type { StoredCartItem } from "@/domain/cartStorage";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

interface BeerPresentationLineCardProps {
  beer: CatalogBeer;
  presentationId: string;
  showDescription: boolean;
  items: StoredCartItem[];
  getDraftQuantity: (id: string) => number;
  setDraftQuantity: (id: string, qty: number) => void;
  updateQty: (id: string, qty: number) => void;
  onAdd: (cartDraft: Omit<StoredCartItem, "qty">, qty: number) => void;
}

export function BeerPresentationLineCard({
  beer,
  presentationId,
  showDescription,
  items,
  getDraftQuantity,
  setDraftQuantity,
  updateQty,
  onAdd,
}: BeerPresentationLineCardProps) {
  const size = getBeerPresentation(beer, presentationId);
  if (!size) return null;
  const cartDraft = createBeerCartItem(beer, presentationId);
  const itemId = cartDraft.id;
  const cartItem = items.find((item) => item.id === itemId);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className={showDescription ? "flex-1" : undefined}>
        <h4 className="text-lg font-bold text-white">{size.label}</h4>
        {showDescription && <p className="text-xs text-muted-foreground">{size.description}</p>}
        <p className="text-primary font-mono font-bold mt-1">{formatPrice(size.price)}</p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
        {cartItem ? (
          <QuantityStepper
            size="sm"
            editable={false}
            value={cartItem.qty}
            onChange={(next) => updateQty(itemId, next)}
            decreaseAriaLabel={`Restar una unidad de ${cartDraft.name}`}
            increaseAriaLabel={`Sumar una unidad de ${cartDraft.name}`}
            valueAriaLabel={`Cantidad actual ${cartItem.qty}`}
            valueClassName="w-9"
          />
        ) : (
          <QuantityStepper
            size="sm"
            value={getDraftQuantity(itemId)}
            onChange={(next) => setDraftQuantity(itemId, next)}
            decreaseAriaLabel={`Restar cantidad a agregar de ${cartDraft.name}`}
            increaseAriaLabel={`Sumar cantidad a agregar de ${cartDraft.name}`}
            valueAriaLabel={`Cantidad de ${cartDraft.name}`}
          />
        )}
        <button
          type="button"
          onClick={() => onAdd(cartDraft, cartItem ? 1 : getDraftQuantity(itemId))}
          className="px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
        >
          Agregar al pedido
        </button>
      </div>
    </div>
  );
}
