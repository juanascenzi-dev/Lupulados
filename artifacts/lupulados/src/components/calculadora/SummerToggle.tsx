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
        "calculator-card calculator-summer-card grid h-full w-full cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border p-3 text-left transition-all",
        isSummer
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-white/10 bg-white/5 hover:border-white/30",
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <Sun
          className={cn(
            "mt-0.5 h-5 w-5 shrink-0",
            isSummer ? "text-amber-500" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <span className="block truncate text-sm font-semibold uppercase tracking-wider text-white">
            Es verano?
          </span>
          <span className="mt-1 block text-xs leading-snug text-muted-foreground">
            La gente toma mas cuando hace calor (+25%).
          </span>
          <span className="mt-0.5 block text-xs leading-snug text-white/50">
            Activa esta opcion para ajustar automaticamente la recomendacion.
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-primary">
          +25%
        </span>
        <div
          className={cn(
            "h-6 w-12 rounded-full p-1 transition-colors",
            isSummer ? "bg-amber-500" : "bg-secondary",
          )}
        >
          <div
            className={cn(
              "h-4 w-4 rounded-full bg-white transition-transform",
              isSummer ? "translate-x-6" : "translate-x-0",
            )}
          />
        </div>
      </div>
    </button>
  );
}
