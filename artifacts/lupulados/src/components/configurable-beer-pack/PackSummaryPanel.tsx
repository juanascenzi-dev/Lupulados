import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import {
  calculatePackPrice,
  getPackSelectedCount,
  isPackComplete,
  type PackAvailableProduct,
  type PackDraft,
} from "@/domain/configurableBeerPack";

export function PackSummaryPanel({
  totalPrice,
  drafts,
  totalBottles,
  completeCount,
  products,
  allComplete,
  onAdd,
}: {
  totalPrice: number;
  drafts: readonly PackDraft[];
  totalBottles: number;
  completeCount: number;
  products: readonly PackAvailableProduct[];
  allComplete: boolean;
  onAdd: () => void;
}) {
  return (
    <aside className="grid min-h-0 min-w-0 grid-rows-[auto_auto_minmax(0,1fr)_auto_auto] rounded-2xl border border-primary/20 bg-primary/10 p-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-lg font-black text-white">Resumen</h4>
        <p className="font-mono text-lg font-black text-primary">{formatPrice(totalPrice)}</p>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-xs">
        <p className="rounded-lg bg-black/20 p-2">
          <span className="block text-white/45">Packs</span>
          <span className="font-bold text-white">{drafts.length}</span>
        </p>
        <p className="rounded-lg bg-black/20 p-2">
          <span className="block text-white/45">Porrones</span>
          <span className="font-bold text-white">{totalBottles}</span>
        </p>
        <p className="rounded-lg bg-black/20 p-2">
          <span className="block text-white/45">Ok</span>
          <span className="font-bold text-white">{completeCount}</span>
        </p>
        <p className="rounded-lg bg-black/20 p-2">
          <span className="block text-white/45">Faltan</span>
          <span className="font-bold text-white">{drafts.length - completeCount}</span>
        </p>
      </div>
      <div className="mt-3 min-h-0 space-y-1.5 overflow-y-auto pr-1">
        {drafts.map((draft, index) => {
          const count = getPackSelectedCount(draft);
          const complete = isPackComplete(draft);
          const label = draft.selections.length
            ? draft.selections
                .map((selection) => {
                  const product = products.find(
                    (candidate) => candidate.productId === selection.productId,
                  );
                  return `${selection.quantity} ${product?.name ?? "Estilo"}`;
                })
                .join(", ")
            : "Sin seleccion";
          return (
            <div
              key={draft.id}
              className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-white/10 bg-black/25 px-2 py-1.5 text-xs"
            >
              <p className="font-bold text-white">Pack {index + 1}</p>
              <p className={cn("truncate", complete ? "text-green-200" : "text-amber-100")}>
                {complete ? label : `${count}/6`}
              </p>
              <p className="font-mono text-primary">
                {complete ? formatPrice(calculatePackPrice(draft, products)) : `${count}/6`}
              </p>
            </div>
          );
        })}
      </div>
      {!allComplete && (
        <p
          className="mt-3 rounded-xl border border-amber-300/20 bg-black/20 p-2.5 text-xs text-amber-100"
          role="alert"
        >
          Completa todos los packs para agregarlos al carrito.
        </p>
      )}
      <button
        type="button"
        disabled={!allComplete}
        onClick={onAdd}
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        Agregar {drafts.length} {drafts.length === 1 ? "pack" : "packs"} al carrito
      </button>
    </aside>
  );
}
