import { Check, Copy, MoreHorizontal, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import { CONFIGURABLE_BEER_PACK_CAPACITY } from "@/domain/configurableBeerPack";

export function PackEditorHeader({
  activeIndex,
  draftsLength,
  selectedCount,
  remainingCount,
  activePrice,
  onCopyPrevious,
  onApplyToAll,
  onClearActive,
}: {
  activeIndex: number;
  draftsLength: number;
  selectedCount: number;
  remainingCount: number;
  activePrice: number;
  onCopyPrevious: () => void;
  onApplyToAll: () => void;
  onClearActive: () => void;
}) {
  return (
    <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-center">
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              Pack {activeIndex + 1} de {draftsLength}
            </p>
            <p className="mt-0.5 text-xs font-bold text-white/65" role="status" aria-live="polite">
              {selectedCount === CONFIGURABLE_BEER_PACK_CAPACITY
                ? "Completo"
                : selectedCount > CONFIGURABLE_BEER_PACK_CAPACITY
                  ? "Supera el maximo"
                  : `Faltan ${remainingCount}`}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-sm font-black text-primary">{formatPrice(activePrice)}</p>
            <p className="text-xs font-bold text-white/55">
              {selectedCount}/{CONFIGURABLE_BEER_PACK_CAPACITY}
            </p>
          </div>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div
            className={cn(
              "h-full rounded-full transition-[width,background-color] duration-200",
              selectedCount === CONFIGURABLE_BEER_PACK_CAPACITY ? "bg-green-400" : "bg-primary",
            )}
            style={{
              width: `${Math.min(100, (selectedCount / CONFIGURABLE_BEER_PACK_CAPACITY) * 100)}%`,
            }}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-1 xl:grid-cols-3">
        <button
          type="button"
          aria-label={`Copiar composicion del Pack ${activeIndex} al Pack ${activeIndex + 1}`}
          disabled={activeIndex === 0}
          onClick={onCopyPrevious}
          className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-center text-xs font-bold text-white/65 hover:bg-white/10 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">Copiar anterior</span>
          <span className="sm:hidden">Copiar</span>
        </button>
        <button
          type="button"
          aria-label={`Usar composicion del Pack ${activeIndex + 1} en todos los packs`}
          onClick={onApplyToAll}
          className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-center text-xs font-bold text-white/65 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
        >
          <MoreHorizontal className="h-3.5 w-3.5 sm:hidden" aria-hidden="true" />
          <Check className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
          <span className="hidden sm:inline">Usar en todos</span>
          <span className="sm:hidden">Todos</span>
        </button>
        <button
          type="button"
          aria-label={`Vaciar composicion del Pack ${activeIndex + 1}`}
          onClick={onClearActive}
          className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-400/30 px-2 py-2 text-center text-xs font-bold text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:px-3"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Vaciar
        </button>
      </div>
    </div>
  );
}
