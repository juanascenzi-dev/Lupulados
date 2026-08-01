import { Beer, Check } from "lucide-react";
import { EVENT_TYPES } from "@/domain/calculadoraConstants";
import type { EventIntensity } from "@/domain/beerConsumptionEstimate";
import { cn } from "@/lib/utils";

interface EventTypeCardsProps {
  type: EventIntensity;
  onSelect: (id: EventIntensity) => void;
}

export function EventTypeCards({ type, onSelect }: EventTypeCardsProps) {
  return (
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
              onClick={() => onSelect(t.id)}
              aria-pressed={selected}
              className={cn(
                "calculator-event-option relative flex flex-col items-center justify-start text-center p-2.5 rounded-xl border transition-all duration-200 min-h-24 h-full",
                selected
                  ? "bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.2)]"
                  : "bg-white/5 border-white/10 hover:border-white/30",
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              <span className="text-xl mb-1">{t.emoji}</span>
              <span
                className={cn(
                  "font-bold text-sm leading-tight mb-1",
                  selected ? "text-amber-400" : "text-white",
                )}
              >
                {t.label}
              </span>
              <span className="text-xs text-muted-foreground leading-tight line-clamp-2">
                "{t.desc}"
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
