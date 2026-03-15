import { useState } from "react";
import { X, Beer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PromoBanner() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-primary/90 to-amber-600 text-primary-foreground relative z-50 overflow-hidden"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
            <div className="flex-1 flex justify-center items-center gap-2 text-sm md:text-base font-medium">
              <Beer className="w-4 h-4 md:w-5 md:h-5" />
              <p>
                <strong className="font-bold">10% OFF</strong> en tu primer alquiler — Usá el código <span className="bg-black/20 px-2 py-0.5 rounded text-white font-mono tracking-wider ml-1">PRIMERABIRRA</span>
              </p>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1 hover:bg-black/10 rounded-full transition-colors"
              aria-label="Cerrar banner"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
