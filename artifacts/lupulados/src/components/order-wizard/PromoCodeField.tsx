import { Check, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPromotionValue } from "@/domain/promotionDiscount";
import type { PromotionType } from "@/domain/commercialTypes";

interface PromoCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  status: "none" | "valid" | "invalid";
  discountType: PromotionType;
  discountValue: number;
  placeholderCode: string;
}

export function PromoCodeField({
  value,
  onChange,
  onApply,
  status,
  discountType,
  discountValue,
  placeholderCode,
}: PromoCodeFieldProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary" /> Código Promocional
      </h3>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id="promo-code"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onApply()}
            placeholder={`Ej: ${placeholderCode}`}
            autoComplete="off"
            aria-invalid={status === "invalid"}
            aria-describedby={
              status === "invalid"
                ? "promo-code-error"
                : status === "valid"
                  ? "promo-code-success"
                  : undefined
            }
            className={cn(
              "w-full bg-white/5 border-2 rounded-xl py-3 px-4 text-white focus:outline-none transition-all uppercase placeholder:normal-case placeholder:text-white/30",
              status === "valid"
                ? "border-green-500/60"
                : status === "invalid"
                  ? "border-red-500/60"
                  : "border-white/10 focus:border-primary",
            )}
          />
          {status === "valid" && (
            <Check
              className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5"
              aria-hidden="true"
            />
          )}
          {status === "invalid" && (
            <X
              className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 w-5 h-5"
              aria-hidden="true"
            />
          )}
        </div>
        <button
          type="button"
          onClick={onApply}
          className="px-5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/10"
        >
          Aplicar
        </button>
      </div>
      {status === "valid" && (
        <p id="promo-code-success" className="text-green-400 text-xs mt-2 font-bold" role="status">
          ✓ ¡Descuento de {formatPromotionValue({ type: discountType, value: discountValue })}{" "}
          aplicado!
        </p>
      )}
      {status === "invalid" && (
        <p id="promo-code-error" className="text-red-300 text-xs mt-2 font-bold" role="alert">
          ✗ Código no válido
        </p>
      )}
    </div>
  );
}
