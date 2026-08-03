import { Check, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationApplyCardProps {
  selectedBeerName: string | null;
  status: "idle" | "added" | "error";
  error: string;
  onApply: () => void;
}

export function RecommendationApplyCard({
  selectedBeerName,
  status,
  error,
  onApply,
}: RecommendationApplyCardProps) {
  return (
    <div className="mt-5 rounded-2xl border border-primary/20 bg-black/30 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-white font-bold">
            {selectedBeerName
              ? `Aplicar recomendación a ${selectedBeerName}`
              : "Aplicar recomendación de bebidas"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Podés ajustar cantidades o sumar otros estilos después.
          </p>
        </div>
        <button
          onClick={onApply}
          disabled={status === "added"}
          className={cn(
            "shrink-0 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
            status === "added"
              ? "bg-green-500/20 text-green-300 border border-green-500/30 cursor-default"
              : "bg-primary text-black hover:bg-amber-400",
          )}
        >
          {status === "added" ? (
            <>
              <Check className="w-4 h-4" /> Agregada al pedido
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Agregar recomendación al pedido
            </>
          )}
        </button>
      </div>
      {status === "error" && <p className="text-red-400 text-xs font-bold mt-3">{error}</p>}
    </div>
  );
}
