import { useEffect, useRef, useState } from "react";
import { Calculator, ChevronLeft, ChevronRight, Clock, Users } from "lucide-react";
import { BeerStylePicker } from "@/components/calculadora/BeerStylePicker";
import { BeverageMixPicker } from "@/components/calculadora/BeverageMixPicker";
import { EventTypeCards } from "@/components/calculadora/EventTypeCards";
import { LitersPerPersonPicker } from "@/components/calculadora/LitersPerPersonPicker";
import { ResultPanel } from "@/components/calculadora/ResultPanel";
import { SummerToggle } from "@/components/calculadora/SummerToggle";
import { NumericStepperField } from "@/components/ui/numeric-stepper-field";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import { getBeerSharePercentage, type BeverageMixItemEstimate } from "@/domain/beverageMix";
import { EVENT_TYPES } from "@/domain/calculadoraConstants";
import { MAX_EVENT_DURATION_MINUTES } from "@/domain/eventDuration";
import { MAX_EVENT_GUESTS, MIN_EVENT_GUESTS } from "@/domain/eventGuestCount";
import {
  LITERS_PER_PERSON_MAX,
  LITERS_PER_PERSON_MIN,
  useCalculadoraState,
} from "@/hooks/useCalculadoraState";
import { cn } from "@/lib/utils";

interface CalculadoraProps {
  onUseRecommendation: (
    recommendation: BarrelRecommendation,
    mixResult: BeverageMixItemEstimate[],
    beerPreferenceIds: string[],
  ) => void;
}

const FLEX_STEPPER_FIELD_CLASSES = {
  wrapperClassName: "flex items-center gap-2 lg:gap-3",
  buttonClassName:
    "h-9 w-9 lg:h-12 lg:w-12 shrink-0 rounded-lg lg:rounded-xl border border-white/10 bg-white/5 text-base font-bold text-white transition-colors hover:border-primary lg:text-xl",
  inputClassName:
    "min-w-0 flex-1 rounded-lg lg:rounded-xl border border-white/10 bg-black/40 px-2 py-2 lg:px-3 lg:py-3 text-center font-bold text-primary transition-colors focus:border-primary focus:outline-none lg:text-lg",
};

const mobileSteps = [
  { id: 0, label: "Evento" },
  { id: 1, label: "Bebidas" },
  { id: 2, label: "Resumen" },
] as const;

export function Calculadora({ onUseRecommendation }: CalculadoraProps) {
  const { priceDisclaimer, beerCatalog, state, derived, handlers } = useCalculadoraState();
  const [mobileStep, setMobileStep] = useState(0);
  const mobileStepContentRef = useRef<HTMLDivElement | null>(null);

  const setMobileStepSafely = (step: number) => {
    setMobileStep(Math.min(Math.max(step, 0), mobileSteps.length - 1));
  };
  const goNext = () => setMobileStepSafely(mobileStep + 1);
  const goPrev = () => setMobileStepSafely(mobileStep - 1);

  useEffect(() => {
    const stepContent = mobileStepContentRef.current;
    if (!stepContent) return;

    stepContent.scrollTop = 0;
    const frame = window.requestAnimationFrame(() => {
      stepContent.scrollTop = 0;
    });

    return () => window.cancelAnimationFrame(frame);
  }, [mobileStep]);
  const eventTypeLabel = EVENT_TYPES.find((t) => t.id === state.type)?.label ?? "evento";
  const beerSharePercentage = getBeerSharePercentage(state.beverageMixShares);

  const guestControls = (
    <div className="calculator-card rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" /> Invitados
        </label>
        <span className="text-xs text-muted-foreground">
          Entre {MIN_EVENT_GUESTS} y {MAX_EVENT_GUESTS} invitados sugeridos.
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="calculator-guests" className="mb-1.5 block text-xs text-muted-foreground">
            Total invitados
          </label>
          <NumericStepperField
            id="calculator-guests"
            value={derived.effectiveGuestsTotal}
            step={5}
            inputStep={1}
            min={MIN_EVENT_GUESTS}
            max={MAX_EVENT_GUESTS}
            onChange={handlers.handleGuestsChange}
            onInputChange={handlers.handleGuestsInputChange}
            decreaseAriaLabel="Restar 5 invitados"
            increaseAriaLabel="Sumar 5 invitados"
            required
            inputMode="numeric"
            {...FLEX_STEPPER_FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor="calculator-men" className="mb-1.5 block text-xs text-muted-foreground">
            Hombres
          </label>
          <NumericStepperField
            id="calculator-men"
            value={state.men}
            step={1}
            min={0}
            max={MAX_EVENT_GUESTS}
            onChange={handlers.handleMenChange}
            onInputChange={handlers.handleMenInputChange}
            decreaseAriaLabel="Restar un hombre"
            increaseAriaLabel="Sumar un hombre"
            inputMode="numeric"
            {...FLEX_STEPPER_FIELD_CLASSES}
          />
        </div>
        <div>
          <label htmlFor="calculator-women" className="mb-1.5 block text-xs text-muted-foreground">
            Mujeres
          </label>
          <NumericStepperField
            id="calculator-women"
            value={state.women}
            step={1}
            min={0}
            max={MAX_EVENT_GUESTS}
            onChange={handlers.handleWomenChange}
            onInputChange={handlers.handleWomenInputChange}
            decreaseAriaLabel="Restar una mujer"
            increaseAriaLabel="Sumar una mujer"
            inputMode="numeric"
            {...FLEX_STEPPER_FIELD_CLASSES}
          />
        </div>
      </div>
    </div>
  );

  const durationControls = (
    <div className="calculator-card rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
          <Clock className="h-4 w-4 text-primary" aria-hidden="true" /> Duracion del evento
        </label>
        <span className="font-mono text-sm font-semibold text-primary">
          {derived.durationLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="calculator-hours" className="mb-1.5 block text-xs text-muted-foreground">
            Horas
          </label>
          <NumericStepperField
            id="calculator-hours"
            value={state.hours}
            step={1}
            min={0}
            max={Math.floor(MAX_EVENT_DURATION_MINUTES / 60)}
            onChange={handlers.handleHoursChange}
            onInputChange={handlers.handleHoursInputChange}
            decreaseAriaLabel="Restar una hora"
            increaseAriaLabel="Sumar una hora"
            required
            inputMode="numeric"
            {...FLEX_STEPPER_FIELD_CLASSES}
          />
        </div>
        <div>
          <label
            htmlFor="calculator-minutes"
            className="mb-1.5 block text-xs text-muted-foreground"
          >
            Minutos
          </label>
          <NumericStepperField
            id="calculator-minutes"
            value={state.minutes}
            step={15}
            inputStep={15}
            min={0}
            max={59}
            onChange={handlers.handleMinutesChange}
            onInputChange={handlers.handleMinutesInputChange}
            decreaseAriaLabel="Restar 15 minutos"
            increaseAriaLabel="Sumar 15 minutos"
            required
            inputMode="numeric"
            {...FLEX_STEPPER_FIELD_CLASSES}
          />
        </div>
      </div>
      {derived.durationValidationMessage && (
        <p className="mt-2 text-xs text-red-300" role="alert">
          {derived.durationValidationMessage}
        </p>
      )}
    </div>
  );

  const litersOverride = (
    <LitersPerPersonPicker
      standardLitersPerPerson={derived.standardLitersPerPerson}
      effectiveLitersPerPerson={derived.effectiveLitersPerPerson}
      eventTypeLabel={eventTypeLabel}
      min={LITERS_PER_PERSON_MIN}
      max={LITERS_PER_PERSON_MAX}
      onChange={handlers.handleLitersOverrideChange}
      onInputChange={handlers.handleLitersOverrideInputChange}
      onOpen={handlers.handleExpandLitersOverride}
      onReset={handlers.handleResetLitersOverride}
    />
  );

  const beverageMixCard = (
    <BeverageMixPicker
      shares={state.beverageMixShares}
      onChange={handlers.handleSetBeverageMixShares}
    />
  );

  const eventStep = (
    <div className="calculator-event-stack space-y-2.5">
      {guestControls}
      {durationControls}
      <EventTypeCards type={state.type} onSelect={handlers.setType} />
      <div className="calculator-summary-row grid items-stretch gap-2.5 md:grid-cols-2">
        {litersOverride}
        <BeerStylePicker
          beerCatalog={beerCatalog}
          selectedBeerIds={state.selectedBeerIds}
          onChange={handlers.setSelectedBeerIds}
        />
      </div>
    </div>
  );
  const preferenceCards = (
    <div className="space-y-3">
      <SummerToggle
        isSummer={state.isSummer}
        onToggle={() => handlers.setIsSummer(!state.isSummer)}
      />
      <BeerStylePicker
        beerCatalog={beerCatalog}
        selectedBeerIds={state.selectedBeerIds}
        onChange={handlers.setSelectedBeerIds}
      />
      {beverageMixCard}
    </div>
  );

  const mobilePreferenceStep = (
    <div className="space-y-3">
      {litersOverride}
      {preferenceCards}
    </div>
  );

  const selectedBeerName =
    beerCatalog.find((beer) => beer.id === state.barrelPlan.beerId)?.name ?? null;

  const resultPanel = (
    <ResultPanel
      mixIsDefault={derived.mixIsDefault}
      totalLiters={state.totalLiters}
      barrelPlan={state.barrelPlan}
      selectedBeerName={selectedBeerName}
      priceDisclaimer={priceDisclaimer}
      mixResult={state.mixResult}
      durationValidationMessage={derived.durationValidationMessage}
      onUseRecommendation={(recommendation, mixResult) =>
        onUseRecommendation(recommendation, mixResult, state.selectedBeerIds)
      }
    />
  );

  const mobileSummary = (
    <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
      <button
        type="button"
        onClick={() => setMobileStepSafely(0)}
        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
      >
        <span className="block text-xs uppercase tracking-wider text-white/45">Evento</span>
        <span className="font-bold text-white">
          {derived.effectiveGuestsTotal} invitados, {derived.durationLabel.replace("= ", "")}
        </span>
      </button>
      <button
        type="button"
        onClick={() => setMobileStepSafely(1)}
        className="rounded-2xl border border-white/10 bg-white/5 p-3 text-left"
      >
        <span className="block text-xs uppercase tracking-wider text-white/45">Bebidas</span>
        <span className="font-bold text-white">
          {derived.effectiveLitersPerPerson.toFixed(1)} L/persona, cerveza {beerSharePercentage}%
        </span>
      </button>
    </div>
  );

  return (
    <section
      id="calculadora"
      className="calculator-section viewport-task-section site-section relative overflow-x-hidden border-t border-white/5 bg-background"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)]" />

      <div className="viewport-task-container relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div data-section-entry className="calculator-panel glass-panel rounded-3xl p-4 sm:p-5">
          <div className="calculator-header flex shrink-0 flex-col items-center gap-1 pb-3 text-center">
            <div className="flex items-center justify-center gap-2.5">
              <Calculator className="h-6 w-6 text-primary md:h-7 md:w-7" aria-hidden="true" />
              <h2 className="font-display text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                Calculadora de Barriles
              </h2>
            </div>
            <p className="calculator-copy max-w-2xl text-sm text-muted-foreground md:text-base">
              Estima litros, formatos y bebidas sin perder de vista la recomendacion.
            </p>
          </div>

          <div className="calculator-desktop-grid hidden min-h-0 grid-cols-12 gap-4 lg:grid">
            <div className="calculator-scroll-panel calculator-controls col-span-7 min-h-0 space-y-3 overflow-y-auto pr-1">
              {eventStep}
            </div>
            <div className="calculator-scroll-panel calculator-right-stack col-span-5 min-h-0 space-y-2.5 overflow-hidden">
              {resultPanel}
              <SummerToggle
                isSummer={state.isSummer}
                onToggle={() => handlers.setIsSummer(!state.isSummer)}
              />
              {beverageMixCard}
            </div>
          </div>

          <div className="calculator-mobile-flow flex min-h-0 flex-1 flex-col lg:hidden">
            <div className="mb-3 grid shrink-0 grid-cols-3 gap-2">
              {mobileSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setMobileStepSafely(step.id)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-bold",
                    mobileStep === step.id
                      ? "border-primary bg-primary text-black"
                      : "border-white/10 bg-white/5 text-white/60",
                  )}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <div
              ref={mobileStepContentRef}
              className="calculator-mobile-step min-h-0 flex-1 overflow-y-auto pr-1"
            >
              {mobileStep === 0 && (
                <div className="space-y-3">
                  {guestControls}
                  {durationControls}
                  <EventTypeCards type={state.type} onSelect={handlers.setType} />
                </div>
              )}
              {mobileStep === 1 && mobilePreferenceStep}
              {mobileStep === 2 && (
                <>
                  {resultPanel}
                  {mobileSummary}
                </>
              )}
            </div>

            <div className="calculator-mobile-actions mt-3 grid shrink-0 grid-cols-2 gap-2 pb-[env(safe-area-inset-bottom)]">
              <button
                type="button"
                onClick={goPrev}
                disabled={mobileStep === 0}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Volver
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={mobileStep === mobileSteps.length - 1}
                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continuar <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
