import { cn } from "@/lib/utils";
import {
  getPackSelectedCount,
  isPackComplete,
  type PackDraft,
} from "@/domain/configurableBeerPack";

export function PackTabList({
  drafts,
  activeIndex,
  onSelect,
}: {
  drafts: readonly PackDraft[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
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
            onClick={() => onSelect(index)}
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
  );
}
