import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Sun, Users, Clock, Beer, Check } from "lucide-react";
import { calculateBarrelRecommendation, type BarrelRecommendation } from "@/domain/barrelCalculator";
import { formatPrice } from "@/domain/format";
import { cn } from "@/lib/utils";

const EVENT_TYPES = [
  {
    id: "tranqui",
    emoji: "🍽️",
    label: "Tranqui / Almuerzo",
    desc: "Consumo moderado",
    multiplier: 0.6,
  },
  {
    id: "normal",
    emoji: "🎉",
    label: "Fiesta Normal",
    desc: "Cumple o juntada",
    multiplier: 1.0,
  },
  {
    id: "intensa",
    emoji: "🔥",
    label: "Fiesta Intensa",
    desc: "Más consumo por persona",
    multiplier: 1.4,
  },
  {
    id: "festival",
    emoji: "🎪",
    label: "Festival",
    desc: "Evento largo y activo",
    multiplier: 1.8,
  },
] as const;

type EventTypeId = (typeof EVENT_TYPES)[number]["id"];

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
  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [minutes, setMinutes] = useState(0);
  const [type, setType] = useState<EventTypeId>("normal");
  const [isSummer, setIsSummer] = useState(false);

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

  const totalHoursDecimal = hours + minutes / 60;

  const durationLabel = (() => {
    const h = hours;
    const m = minutes;
    const hStr = `${h} hora${h !== 1 ? "s" : ""}`;
    if (m === 0) return `= ${hStr}`;
    return `= ${hStr} ${m} minutos`;
  })();

  useEffect(() => {
    const typeMultipliers: Record<EventTypeId, number> = {
      tranqui: 0.6,
      normal: 1.0,
      intensa: 1.4,
      festival: 1.8,
    };

    let calculatedLiters = guests * typeMultipliers[type];

    if (totalHoursDecimal > 4) {
      calculatedLiters *= 1 + 0.15 * (totalHoursDecimal - 4);
    } else if (totalHoursDecimal < 4) {
      calculatedLiters *= 1 - 0.15 * (4 - totalHoursDecimal);
    }

    if (isSummer) calculatedLiters *= 1.2;

    const finalLiters = Math.ceil(calculatedLiters);
    setTotalLiters(finalLiters);

    const barrelRecommendation = calculateBarrelRecommendation(finalLiters);
    setBarrelPlan(barrelRecommendation);
  }, [guests, hours, minutes, type, isSummer, totalHoursDecimal]);

  const isChipActive = (chip: { hours: number; minutes: number }) =>
    hours === chip.hours && minutes === chip.minutes;

  return (
    <section id="calculadora" className="py-24 bg-background relative border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center">
              Calculadora de Barriles
            </h2>
          </div>

          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ajustá los detalles de tu evento y estimá cuánta cerveza conviene pedir.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Inputs */}
            <div className="lg:col-span-7 space-y-8">

              {/* Guests */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Invitados
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGuestsChange(guests - 5)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold"
                    >−</button>
                    <input
                      type="number"
                      value={guests}
                      onChange={(e) => handleGuestsChange(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                      min="10"
                      max="500"
                    />
                    <button
                      onClick={() => handleGuestsChange(guests + 5)}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold"
                    >+</button>
                  </div>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="5"
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
                  <span>10</span>
                  <span>500+</span>
                </div>
              </div>

              {/* Duration */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-5">
                  <Clock className="w-4 h-4 text-primary" /> ¿Cuánto dura el evento?
                </label>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Hours input */}
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">Horas</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHoursChange(hours - 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >−</button>
                      <input
                        type="number"
                        value={hours}
                        onChange={(e) => handleHoursChange(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                        min="1"
                        max="12"
                      />
                      <button
                        onClick={() => handleHoursChange(hours + 1)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >+</button>
                    </div>
                  </div>

                  {/* Minutes input */}
                  <div>
                    <span className="text-xs text-muted-foreground block mb-2">Minutos</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMinutesChange(minutes - 15)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >−</button>
                      <input
                        type="number"
                        value={minutes}
                        onChange={(e) => handleMinutesChange(Number(e.target.value))}
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                        min="0"
                        max="45"
                        step="15"
                      />
                      <button
                        onClick={() => handleMinutesChange(minutes + 15)}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:border-primary transition-colors font-bold shrink-0"
                      >+</button>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-primary font-mono mb-4">{durationLabel}</p>

                {/* Quick chips */}
                <div className="flex flex-wrap gap-2">
                  {DURATION_CHIPS.map((chip) => (
                    <button
                      key={chip.label}
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
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Beer className="w-4 h-4 text-primary" /> Estilo de fiesta
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {EVENT_TYPES.map((t) => {
                    const selected = type === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={cn(
                          "relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-200",
                          selected
                            ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                            : "bg-white/5 border-white/10 hover:border-white/30"
                        )}
                      >
                        {selected && (
                          <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" strokeWidth={3} />
                          </span>
                        )}
                        <span className="text-3xl mb-2">{t.emoji}</span>
                        <span className={cn("font-bold text-sm leading-tight mb-1", selected ? "text-amber-400" : "text-white")}>
                          {t.label}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight">"{t.desc}"</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summer toggle */}
              <div
                onClick={() => setIsSummer(!isSummer)}
                className={cn(
                  "p-6 rounded-2xl border cursor-pointer transition-all flex flex-row items-center justify-between",
                  isSummer ? "bg-amber-500/10 border-amber-500/30" : "bg-white/5 border-white/10 hover:border-white/30"
                )}
              >
                <div className="flex items-center gap-4">
                  <Sun className={cn("w-10 h-10", isSummer ? "text-amber-500" : "text-muted-foreground")} />
                  <div className="text-left">
                    <span className="text-sm font-semibold text-white uppercase tracking-wider block mb-0.5">¿Es verano?</span>
                    <span className="text-xs text-muted-foreground">La gente toma más con calor (+20%)</span>
                  </div>
                </div>
                <div className={cn("w-12 h-6 rounded-full p-1 transition-colors", isSummer ? "bg-amber-500" : "bg-secondary")}>
                  <div className={cn("w-4 h-4 rounded-full bg-white transition-transform", isSummer ? "translate-x-6" : "translate-x-0")} />
                </div>
              </div>

            </div>

            {/* Output */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-black/40 rounded-3xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 w-full">
                  <span className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-2 block">Vas a necesitar</span>
                  <div className="text-7xl font-display font-bold text-white mb-2 tracking-tighter">
                    {totalLiters}<span className="text-3xl text-primary ml-1">L</span>
                  </div>

                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />

                  <span className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-3 block">Sugerencia de barriles</span>
                  <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-3 mb-6 font-mono font-bold text-lg w-full">
                    {barrelPlan.label}
                  </div>

                  <div className="mb-8">
                    <span className="text-white/40 text-xs block mb-1">Estimado desde</span>
                    <span className="text-white font-bold text-2xl">{formatPrice(barrelPlan.estimatedPrice)}</span>
                  </div>

                  <button
                    onClick={() => onUseRecommendation(barrelPlan)}
                    disabled={barrelPlan.parts.length === 0}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-lg shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:-translate-y-1 transition-all disabled:cursor-not-allowed disabled:opacity-50"
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
