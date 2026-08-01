import { useState, useEffect } from "react";
import { MessageCircle, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildWhatsAppUrlFromSnapshot } from "@/domain/commercialAdapters";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { getMotionAwareScrollBehavior } from "@/lib/reducedMotion";
import { PwaInstall } from "@/components/PwaInstall";
import { cn } from "@/lib/utils";

interface FloatingActionsProps {
  orderFlowActive?: boolean;
}

export function FloatingActions({ orderFlowActive = false }: FloatingActionsProps) {
  const [showTop, setShowTop] = useState(false);
  const { snapshot, primaryOrderWhatsAppChannel } = useCommercialDerivedData();

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: getMotionAwareScrollBehavior() });
  };

  return (
    <div
      className={cn(
        "fixed right-4 z-30 flex flex-col items-end gap-3 sm:right-6 sm:gap-4",
        orderFlowActive
          ? "bottom-[calc(6.5rem+max(0.75rem,env(safe-area-inset-bottom)))] sm:bottom-[calc(6rem+max(0.75rem,env(safe-area-inset-bottom)))]"
          : "bottom-4 sm:bottom-6",
      )}
    >
      <PwaInstall />

      <AnimatePresence>
        {showTop && !orderFlowActive && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="w-12 h-12 bg-card border border-white/10 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white/10 transition-colors"
            aria-label="Volver arriba"
          >
            <ArrowUp className="w-5 h-5" aria-hidden="true" />
          </motion.button>
        )}
      </AnimatePresence>

      {primaryOrderWhatsAppChannel ? (
        <a
          href={buildWhatsAppUrlFromSnapshot("Hola! Quiero hacer una consulta", primaryOrderWhatsAppChannel.phoneE164, snapshot)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-110 transition-all"
          aria-label="Chatear por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" aria-hidden="true" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="w-14 h-14 bg-white/10 text-white/40 rounded-full flex items-center justify-center cursor-not-allowed"
          aria-label="WhatsApp no disponible"
        >
          <MessageCircle className="w-7 h-7" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
