import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Sun, Users, Clock, Beer, Check, SlidersHorizontal } from "lucide-react";
import { calculateBarrelRecommendation, type BarrelRecommendation } from "@/domain/barrelCalculator";
import { estimateBeerLiters, EVENT_INTENSITY_MULTIPLIERS, type EventIntensity } from "@/domain/beerConsumptionEstimate";
import { formatDurationLabel } from "@/domain/eventDuration";
import { formatPrice } from "@/domain/format";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { cn } from "@/lib/utils";

const EVENT_TYPES: { id: EventIntensity; emoji: string; label: string; desc: string }[] = [
  {
    id: "tranqui",
    emoji: "🍽️",
    label: "Tranqui / Almuerzo",
    desc: "Consumo moderado",
  },
  {
    id: "normal",
    emoji: "🎉",
    label: "Fiesta Normal",
    desc: "Cumple o juntada",
  },
  {
    id: "intensa",
    emoji: "🔥",
    label: "Fiesta Intensa",
    desc: "Más consumo por persona",
  },
  {
    id: "festival",
    emoji: "🎪",
    label: "Festival",
    desc: "Evento largo y activo",
  },
];

type EventTypeId = EventIntensity;

interface CalculadoraProps {
  onUseRecommendation: (recommendation: BarrelRecommendation) => void;
}

const DURATION_CHIPS: { label: string; hours: number; minutes: number }[] = [
  { label: "2hs", hours: 2, minutes: 0 },
  { label: "2:30", hours: 2, minutes: 30 },
  { label: "3hs", hours: 3, minutes: 0 },
  { label: "3:30", hours: 3, minutes: 30 },
  { label: "4hs", hours: 4, minutes: 0 },
  { label: "5hs", hours: 5, minutes: 0 },
  { label: "6hs", hours: 6, minutes: 0 },
];

export function Calculadora({ onUseRecommendation }: CalculadoraProps) {
  const { priceDisclaimer, beerCatalog } = useCommercialDerivedData();
  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [minutes, setMinutes] = useState(0);
  const [type, setType] = useState<EventTypeId>("normal");
  const [isSummer, setIsSummer] = useState(false);
  const [selectedBeerId, setSelectedBeerId] = useState<string | null>(null);
  const [showLitersOverride, setShowLitersOverride] = useState(false);
  const [customLitersPerPerson, setCustomLitersPerPerson] = useState<number | null>(null);
  const selectedBeer = beerCatalog.find((beer) => beer.id === selectedBeerId) ?? null;

  const [totalLiters, setTotalLiters] = useState(0);
  const [barrelPlan, setBarrelPlan] = useState<BarrelRecommendation>(() =>
    calculateBarrelRecommendation(0),
  );

  const handleGuestsChange = (val: number) => {
    setGuests(Math.min(Math.max(val, 10), 500));
  };

  const handleHoursChange = (val: number) => {
    setHours(Math.min(Math.max(val, 1), 12));
  };

  const handleMinutesChange = (val: number) => {
    const stepped = Math.min(Math.max(Math.round(val / 15) * 15, 0), 45);
    setMinutes(stepped);
  };

  const LITERS_PER_PERSON_MIN = 0.2;
  const LITERS_PER_PERSON_MAX = 3;

  const handleLitersOverrideChange = (val: number) => {
    const rounded = Math.round(val * 10) / 10;
    setCustomLitersPerPerson(Math.min(Math.max(rounded, LITERS_PER_PERSON_MIN), LITERS_PER_PERSON_MAX));
  };

  const parseNumericInput = (raw: string): number | null => {
    if (raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };

  // Mientras se tipea solo se acota el techo (para no romper el cálculo con un número absurdo);
  // el piso y el redondeo a pasos de 15 (minutos) se aplican recién al salir del campo (onBlur),
  // así escribir "15" dígito por dígito no salta a "10" apenas se tipea el primer "1".
  const handleGuestsInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setGuests(Math.min(Math.max(value, 0), 500));
  };

  const handleHoursInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setHours(Math.min(Math.max(value, 0), 12));
  };

  const handleMinutesInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) setMinutes(Math.min(Math.max(value, 0), 59));
  };

  const handleLitersOverrideInputChange = (raw: string) => {
    const value = parseNumericInput(raw);
    if (value !== null) {
      setCustomLitersPerPerson(Math.min(Math.max(value, 0), LITERS_PER_PERSON_MAX));
    }
  };

  const standardLitersPerPerson = EVENT_INTENSITY_MULTIPLIERS[type];
  const effectiveLitersPerPerson = customLitersPerPerson ?? standardLitersPerPerson;

  const handleExpandLitersOverride = () => {
    setCustomLitersPerPerson((current) => current ?? standardLitersPerPerson);
    setShowLitersOverride(true);
  };

  const handleResetLitersOverride = () => {
    setCustomLitersPerPerson(null);
    setShowLitersOverride(false);
  };

  const totalHoursDecimal = hours + minutes / 60;

  const durationLabel = formatDurationLabel(hours, minutes);

  useEffect(() => {
    const finalLiters = estimateBeerLiters({
      guests,
      intensity: type,
      totalHoursDecimal,
      isSummer,
      litersPerPerson: customLitersPerPerson ?? undefined,
    });
    setTotalLiters(finalLiters);

    const barrelRecommendation = calculateBarrelRecommendation(finalLiters, selectedBeer, beerCatalog);
    setBarrelPlan(barrelRecommendation);
  }, [guests, hours, minutes, type, isSummer, totalHoursDecimal, selectedBeer, beerCatalog, customLitersPerPerson]);

  const isChipActive = (chip: { hours: number; minutes: number }) =>
    hours === chip.hours && minutes === chip.minutes;

  return (
    <section id="calculadora" className="calculator-section site-section site-section-compact bg-background relative border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div data-section-entry className="calculator-panel glass-panel p-4 sm:p-5 lg:p-6 rounded-3xl">
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
                <div className="flex justify-between items-center gap-3 mb-2.5">
                  <label htmlFor="calculator-guests" className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" aria-hidden="true" /> Invitados
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Restar 5 invitados"
                      onClick={() => handleGuestsChange(guests - 5)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold"
                    >−</button>
                    <input
                      id="calculator-guests"
                      type="number"
                      value={guests}
                      onChange={(e) => handleGuestsInputChange(e.target.value)}
                      onBlur={() => handleGuestsChange(guests)}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                      min="10"
                      max="500"
                      required
                      inputMode="numeric"
                      aria-describedby="calculator-guests-help"
                    />
                    <button
                      type="button"
                      aria-label="Sumar 5 invitados"
                      onClick={() => handleGuestsChange(guests + 5)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold"
                    >+</button>
                  </div>
                </div>
                <input
                  aria-label="Cantidad de invitados"
                  aria-describedby="calculator-guests-help"
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={guests}
                  onChange={(e) => handleGuestsChange(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-mono">
                  <span>10</span>
                  <span>500+</span>
                </div>
                <p id="calculator-guests-help" className="sr-only">
                  Elegi una cantidad entre 10 y 500 invitados.
                </p>
              </div>

              {/* Duration */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 mb-2.5">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" aria-hidden="true" /> ¿Cuánto dura el evento?
                  </label>
                  <span className="text-sm text-primary font-mono font-semibold">{durationLabel}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2.5">
                  {/* Hours input */}
                  <div>
                    <label htmlFor="calculator-hours" className="text-xs text-muted-foreground block mb-1.5">Horas</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Restar una hora"
                        onClick={() => handleHoursChange(hours - 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >−</button>
                      <input
                        id="calculator-hours"
                        type="number"
                        value={hours}
                        onChange={(e) => handleHoursInputChange(e.target.value)}
                        onBlur={() => handleHoursChange(hours)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                        min="1"
                        max="12"
                        required
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        aria-label="Sumar una hora"
                        onClick={() => handleHoursChange(hours + 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >+</button>
                    </div>
                  </div>

                  {/* Minutes input */}
                  <div>
                    <label htmlFor="calculator-minutes" className="text-xs text-muted-foreground block mb-1.5">Minutos</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="Restar 15 minutos"
                        onClick={() => handleMinutesChange(minutes - 15)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >−</button>
                      <input
                        id="calculator-minutes"
                        type="number"
                        value={minutes}
                        onChange={(e) => handleMinutesInputChange(e.target.value)}
                        onBlur={() => handleMinutesChange(minutes)}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                        min="0"
                        max="45"
                        step="15"
                        required
                        inputMode="numeric"
                      />
                      <button
                        type="button"
                        aria-label="Sumar 15 minutos"
                        onClick={() => handleMinutesChange(minutes + 15)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >+</button>
                    </div>
                  </div>
                </div>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2">
                  {DURATION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => { setHours(chip.hours); setMinutes(chip.minutes); }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
                        isChipActive(chip)
                          ? "bg-primary text-black border-primary"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                      )}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type — 4 large cards */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
                  <Beer className="w-4 h-4 text-primary" aria-hidden="true" /> Estilo de fiesta
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                  {EVENT_TYPES.map((t) => {
                    const selected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        aria-pressed={selected}
                        className={cn(
                          "calculator-event-option relative flex flex-col items-center justify-start text-center p-2.5 rounded-xl border transition-all duration-200 min-h-24 h-full",
                          selected
                            ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" strokeWidth={3} aria-hidden="true" />
                          </span>
                        )}
                        <span className="text-xl mb-1">{t.emoji}</span>
                        <span className={cn("font-bold text-sm leading-tight mb-1", selected ? "text-amber-400" : "text-white")}>
                          {t.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight line-clamp-2">"{t.desc}"</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Liters per person override — advanced/optional */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-primary" aria-hidden="true" /> Litros por persona
                  </label>
                  <span className="text-sm text-primary font-mono font-semibold">{effectiveLitersPerPerson.toFixed(1)} L</span>
                </div>

                {!showLitersOverride ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                      Usamos el estándar de "{EVENT_TYPES.find((t) => t.id === type)?.label}". Cambialo solo si conocés el consumo real de tu evento.
                    </p>
                    <button
                      type="button"
                      onClick={handleExpandLitersOverride}
                      className="shrink-0 px-3 py-1.5 rounded-lg border text-sm font-bold bg-white/5 text-muted-foreground border-white/10 hover:border-white/30 transition-all"
                    >
                      Personalizar
                    </button>
                  </div>
                ) : (
                  <div className="mt-2.5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <button
                        type="button"
                        aria-label="Restar 0.1 litros por persona"
                        onClick={() => handleLitersOverrideChange(effectiveLitersPerPerson - 0.1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >−</button>
                      <input
                        id="calculator-liters-per-person"
                        type="number"
                        value={effectiveLitersPerPerson}
                        onChange={(e) => handleLitersOverrideInputChange(e.target.value)}
                        onBlur={() => handleLitersOverrideChange(effectiveLitersPerPerson)}
                        className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                        min={LITERS_PER_PERSON_MIN}
                        max={LITERS_PER_PERSON_MAX}
                        step="0.1"
                        inputMode="decimal"
                      />
                      <button
                        type="button"
                        aria-label="Sumar 0.1 litros por persona"
                        onClick={() => handleLitersOverrideChange(effectiveLitersPerPerson + 0.1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >+</button>
                      <input
                        aria-label="Litros por persona"
                        type="range"
                        min={LITERS_PER_PERSON_MIN}
                        max={LITERS_PER_PERSON_MAX}
                        step="0.1"
                        value={effectiveLitersPerPerson}
                        onChange={(e) => handleLitersOverrideChange(Number(e.target.value))}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleResetLitersOverride}
                      className="text-xs text-muted-foreground hover:text-primary underline transition-colors"
                    >
                      Restablecer al estándar ({standardLitersPerPerson.toFixed(1)} L)
                    </button>
                  </div>
                )}
              </div>

              {/* Summer toggle */}
              <button
                type="button"
                onClick={() => setIsSummer(!isSummer)}
                aria-pressed={isSummer}
                className={cn(
                  "calculator-card w-full p-3.5 lg:p-4 rounded-2xl border cursor-pointer transition-all flex flex-row items-center justify-between gap-3",
                  isSummer ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10 hover:border-white/30"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Sun className={cn("w-6 h-6 shrink-0", isSummer ? "text-amber-500" : "text-muted-foreground")} aria-hidden="true" />
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white uppercase tracking-wider block mb-0.5">¿Es verano?</span>
                    <span className="text-xs text-muted-foreground">La gente toma más con calor (+25%)</span>
                  </div>
                </div>
                <div className={cn("w-12 h-6 rounded-full p-1 transition-colors shrink-0", isSummer ? "bg-amber-500" : "bg-secondary")}>
                  <div className={cn("w-4 h-4 rounded-full bg-white transition-transform", isSummer ? "translate-x-6" : "translate-x-0")} />
                </div>
              </button>

              {/* Beer style — optional, refines the price from "estimated minimum" to the real price */}
              <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
                <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
                  <Beer className="w-4 h-4 text-primary" aria-hidden="true" /> ¿Ya sabés qué estilo? (opcional)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedBeerId(null)}
                    aria-pressed={selectedBeerId === null}
                    className={cn(
                      "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
                      selectedBeerId === null
                        ? "bg-primary text-black border-primary"
                        : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                    )}
                  >
                    Cualquiera
                  </button>
                  {beerCatalog.map((beer) => (
                    <button
                      key={beer.id}
                      type="button"
                      onClick={() => setSelectedBeerId(beer.id)}
                      aria-pressed={selectedBeerId === beer.id}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
                        selectedBeerId === beer.id
                          ? "bg-primary text-black border-primary"
                          : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30"
                      )}
                    >
                      {beer.name}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Output */}
            <div className="lg:col-span-5">
              <div className="calculator-result-card bg-black/40 rounded-3xl p-4 lg:p-5 xl:p-6 border border-primary/20 flex flex-col items-center justify-start text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 w-full" role="status" aria-live="polite" aria-atomic="true">
                  <span className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-semibold mb-1.5 block">Vas a necesitar</span>
                  <div className="text-[clamp(3rem,6vw,4.75rem)] leading-none font-display font-bold text-white mb-1 tracking-tighter">
                    {totalLiters}<span className="text-2xl md:text-3xl text-primary ml-1">L</span>
                  </div>

                  <div className="calculator-result-divider h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-3 lg:my-4" />

                  <span className="text-white/60 text-xs md:text-sm uppercase tracking-widest font-semibold mb-2 block">Sugerencia de barriles</span>
                  <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-2.5 mb-3 lg:mb-4 font-mono font-bold text-base md:text-lg w-full">
                    {barrelPlan.label}
                  </div>

                  <div className="calculator-result-price mb-4 lg:mb-5">
                    <span className="text-white/40 text-xs block mb-1">
                      {selectedBeer ? `Precio para ${selectedBeer.name}` : "Estimado desde"}
                    </span>
                    <span className="text-white font-bold text-2xl">{formatPrice(barrelPlan.estimatedPrice)}</span>
                    <span className="text-white/35 text-xs block mt-1.5">{priceDisclaimer}</span>
                  </div>

                  <button
                    onClick={() => onUseRecommendation(barrelPlan)}
                    disabled={barrelPlan.parts.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-base md:text-lg shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:-translate-y-1 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Usar esta recomendación
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
