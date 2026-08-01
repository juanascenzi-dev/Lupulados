import { Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummerToggleProps {
  isSummer: boolean;
  onToggle: () => void;
}

export function SummerToggle({ isSummer, onToggle }: SummerToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSummer}
      className={cn(
        "calculator-card w-full p-3.5 lg:p-4 rounded-2xl border cursor-pointer transition-all flex flex-row items-center justify-between gap-3",
        isSummer
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-white/5 border-white/10 hover:border-white/30",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Sun
          className={cn("w-6 h-6 shrink-0", isSummer ? "text-amber-500" : "text-muted-foreground")}
          aria-hidden="true"
        />
        <div className="text-left">
          <span className="text-sm font-semibold text-white uppercase tracking-wider block mb-0.5">
            ¿Es verano?
          </span>
          <span className="text-xs text-muted-foreground">La gente toma más con calor (+25%)</span>
        </div>
      </div>
      <div
        className={cn(
          "w-12 h-6 rounded-full p-1 transition-colors shrink-0",
          isSummer ? "bg-amber-500" : "bg-secondary",
        )}
      >
        <div
          className={cn(
            "w-4 h-4 rounded-full bg-white transition-transform",
            isSummer ? "translate-x-6" : "translate-x-0",
          )}
        />
      </div>
    </button>
  );
}
