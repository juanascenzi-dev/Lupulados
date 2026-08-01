import { Calculator, Clock, SlidersHorizontal, Users, Wine } from "lucide-react";
import { BeerStylePicker } from "@/components/calculadora/BeerStylePicker";
import { DurationChips } from "@/components/calculadora/DurationChips";
import { EventTypeCards } from "@/components/calculadora/EventTypeCards";
import { ResultPanel } from "@/components/calculadora/ResultPanel";
import { SummerToggle } from "@/components/calculadora/SummerToggle";
import { NumericStepperField } from "@/components/ui/numeric-stepper-field";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";
import { BEVERAGE_LABELS } from "@/domain/beverageMix";
import { EVENT_TYPES, NON_BEER_TYPES } from "@/domain/calculadoraConstants";
import {
  LITERS_PER_PERSON_MAX,
  LITERS_PER_PERSON_MIN,
  useCalculadoraState,
} from "@/hooks/useCalculadoraState";
import { cn } from "@/lib/utils";

interface CalculadoraProps {
  onUseRecommendation: (recommendation: BarrelRecommendation) => void;
}

// Shared − / input / + classes for the men/women/hours/minutes steppers (flex-1 width).
const FLEX_STEPPER_FIELD_CLASSES = {
  wrapperClassName: "flex items-center gap-2",
  buttonClassName:
    "w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0",
  inputClassName:
    "flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors",
};

export function Calculadora({ onUseRecommendation }: CalculadoraProps) {
  const { priceDisclaimer, beerCatalog, state, derived, handlers } = useCalculadoraState();

  return (
    <section
      id="calculadora"
      className="calculator-section site-section site-section-compact bg-background relative border-t border-white/5 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div
          data-section-entry
          className="calculator-panel glass-panel p-4 sm:p-5 lg:p-6 rounded-3xl"
        >
          <div className="flex items-center justify-center gap-2.5 mb-2">
            <Calculator className="w-6 h-6 md:w-7 md:h-7 text-primary" aria-hidden="true" />
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white text-center">
              Calculadora de Barriles
            </h2>
          </div>

          <p className="calculator-copy text-center text-sm md:text-base text-muted-foreground mb-4 lg:mb-5 max-w-2xl mx-auto">
            Ajustá los detalles de tu evento y estimá cuánta cerveza conviene pedir.
          </p>

          <div className="calculator-grid grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 xl:gap-6">
            {/* Inputs */}
            <div className="calculator-controls lg:col-span-7 space-y-3 lg:space-y-4">
              {/* Guests */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 mb-2.5">
                  <label
                    htmlFor="calculator-guests"
                    className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-primary" aria-hidden="true" /> Invitados
                  </label>
                  <button
                    type="button"
                    aria-pressed={state.genderModeEnabled}
                    onClick={handlers.handleToggleGenderMode}
                    className="shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 transition-all"
                  >
                    {state.genderModeEnabled ? "Modo simple" : "Personalizar por género"}
                  </button>
                </div>

                {!state.genderModeEnabled ? (
                  <>
                    <NumericStepperField
                      id="calculator-guests"
                      value={state.guests}
                      step={5}
                      min={10}
                      max={500}
                      onChange={handlers.handleGuestsChange}
                      onInputChange={handlers.handleGuestsInputChange}
                      decreaseAriaLabel="Restar 5 invitados"
                      increaseAriaLabel="Sumar 5 invitados"
                      required
                      inputMode="numeric"
                      inputAriaDescribedBy="calculator-guests-help"
                      wrapperClassName="flex justify-end items-center gap-2 mb-2.5"
                      buttonClassName="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold"
                      inputClassName="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                    />
                    <input
                      aria-label="Cantidad de invitados"
                      aria-describedby="calculator-guests-help"
                      type="range"
                      min="10"
                      max="500"
                      step="5"
                      value={state.guests}
                      onChange={(e) => handlers.handleGuestsChange(Number(e.target.value))}
                      className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                      <span>10</span>
                      <span>500+</span>
                    </div>
                    <p id="calculator-guests-help" className="sr-only">
                      Elegi una cantidad entre 10 y 500 invitados.
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="calculator-men"
                          className="text-xs text-muted-foreground block mb-1.5"
                        >
                          Hombres
                        </label>
                        <NumericStepperField
                          id="calculator-men"
                          value={state.men}
                          step={1}
                          min={0}
                          max={500}
                          onChange={handlers.handleMenChange}
                          onInputChange={handlers.handleMenInputChange}
                          decreaseAriaLabel="Restar un hombre"
                          increaseAriaLabel="Sumar un hombre"
                          inputMode="numeric"
                          {...FLEX_STEPPER_FIELD_CLASSES}
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="calculator-women"
                          className="text-xs text-muted-foreground block mb-1.5"
                        >
                          Mujeres
                        </label>
                        <NumericStepperField
                          id="calculator-women"
                          value={state.women}
                          step={1}
                          min={0}
                          max={500}
                          onChange={handlers.handleWomenChange}
                          onInputChange={handlers.handleWomenInputChange}
                          decreaseAriaLabel="Restar una mujer"
                          increaseAriaLabel="Sumar una mujer"
                          inputMode="numeric"
                          {...FLEX_STEPPER_FIELD_CLASSES}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total:{" "}
                      <span className="text-primary font-mono font-semibold">
                        {state.men + state.women}
                      </span>{" "}
                      invitados
                    </p>
                  </div>
                )}
              </div>

              {/* Duration */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 mb-2.5">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" aria-hidden="true" /> ¿Cuánto dura el
                    evento?
                  </label>
                  <span className="text-sm text-primary font-mono font-semibold">
                    {derived.durationLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2.5">
                  {/* Hours input */}
                  <div>
                    <label
                      htmlFor="calculator-hours"
                      className="text-xs text-muted-foreground block mb-1.5"
                    >
                      Horas
                    </label>
                    <NumericStepperField
                      id="calculator-hours"
                      value={state.hours}
                      step={1}
                      min={1}
                      max={12}
                      onChange={handlers.handleHoursChange}
                      onInputChange={handlers.handleHoursInputChange}
                      decreaseAriaLabel="Restar una hora"
                      increaseAriaLabel="Sumar una hora"
                      required
                      inputMode="numeric"
                      {...FLEX_STEPPER_FIELD_CLASSES}
                    />
                  </div>

                  {/* Minutes input */}
                  <div>
                    <label
                      htmlFor="calculator-minutes"
                      className="text-xs text-muted-foreground block mb-1.5"
                    >
                      Minutos
                    </label>
                    <NumericStepperField
                      id="calculator-minutes"
                      value={state.minutes}
                      step={15}
                      inputStep={15}
                      min={0}
                      max={45}
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

                {/* Quick chips */}
                <DurationChips
                  isChipActive={derived.isChipActive}
                  onSelect={handlers.handleSelectDurationChip}
                />
              </div>

              {/* Event Type — 4 large cards */}
              <EventTypeCards type={state.type} onSelect={handlers.setType} />

              {/* Liters per person override — advanced/optional */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" /> Litros
                    por persona
                  </label>
                  <span className="text-sm text-primary font-mono font-semibold">
                    {derived.effectiveLitersPerPerson.toFixed(1)} L
                  </span>
                </div>

                {!state.showLitersOverride ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Usamos el estándar de "{EVENT_TYPES.find((t) => t.id === state.type)?.label}".
                      Cambialo solo si conocés el consumo real de tu evento.
                    </p>
                    <button
                      type="button"
                      onClick={handlers.handleExpandLitersOverride}
                      className="shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 transition-all"
                    >
                      Personalizar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <NumericStepperField
                      id="calculator-liters-per-person"
                      value={derived.effectiveLitersPerPerson}
                      step={0.1}
                      inputStep={0.1}
                      min={LITERS_PER_PERSON_MIN}
                      max={LITERS_PER_PERSON_MAX}
                      onChange={handlers.handleLitersOverrideChange}
                      onInputChange={handlers.handleLitersOverrideInputChange}
                      inputMode="decimal"
                      wrapperClassName="flex items-center gap-2 mb-2.5"
                      buttonClassName="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      inputClassName="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                      decreaseAriaLabel="Restar 0.1 litros por persona"
                      increaseAriaLabel="Sumar 0.1 litros por persona"
                      rangeSlider={{
                        ariaLabel: "Litros por persona",
                        step: 0.1,
                        className:
                          "flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary",
                      }}
                    />
                    <button
                      type="button"
                      onClick={handlers.handleResetLitersOverride}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                    >
                      Restablecer al estándar ({derived.standardLitersPerPerson.toFixed(1)} L)
                    </button>
                  </div>
                )}
              </div>

              {/* Summer toggle */}
              <SummerToggle
                isSummer={state.isSummer}
                onToggle={() => handlers.setIsSummer(!state.isSummer)}
              />

              {/* Beer style — optional, refines the price from "estimated minimum" to the real price */}
              <BeerStylePicker
                beerCatalog={beerCatalog}
                selectedBeerId={state.selectedBeerId}
                onSelect={handlers.setSelectedBeerId}
              />

              {/* Beverage mix — optional, splits consumption across beer + other drinks by % of guests */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Wine className="w-4 h-4 text-primary" aria-hidden="true" /> Mezcla de bebidas
                  </label>
                </div>

                {!state.showBeverageMix ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                      100% cerveza (comportamiento estándar).
                    </p>
                    <button
                      type="button"
                      onClick={() => handlers.setShowBeverageMix(true)}
                      className="shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 transition-all"
                    >
                      Personalizar mezcla
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5 space-y-2.5">
                    <div className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-3 py-1.5 text-sm font-bold inline-flex">
                      Cerveza: {derived.beerSharePercentage}% (resto)
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {NON_BEER_TYPES.map((bevType) => {
                        const active = derived.activeBeverageTypes.has(bevType);
                        return (
                          <button
                            key={bevType}
                            type="button"
                            onClick={() => handlers.handleToggleBeverageType(bevType)}
                            aria-pressed={active}
                            className={cn(
                              "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
                              active
                                ? "bg-primary text-black border-primary"
                                : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30",
                            )}
                          >
                            {BEVERAGE_LABELS[bevType]}
                          </button>
                        );
                      })}
                    </div>

                    {state.beverageMixShares
                      .filter((s) => s.percentage > 0)
                      .map((share) => (
                        <div key={share.type} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-16 shrink-0">
                            {BEVERAGE_LABELS[share.type]}
                          </span>
                          <input
                            aria-label={`Porcentaje de ${BEVERAGE_LABELS[share.type]}`}
                            type="range"
                            min={0}
                            max={100}
                            step={5}
                            value={share.percentage}
                            onChange={(e) =>
                              handlers.handleBeverageShareChange(share.type, Number(e.target.value))
                            }
                            className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <span className="text-sm text-primary font-mono font-semibold w-12 text-right shrink-0">
                            {share.percentage}%
                          </span>
                        </div>
                      ))}

                    <button
                      type="button"
                      onClick={handlers.handleResetBeverageMix}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                    >
                      Volver a solo cerveza
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Output */}
            <ResultPanel
              mixIsDefault={derived.mixIsDefault}
              totalLiters={state.totalLiters}
              barrelPlan={state.barrelPlan}
              selectedBeer={derived.selectedBeer}
              priceDisclaimer={priceDisclaimer}
              mixResult={state.mixResult}
              beerSharePercentage={derived.beerSharePercentage}
              onUseRecommendation={onUseRecommendation}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
