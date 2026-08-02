import { useMemo, useState } from "react";
import { Wine } from "lucide-react";
import {
  BEVERAGE_LABELS,
  distributeBeverageMixShares,
  getBeerSharePercentage,
  getNonBeerShareTotal,
  normalizeBeverageMixShares,
  updateBeverageMixShare,
  validateBeverageMixShares,
  type BeverageMixShare,
  type NonBeerBeverageType,
} from "@/domain/beverageMix";
import { NON_BEER_TYPES } from "@/domain/calculadoraConstants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface BeverageMixPickerProps {
  shares: BeverageMixShare[];
  onChange: (shares: BeverageMixShare[]) => void;
}

function summarizeShares(shares: BeverageMixShare[]) {
  const normalized = normalizeBeverageMixShares(shares);
  const beerShare = getBeerSharePercentage(normalized);

  if (normalized.length === 0) {
    return { title: "Sin bebidas extra", detail: "Cerveza 100%" };
  }

  const labels = normalized.map((share) => `${BEVERAGE_LABELS[share.type]} ${share.percentage}%`);
  const detailItems = [`Cerveza ${beerShare}%`, ...labels];
  return {
    title: `${normalized.length} bebida${normalized.length > 1 ? "s" : ""} adicional${
      normalized.length > 1 ? "es" : ""
    }`,
    detail: `${detailItems.slice(0, 3).join(" � ")}${
      detailItems.length > 3 ? ` +${detailItems.length - 3}` : ""
    }`,
  };
}

export function BeverageMixPicker({ shares, onChange }: BeverageMixPickerProps) {
  const [open, setOpen] = useState(false);
  const [draftShares, setDraftShares] = useState<BeverageMixShare[]>([]);
  const normalizedShares = useMemo(() => normalizeBeverageMixShares(shares), [shares]);
  const draftNormalized = normalizeBeverageMixShares(draftShares);
  const activeTypes = new Set(draftNormalized.map((share) => share.type));
  const validationMessage = validateBeverageMixShares(draftShares);
  const nonBeerTotal = getNonBeerShareTotal(draftShares);
  const beerShare = getBeerSharePercentage(draftShares);
  const mixSummary = summarizeShares(normalizedShares);

  const openModal = () => {
    setDraftShares(normalizedShares);
    setOpen(true);
  };

  const setTypeActive = (type: NonBeerBeverageType, active: boolean) => {
    setDraftShares((current) => {
      if (!active) return updateBeverageMixShare(current, type, 0);
      if (normalizeBeverageMixShares(current).some((share) => share.type === type)) return current;
      return updateBeverageMixShare(current, type, 10);
    });
  };

  const apply = () => {
    if (validationMessage) return;
    onChange(normalizeBeverageMixShares(draftShares));
    setOpen(false);
  };

  return (
    <div className="calculator-card calculator-summary-card rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex h-full items-center justify-between gap-3">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Wine className="h-4 w-4 text-primary" aria-hidden="true" /> Mezcla de bebidas
          </span>
          <p className="mt-1 truncate text-xs text-muted-foreground">{mixSummary.title}</p>
          <p className="mt-1 truncate text-xs text-white/55">{mixSummary.detail}</p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-colors hover:border-primary"
        >
          Configurar
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(760px,calc(100dvh-2rem))] max-w-2xl overflow-hidden border-white/10 bg-[#15110d] text-white">
          <DialogHeader>
            <DialogTitle>Configurar mezcla de bebidas</DialogTitle>
            <DialogDescription>
              La cerveza es el porcentaje restante. Los productos finales se eligen en Arma tu
              Pedido.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 space-y-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3">
                <p className="text-xs text-white/55">Cerveza</p>
                <p className="text-2xl font-bold text-primary">{beerShare}%</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/55">Extras</p>
                <p className="text-2xl font-bold text-white">{nonBeerTotal}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {NON_BEER_TYPES.map((type) => {
                const active = activeTypes.has(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTypeActive(type, !active)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-bold transition-colors",
                      active
                        ? "border-primary bg-primary text-black"
                        : "border-white/10 bg-white/5 text-white/70 hover:border-white/30",
                    )}
                  >
                    {BEVERAGE_LABELS[type]}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[38dvh] space-y-3 overflow-y-auto pr-1">
              {draftNormalized.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                  No agregaste bebidas extra. La recomendacion usa 100% cerveza.
                </p>
              ) : (
                draftNormalized.map((share) => (
                  <div
                    key={share.type}
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <label
                        htmlFor={`beverage-share-${share.type}`}
                        className="font-bold text-white"
                      >
                        {BEVERAGE_LABELS[share.type]}
                      </label>
                      <input
                        id={`beverage-share-${share.type}`}
                        type="number"
                        min={0}
                        max={100}
                        step={5}
                        value={share.percentage}
                        onChange={(event) =>
                          setDraftShares((current) =>
                            updateBeverageMixShare(current, share.type, Number(event.target.value)),
                          )
                        }
                        className="h-10 w-20 rounded-lg border border-white/10 bg-black/30 px-2 text-center font-bold text-primary focus:border-primary focus:outline-none"
                      />
                    </div>
                    <input
                      aria-label={`Porcentaje de ${BEVERAGE_LABELS[share.type]}`}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={share.percentage}
                      onChange={(event) =>
                        setDraftShares((current) =>
                          updateBeverageMixShare(current, share.type, Number(event.target.value)),
                        )
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
                    />
                  </div>
                ))
              )}
            </div>

            <div aria-live="polite" className="text-xs">
              {validationMessage ? (
                <p className="text-red-300">{validationMessage}</p>
              ) : nonBeerTotal < 100 ? (
                <p className="text-white/45">
                  Queda {100 - nonBeerTotal}% asignado automaticamente a cerveza.
                </p>
              ) : (
                <p className="text-primary">Total asignado: 100%.</p>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={() => setDraftShares(distributeBeverageMixShares(Array.from(activeTypes)))}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
              disabled={activeTypes.size === 0}
            >
              Distribuir
            </button>
            <button
              type="button"
              onClick={() => setDraftShares([])}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={Boolean(validationMessage)}
              className="min-h-11 rounded-xl bg-primary px-5 font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              Aplicar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
