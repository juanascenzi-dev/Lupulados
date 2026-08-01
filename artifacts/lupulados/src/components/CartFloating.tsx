import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useLocation } from "wouter";
import { useCart } from "@/context/CartContext";
import { shouldShowFloatingCart } from "@/domain/floatingCartVisibility";
import { scrollToSection } from "@/lib/utils";

interface CartFloatingProps {
  orderFlowActive?: boolean;
}

export function CartFloating({ orderFlowActive = false }: CartFloatingProps) {
  const { totalItems, totalPrice } = useCart();
  const [pathname] = useLocation();
  const hash = typeof window === "undefined" ? "" : window.location.hash;
  const visible = shouldShowFloatingCart({ totalItems, pathname, hash, orderFlowActive });

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scrollToSection("arma-tu-pedido", { updateHash: true })}
          className="fixed bottom-4 left-4 z-30 flex min-h-12 min-w-12 items-center justify-center rounded-full border border-amber-300 bg-primary p-3 text-black shadow-[0_0_20px_rgba(217,119,6,0.4)] font-bold sm:bottom-6 sm:left-6 sm:px-4 sm:py-3 sm:gap-3"
          aria-label={`Ver pedido, ${totalItems} items, total ${formatPrice(totalPrice)}`}
        >
          <div className="relative">
            <ShoppingCart className="w-6 h-6" aria-hidden="true" />
            <motion.div 
              key={totalItems} // triggers animation on change
              initial={{ scale: 1.5 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary"
            >
              {totalItems}
            </motion.div>
          </div>
          <div className="hidden flex-col items-start pr-2 sm:flex">
            <span className="text-xs uppercase tracking-wider opacity-80 leading-none">Ver Pedido</span>
            <span className="leading-none mt-1">{formatPrice(totalPrice)}</span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
