import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import { getPresentationDetails } from "@/domain/cartLineFormatting";
import type { CatalogProductOption } from "@/domain/productCatalog";

interface PresentationSelectorProps {
  product: CatalogProductOption;
  selectedPresentationId: string;
  onSelect: (presentationId: string) => void;
}

export function PresentationSelector({
  product,
  selectedPresentationId,
  onSelect,
}: PresentationSelectorProps) {
  return (
    <div className="grid gap-3">
      {product.presentations.map((presentation) => {
        const selected = selectedPresentationId === presentation.id;
        const details = getPresentationDetails(presentation);
        return (
          <button
            key={presentation.id}
            type="button"
            onClick={() => onSelect(presentation.id)}
            aria-pressed={selected}
            className={cn(
              "w-full rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary/10"
                : "border-white/10 bg-white/5 hover:border-primary/60",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-bold">{presentation.label}</p>
                {details.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">{details.join(" · ")}</p>
                )}
              </div>
              <p className="text-primary font-mono font-bold shrink-0">
                {formatPrice(presentation.unitPrice)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
