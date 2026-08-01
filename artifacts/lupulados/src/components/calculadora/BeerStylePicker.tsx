import { Beer } from "lucide-react";
import type { Beer as BeerType } from "@/domain/beerCatalog";
import { cn } from "@/lib/utils";

interface BeerStylePickerProps {
  beerCatalog: BeerType[];
  selectedBeerId: string | null;
  onSelect: (beerId: string | null) => void;
}

export function BeerStylePicker({ beerCatalog, selectedBeerId, onSelect }: BeerStylePickerProps) {
  return (
    <div className="calculator-card bg-white/5 p-3.5 lg:p-4 rounded-2xl border border-white/10">
      <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-2.5">
        <Beer className="w-4 h-4 text-primary" aria-hidden="true" /> ¿Ya sabés qué estilo?
        (opcional)
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSelect(null)}
          aria-pressed={selectedBeerId === null}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
            selectedBeerId === null
              ? "bg-primary text-black border-primary"
              : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30",
          )}
        >
          Cualquiera
        </button>
        {beerCatalog.map((beer) => (
          <button
            key={beer.id}
            type="button"
            onClick={() => onSelect(beer.id)}
            aria-pressed={selectedBeerId === beer.id}
            className={cn(
              "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
              selectedBeerId === beer.id
                ? "bg-primary text-black border-primary"
                : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30",
            )}
          >
            {beer.name}
          </button>
        ))}
      </div>
    </div>
  );
}
