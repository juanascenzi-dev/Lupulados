import { useMemo, useRef, useState } from "react";
import { Check, Copy, Minus, Plus, RotateCcw, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import type { Beer } from "@/domain/beerCatalog";
import type { StoredCartItem } from "@/domain/cartStorage";
import {
  CONFIGURABLE_BEER_PACK_CAPACITY,
  CONFIGURABLE_BEER_PACK_MAX_PACKS,
  applyCompositionToAllPacks,
  buildConfigurablePackCartItem,
  calculatePackPrice,
  copyPackComposition,
  createEmptyPackDraft,
  getPackRemainingCount,
  getPackSelectedCount,
  groupIdenticalPacks,
  isPackComplete,
  listPackAvailableProducts,
  normalizePackCount,
  resizePackDrafts,
  updatePackSelection,
  type PackDraft,
} from "@/domain/configurableBeerPack";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PendingConfirmation =
  | { type: "reduce"; count: number }
  | { type: "apply-all"; sourceIndex: number }
  | null;

interface ConfigurableBeerPackBuilderProps {
  beers: readonly Beer[];
  onAddPacks: (items: Array<{ item: Omit<StoredCartItem, "qty">; qty: number }>) => void;
  onAdded?: (message: string) => void;
  compact?: boolean;
}

export function ConfigurableBeerPackBuilder({
  beers,
  onAddPacks,
  onAdded,
  compact = false,
}: ConfigurableBeerPackBuilderProps) {
  const products = useMemo(() => listPackAvailableProducts(beers), [beers]);
  const validProductIds = useMemo(() => new Set(products.map((product) => product.productId)), [products]);
  const [drafts, setDrafts] = useState<PackDraft[]>(() => [createEmptyPackDraft()]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null);
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);

  const completeCount = drafts.filter(isPackComplete).length;
  const totalBottles = drafts.length * CONFIGURABLE_BEER_PACK_CAPACITY;
  const grouped = groupIdenticalPacks(drafts, products);
  const totalPrice = grouped.reduce((total, group) => total + group.unitPrice * group.qty, 0);
  const allComplete = drafts.length > 0 && completeCount === drafts.length;
  const activeDraft = drafts[activeIndex] ?? drafts[0];
  const selectedCount = activeDraft ? getPackSelectedCount(activeDraft) : 0;
  const remainingCount = activeDraft ? getPackRemainingCount(activeDraft) : CONFIGURABLE_BEER_PACK_CAPACITY;
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
        index === activeIndex ? updatePackSelection(draft, productId, quantity, validProductIds) : draft,
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
    const hasOtherConfigured = drafts.some((draft, index) => index !== activeIndex && getPackSelectedCount(draft) > 0);
    if (hasOtherConfigured) {
      setPendingConfirmation({ type: "apply-all", sourceIndex: activeIndex });
      return;
    }
    setDrafts((current) => applyCompositionToAllPacks(current, activeIndex));
  };

  const clearActive = () => {
    setDrafts((current) => current.map((draft, index) => (index === activeIndex ? createEmptyPackDraft(index) : draft)));
  };

  const confirmPending = () => {
    if (!pendingConfirmation) return;
    if (pendingConfirmation.type === "reduce") {
      const resized = resizePackDrafts(drafts, pendingConfirmation.count, { allowDiscardConfigured: true });
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

  if (products.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center" role="alert">
        <h3 className="text-lg font-bold text-white">Pack de porrones no disponible</h3>
        <p className="mt-2 text-sm text-white/55">No hay estilos activos con porrón 500 ml y precio válido.</p>
      </section>
    );
  }

  return (
    <section className={cn("rounded-2xl border border-white/10 bg-white/[0.045] p-4", compact ? "" : "md:p-5")}>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <header>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">Pack de porrones</p>
            <h3 className="mt-1 text-2xl font-black text-white">Pack configurable x6</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Cada pack contiene 6 porrones. Elegi los estilos y completa cada combinacion.
            </p>
          </header>

          <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/55">Cantidad de packs</p>
              <p className="text-xs text-white/40">Maximo {CONFIGURABLE_BEER_PACK_MAX_PACKS} packs por configuracion.</p>
            </div>
            <div className="flex items-center rounded-xl bg-white/10 p-1">
              <button
                ref={activeButtonRef}
                type="button"
                aria-label="Restar cantidad de packs"
                disabled={drafts.length <= 1}
                onClick={() => setPackCount(drafts.length - 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-35"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <input
                aria-label="Cantidad de packs"
                type="number"
                min={1}
                max={CONFIGURABLE_BEER_PACK_MAX_PACKS}
                value={drafts.length}
                onChange={(event) => setPackCount(Number(event.target.value))}
                className="h-10 w-14 rounded-lg bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                aria-label="Sumar cantidad de packs"
                disabled={drafts.length >= CONFIGURABLE_BEER_PACK_MAX_PACKS}
                onClick={() => setPackCount(drafts.length + 1)}
                className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-35"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Packs configurables">
            {drafts.map((draft, index) => {
              const selected = index === activeIndex;
              const complete = isPackComplete(draft);
              return (
                <button
                  key={draft.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "min-w-[112px] rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    selected ? "border-primary bg-primary text-black" : "border-white/10 bg-white/5 text-white/65 hover:border-primary/50",
                  )}
                >
                  <span className="block">Pack {index + 1} de {drafts.length}</span>
                  <span className="block font-normal">{complete ? "Completo" : `${getPackSelectedCount(draft)} de 6`}</span>
                </button>
              );
            })}
          </div>

          {activeDraft && (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-black text-white">Pack {activeIndex + 1} de {drafts.length}</h4>
                  <p className="mt-1 text-sm text-white/60" role="status" aria-live="polite">
                    {selectedCount === CONFIGURABLE_BEER_PACK_CAPACITY
                      ? "Pack completo: 6 de 6."
                      : selectedCount > CONFIGURABLE_BEER_PACK_CAPACITY
                        ? "Este pack supera el maximo permitido."
                        : `Faltan ${remainingCount} porrones para completar este pack.`}
                  </p>
                  <p className="mt-1 text-xs text-white/45">Precio estimado del pack: {formatPrice(activePrice)}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={activeIndex === 0} onClick={copyPrevious} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10 disabled:opacity-35">
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copiar anterior
                  </button>
                  <button type="button" onClick={applyToAll} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" /> Usar en todos
                  </button>
                  <button type="button" onClick={clearActive} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-white/65 hover:bg-white/10">
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Vaciar
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                {products.map((product) => {
                  const quantity = activeDraft.selections.find((selection) => selection.productId === product.productId)?.quantity ?? 0;
                  const canAdd = selectedCount < CONFIGURABLE_BEER_PACK_CAPACITY;
                  return (
                    <div key={product.productId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{product.name}</p>
                        <p className="font-mono text-xs text-primary">{formatPrice(product.price)} c/u</p>
                      </div>
                      <div className="flex items-center rounded-xl bg-white/10 p-1">
                        <button type="button" aria-label={`Restar ${product.name} del Pack ${activeIndex + 1}`} disabled={quantity <= 0} onClick={() => updateActiveSelection(product.productId, quantity - 1)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-35">
                          <Minus className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <input
                          aria-label={`Cantidad de ${product.name} en Pack ${activeIndex + 1}`}
                          type="number"
                          min={0}
                          max={CONFIGURABLE_BEER_PACK_CAPACITY}
                          value={quantity}
                          onChange={(event) => updateActiveSelection(product.productId, Number(event.target.value))}
                          className="h-9 w-12 rounded-lg bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button type="button" aria-label={`Sumar ${product.name} al Pack ${activeIndex + 1}`} disabled={!canAdd} onClick={() => updateActiveSelection(product.productId, quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-white/10 disabled:opacity-35">
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <h4 className="text-lg font-black text-white">Resumen</h4>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <p><span className="block text-white/45">Packs</span><span className="font-bold text-white">{drafts.length}</span></p>
            <p><span className="block text-white/45">Porrones</span><span className="font-bold text-white">{totalBottles}</span></p>
            <p><span className="block text-white/45">Completos</span><span className="font-bold text-white">{completeCount}</span></p>
            <p><span className="block text-white/45">Incompletos</span><span className="font-bold text-white">{drafts.length - completeCount}</span></p>
          </div>
          <p className="mt-3 font-mono text-xl font-black text-primary">Total estimado: {formatPrice(totalPrice)}</p>
          <div className="mt-4 space-y-3">
            {drafts.map((draft, index) => {
              const count = getPackSelectedCount(draft);
              const complete = isPackComplete(draft);
              const label = draft.selections.length
                ? draft.selections
                    .map((selection) => {
                      const product = products.find((candidate) => candidate.productId === selection.productId);
                      return `${selection.quantity} ${product?.name ?? "Estilo"}`;
                    })
                    .join(", ")
                : "Sin seleccion";
              return (
                <div key={draft.id} className="rounded-xl border border-white/10 bg-black/25 p-3 text-xs">
                  <p className="font-bold text-white">Pack {index + 1}</p>
                  <p className={complete ? "text-green-200" : "text-amber-100"}>{complete ? label : `Incompleto: ${count} de 6`}</p>
                  {complete && <p className="mt-1 font-mono text-primary">{formatPrice(calculatePackPrice(draft, products))}</p>}
                </div>
              );
            })}
          </div>
          {!allComplete && (
            <p className="mt-3 rounded-xl border border-amber-300/20 bg-black/20 p-3 text-xs text-amber-100" role="alert">
              Completa todos los packs para agregarlos al carrito.
            </p>
          )}
          <button
            type="button"
            disabled={!allComplete}
            onClick={handleAdd}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Agregar {drafts.length} {drafts.length === 1 ? "pack" : "packs"} al carrito
          </button>
        </aside>
      </div>

      <AlertDialog open={pendingConfirmation !== null} onOpenChange={(open) => !open && setPendingConfirmation(null)}>
        <AlertDialogContent className="border-white/10 bg-[#15110d] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cambio</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              {pendingConfirmation?.type === "reduce"
                ? "Vas a descartar packs con selecciones cargadas."
                : "Vas a reemplazar composiciones ya configuradas."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPending} className="bg-primary text-black hover:bg-amber-300">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
