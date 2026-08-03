import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { formatPrice } from "@/domain/format";
import type { ProductPresentation } from "@/domain/commercialTypes";
import type { CatalogProductOption, CommercialCartLineDraft } from "@/domain/productCatalog";

interface GenericProductQuantityCardProps {
  selectedProduct: CatalogProductOption;
  selectedPresentation: ProductPresentation;
  genericCartDraft: CommercialCartLineDraft;
  genericQuantity: number;
  lastAddedMessage: string;
  totalItems: number;
  onQuantityChange: (qty: number) => void;
  onAdd: () => void;
  onAddAnother: () => void;
}

export function GenericProductQuantityCard({
  selectedProduct,
  selectedPresentation,
  genericCartDraft,
  genericQuantity,
  lastAddedMessage,
  totalItems,
  onQuantityChange,
  onAdd,
  onAddAnother,
}: GenericProductQuantityCardProps) {
  return (
    <>
      <div className="text-center mb-6">
        <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
          {selectedProduct.product.name}
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white">Elegí la cantidad</h3>
        {lastAddedMessage && (
          <p className="mt-3 text-sm font-bold text-green-300" role="status">
            {lastAddedMessage}
          </p>
        )}
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="min-w-0">
          <h4 className="text-lg font-bold text-white">{selectedPresentation.label}</h4>
          {selectedProduct.variantLabel &&
            selectedProduct.variantLabel !== selectedProduct.product.name && (
              <p className="text-xs text-muted-foreground mt-1">{selectedProduct.variantLabel}</p>
            )}
          <p className="text-primary font-mono font-bold mt-1">
            {formatPrice(selectedPresentation.unitPrice)}
          </p>
          <p className="text-xs text-white/45 mt-1">
            Subtotal: {formatPrice(selectedPresentation.unitPrice * genericQuantity)}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
          <QuantityStepper
            value={genericQuantity}
            onChange={onQuantityChange}
            decreaseAriaLabel={`Restar cantidad a agregar de ${genericCartDraft.name}`}
            increaseAriaLabel={`Sumar cantidad a agregar de ${genericCartDraft.name}`}
            valueAriaLabel={`Cantidad de ${genericCartDraft.name}`}
          />
          <button
            type="button"
            onClick={onAdd}
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
