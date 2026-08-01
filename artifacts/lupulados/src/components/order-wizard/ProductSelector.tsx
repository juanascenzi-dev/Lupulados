import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/domain/format";
import type { CatalogProductOption } from "@/domain/productCatalog";
import { ProductImageFallback } from "@/components/order-wizard/ProductImageFallback";

interface ProductSelectorProps {
  products: CatalogProductOption[];
  selectedProductId: string;
  onSelect: (productId: string) => void;
}

export function ProductSelector({ products, selectedProductId, onSelect }: ProductSelectorProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <p className="text-white font-bold">No hay productos disponibles</p>
        <p className="text-sm text-muted-foreground mt-1">
          Elegí otra categoría o intentá nuevamente más tarde.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {products.map(({ product, variantLabel, priceFrom }) => {
        const selected = selectedProductId === product.id;
        return (
          <button
            key={product.id}
            type="button"
            onClick={() => onSelect(product.id)}
            aria-pressed={selected}
            className={cn(
              "group text-left rounded-2xl overflow-hidden border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
              selected
                ? "border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
                : "border-transparent bg-white/5 hover:border-amber-500/40",
            )}
          >
            <div className="relative h-28 overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(event) => {
                    (event.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <ProductImageFallback />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              {selected && (
                <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                  <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
            </div>
            <div
              className={cn("p-3 transition-colors", selected ? "bg-amber-500/10" : "bg-white/5")}
            >
              <h4
                className={cn(
                  "font-bold text-sm mb-1 leading-tight",
                  selected ? "text-amber-300" : "text-white",
                )}
              >
                {product.name}
              </h4>
              {variantLabel && variantLabel !== product.name && (
                <p className="text-xs text-white/65 mb-1">{variantLabel}</p>
              )}
              {product.description && (
                <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mb-2">
                  {product.description}
                </p>
              )}
              <p className="text-primary font-mono text-xs font-bold">
                Desde {formatPrice(priceFrom)}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
