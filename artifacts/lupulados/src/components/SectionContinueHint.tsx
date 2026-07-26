import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionContinueHintProps {
  label?: string;
  className?: string;
}

export function SectionContinueHint({
  label = "Segui bajando para ver mas",
  className,
}: SectionContinueHintProps) {
  return (
    <div
      className={cn(
        "section-continue-hint mx-auto my-8 flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-black/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary/80",
        className,
      )}
    >
      <span>{label}</span>
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </div>
  );
}
