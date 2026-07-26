import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { scrollToSection } from "@/lib/utils";

export function CartFloating() {
  const { totalItems, totalPrice } = useCart();

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

  return (
    <AnimatePresence>
      {totalItems > 0 && (
        <motion.button
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => scrollToSection("arma-tu-pedido")}
          className="fixed bottom-6 left-6 z-50 bg-primary text-black px-4 py-3 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(217,119,6,0.4)] border border-amber-300 font-bold"
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
          <div className="flex flex-col items-start pr-2">
            <span className="text-xs uppercase tracking-wider opacity-80 leading-none">Ver Pedido</span>
            <span className="leading-none mt-1">{formatPrice(totalPrice)}</span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
