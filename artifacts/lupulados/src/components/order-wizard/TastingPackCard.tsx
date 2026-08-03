import { tastingPack } from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import type { StoredCartItem } from "@/domain/cartStorage";
import { QuantityStepper } from "@/components/ui/quantity-stepper";

const tastingPackDraft = { ...tastingPack, productCategory: "pack" as const };

interface TastingPackCardProps {
  getDraftQuantity: (id: string) => number;
  setDraftQuantity: (id: string, qty: number) => void;
  onAdd: (cartDraft: Omit<StoredCartItem, "qty">, qty: number) => void;
}

export function TastingPackCard({
  getDraftQuantity,
  setDraftQuantity,
  onAdd,
}: TastingPackCardProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-5">
      <div className="min-w-0">
        <h4 className="text-xl font-bold text-white">Pack Degustación</h4>
        <p className="mt-2 text-sm text-muted-foreground">
          Pack cerrado de 6 estilos surtidos. No requiere elegir un estilo individual.
        </p>
        <p className="mt-2 text-xs text-white/45">Incluye 6 botellas de estilos distintos.</p>
        <p className="text-primary font-mono font-bold mt-2">
          {formatPrice(tastingPack.price)} por pack
        </p>
        <p className="text-xs text-white/45 mt-1">
          Subtotal: {formatPrice(tastingPack.price * getDraftQuantity(tastingPack.id))}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <QuantityStepper
          value={getDraftQuantity(tastingPack.id)}
          onChange={(next) => setDraftQuantity(tastingPack.id, next)}
          decreaseAriaLabel="Restar cantidad de Pack Degustación"
          increaseAriaLabel="Sumar cantidad de Pack Degustación"
          valueAriaLabel="Cantidad de Pack Degustación"
        />
        <button
          type="button"
          onClick={() => onAdd(tastingPackDraft, getDraftQuantity(tastingPack.id))}
          className="px-5 py-3 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
        >
          Agregar al pedido
        </button>
      </div>
    </div>
  );
}
