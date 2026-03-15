import { X, Beer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PromoBannerProps {
  visible: boolean;
  onClose: () => void;
}

export function PromoBanner({ visible, onClose }: PromoBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "44px", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-primary/90 to-amber-600 text-primary-foreground overflow-hidden"
        >
          <div className="h-[44px] max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <div className="flex-1 flex justify-center items-center gap-2 text-sm md:text-base font-medium">
              <Beer className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
              <p>
                <strong className="font-bold">10% OFF</strong> en tu primer alquiler — Usá el código{" "}
                <span className="bg-black/20 px-2 py-0.5 rounded text-white font-mono tracking-wider ml-1">PRIMERABIRRA</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 rounded-full transition-colors shrink-0"
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
