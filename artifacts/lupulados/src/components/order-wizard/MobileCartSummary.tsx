import type { ReactNode, RefObject } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, ShoppingCart } from "lucide-react";
import { formatPrice } from "@/domain/format";
import type { Step } from "@/domain/orderWizardConstants";

interface MobileCartSummaryProps {
  step: Step;
  totalItems: number;
  totalPrice: number;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  drawerToggleRef: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}

export function MobileCartSummary({
  step,
  totalItems,
  totalPrice,
  drawerOpen,
  onToggleDrawer,
  drawerToggleRef,
  children,
}: MobileCartSummaryProps) {
  if (step < 3 || step > 4) return null;

  return (
    <div className="shrink-0 rounded-2xl border border-primary/20 bg-[#0f0f0f]/95 p-3 lg:hidden">
      <button
        ref={drawerToggleRef}
        type="button"
        onClick={onToggleDrawer}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={drawerOpen}
        aria-controls="mobile-order-drawer"
      >
        <span className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <ShoppingCart className="h-4 w-4 text-primary" aria-hidden="true" />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-black">
                {totalItems}
              </span>
            )}
          </span>
          <span>
            <span className="block text-xs leading-none text-white/50">
              {totalItems} item{totalItems !== 1 ? "s" : ""}
            </span>
            <span className="block text-base font-bold leading-tight text-white">
              {formatPrice(totalPrice)}
            </span>
          </span>
        </span>
        {drawerOpen ? (
          <ChevronDown className="h-4 w-4 text-white/45" aria-hidden="true" />
        ) : (
          <ChevronUp className="h-4 w-4 text-white/45" aria-hidden="true" />
        )}
      </button>
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            id="mobile-order-drawer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 max-h-[45dvh] overflow-y-auto border-t border-white/10 pt-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
