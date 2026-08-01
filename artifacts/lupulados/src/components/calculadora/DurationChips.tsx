import { DURATION_CHIPS, type DurationChipDef } from "@/domain/calculadoraConstants";
import { cn } from "@/lib/utils";

interface DurationChipsProps {
  isChipActive: (chip: DurationChipDef) => boolean;
  onSelect: (chip: DurationChipDef) => void;
}

export function DurationChips({ isChipActive, onSelect }: DurationChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DURATION_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelect(chip)}
          className={cn(
            "px-3 py-1.5 rounded-lg border text-sm font-bold transition-all",
            isChipActive(chip)
              ? "bg-primary text-black border-primary"
              : "bg-white/5 text-muted-foreground border-white/10 hover:border-white/30",
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
