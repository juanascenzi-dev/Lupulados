import { useMemo, useRef, useState } from "react";
import { Check, Copy, MoreHorizontal, RotateCcw, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
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
  layout?: "default" | "wide";
}

export function ConfigurableBeerPackBuilder({
  beers,
  onAddPacks,
  onAdded,
  compact = false,
  layout = "default",
}: ConfigurableBeerPackBuilderProps) {
  const products = useMemo(() => listPackAvailableProducts(beers), [beers]);
  const validProductIds = useMemo(
    () => new Set(products.map((product) => product.productId)),
    [products],
  );
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
    const hasOtherConfigured = drafts.some(
      (draft, index) => index !== activeIndex && getPackSelectedCount(draft) > 0,
    );
    if (hasOtherConfigured) {
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
          <header className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Pack de porrones
              </p>
              <h3 className="mt-0.5 text-lg font-black text-white md:mt-1 md:text-2xl">
                Pack configurable x6
              </h3>
              <p className="mt-1 hidden text-sm leading-relaxed text-white/60 sm:block">
                Cada pack contiene 6 porrones. Elegi los estilos y completa cada combinacion.
              </p>
            </div>
            <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 sm:min-w-[260px] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/55">
                  Cantidad de packs
                </p>
                <p className="text-xs text-white/40">
                  Maximo {CONFIGURABLE_BEER_PACK_MAX_PACKS} packs por configuracion.
                </p>
              </div>
              <QuantityStepper
                value={drafts.length}
                onChange={setPackCount}
                min={1}
                max={CONFIGURABLE_BEER_PACK_MAX_PACKS}
                disableAtBounds
                decreaseAriaLabel="Restar cantidad de packs"
                increaseAriaLabel="Sumar cantidad de packs"
                valueAriaLabel="Cantidad de packs"
                decreaseButtonRef={activeButtonRef}
              />
            </div>
          </header>

          <div
            className="flex gap-2 overflow-x-auto pb-1 [touch-action:pan-x_pan-y]"
            role="tablist"
            aria-label="Packs configurables"
          >
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
                    "min-w-[96px] rounded-xl border px-2.5 py-2 text-left text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:min-w-[112px] sm:px-3",
                    selected
                      ? "border-primary bg-primary text-black"
                      : "border-white/10 bg-white/5 text-white/65 hover:border-primary/50",
                  )}
                >
                  <span className="block">
                    Pack {index + 1} de {drafts.length}
                  </span>
                  <span className="block font-normal">
                    {complete ? "Completo" : `${getPackSelectedCount(draft)} de 6`}
                  </span>
                </button>
              );
            })}
          </div>

          {activeDraft && (
            <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="mb-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-center">
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">
                        Pack {activeIndex + 1} de {drafts.length}
                      </p>
                      <p
                        className="mt-0.5 text-xs font-bold text-white/65"
                        role="status"
                        aria-live="polite"
                      >
                        {selectedCount === CONFIGURABLE_BEER_PACK_CAPACITY
                          ? "Completo"
                          : selectedCount > CONFIGURABLE_BEER_PACK_CAPACITY
                            ? "Supera el maximo"
                            : `Faltan ${remainingCount}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-sm font-black text-primary">
                        {formatPrice(activePrice)}
                      </p>
                      <p className="text-xs font-bold text-white/55">
                        {selectedCount}/{CONFIGURABLE_BEER_PACK_CAPACITY}
                      </p>
                    </div>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                    aria-hidden="true"
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width,background-color] duration-200",
                        selectedCount === CONFIGURABLE_BEER_PACK_CAPACITY
                          ? "bg-green-400"
                          : "bg-primary",
                      )}
                      style={{
                        width: `${Math.min(
                          100,
                          (selectedCount / CONFIGURABLE_BEER_PACK_CAPACITY) * 100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-1 xl:grid-cols-3">
                  <button
                    type="button"
                    aria-label={`Copiar composicion del Pack ${activeIndex} al Pack ${activeIndex + 1}`}
                    disabled={activeIndex === 0}
                    onClick={copyPrevious}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-white/10 px-2 py-2 text-center text-xs font-bold text-white/65 hover:bg-white/10 disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-3"
                  >
                                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Copiar anterior</span>
                    <span className="sm:hidden">Copiar</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Usar composicion del Pack ${activeIndex + 1} en todos los packs`}
                    onClick={applyToAll}
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
                    onClick={clearActive}
                    className="flex min-h-10 items-center justify-center gap-1 rounded-lg border border-red-400/30 px-2 py-2 text-center text-xs font-bold text-red-200 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 sm:px-3"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Vaciar
                  </button>
                </div>
              </div>

              <div className="grid min-h-0 gap-2 overflow-visible lg:overflow-y-auto lg:overscroll-contain lg:pr-1">
                {products.map((product) => {
                  const quantity =
                    activeDraft.selections.find(
                      (selection) => selection.productId === product.productId,
                    )?.quantity ?? 0;
                  const canAdd = selectedCount < CONFIGURABLE_BEER_PACK_CAPACITY;
                  return (
                    <div
                      key={product.productId}
                      className="grid grid-cols-[minmax(0,1fr)_128px] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] p-2 sm:grid-cols-[minmax(0,1fr)_136px] sm:gap-3 sm:p-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{product.name}</p>
                        <p className="font-mono text-xs text-primary">
                          {formatPrice(product.price)} c/u
                        </p>
                      </div>
                      <QuantityStepper
                        value={quantity}
                        onChange={(next) => updateActiveSelection(product.productId, next)}
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
            </div>
          )}
        </div>

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
            onClick={handleAdd}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-black text-black transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
            Agregar {drafts.length} {drafts.length === 1 ? "pack" : "packs"} al carrito
          </button>
        </aside>
      </div>

      <AlertDialog
        open={pendingConfirmation !== null}
        onOpenChange={(open) => !open && setPendingConfirmation(null)}
      >
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
            <AlertDialogCancel className="border-white/10 bg-white/5 text-white hover:bg-white/10">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPending}
              className="bg-primary text-black hover:bg-amber-300"
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
