import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrderTypeVisual } from "@/components/order-wizard/OrderTypeVisual";
import type { OrderType } from "@/domain/orderFlow";

export interface OrderTypeOption {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  desde: string;
  detail: string;
  img: string;
}

interface OrderTypeGridProps {
  orderTypes: readonly OrderTypeOption[];
  selectedOrderType: OrderType;
  canProceed: boolean;
  validationMessage: string | null;
  onSelect: (id: OrderType) => void;
}

export function OrderTypeGrid({
  orderTypes,
  selectedOrderType,
  canProceed,
  validationMessage,
  onSelect,
}: OrderTypeGridProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 overflow-visible sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
        {orderTypes.map((opt) => {
          const selected = selectedOrderType === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id as OrderType)}
              className={cn(
                "group relative flex flex-col text-left rounded-2xl border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
                selected
                  ? "border-amber-500 shadow-[0_0_25px_rgba(217,119,6,0.3)]"
                  : "border-white/10 hover:border-amber-500/50",
              )}
            >
              <div className="relative">
                <OrderTypeVisual option={opt} selected={selected} />
                {selected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                    className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-4 h-4 text-black" strokeWidth={3} />
                  </motion.div>
                )}
                <div className="absolute bottom-3 left-3 text-3xl">{opt.emoji}</div>
              </div>
              <div
                className={cn(
                  "p-3.5 flex-1 transition-colors",
                  selected ? "bg-amber-500/10" : "bg-white/5",
                )}
              >
                <h4
                  className={cn(
                    "font-bold text-base mb-1",
                    selected ? "text-amber-300" : "text-white",
                  )}
                >
                  {opt.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-snug mb-2">{opt.desc}</p>
                <p
                  className={cn(
                    "text-sm font-bold font-mono",
                    selected ? "text-amber-400" : "text-primary",
                  )}
                >
                  {opt.desde}
                </p>
                <p className="text-[10px] text-white/30 mt-1">{opt.detail}</p>
              </div>
            </button>
          );
        })}
      </div>
      {!canProceed && <p className="mt-3 text-center text-xs text-white/35">{validationMessage}</p>}
    </>
  );
}
