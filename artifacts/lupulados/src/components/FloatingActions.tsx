import { useState, useEffect } from "react";
import { MessageCircle, ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { buildWhatsAppUrl, primaryOrderWhatsAppChannel } from "@/domain/businessConfig";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            onClick={scrollToTop}
            className="w-12 h-12 bg-card border border-white/10 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-white/10 transition-colors"
            aria-label="Volver arriba"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {primaryOrderWhatsAppChannel ? (
        <a
          href={buildWhatsAppUrl("Hola! Quiero hacer una consulta 🍺", primaryOrderWhatsAppChannel.phoneE164)}
          target="_blank"
          rel="noopener noreferrer"
          className="w-14 h-14 bg-green-500 text-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] hover:scale-110 transition-all"
          aria-label="Chatear por WhatsApp"
        >
          <MessageCircle className="w-7 h-7" />
        </a>
      ) : (
        <button
          type="button"
          disabled
          className="w-14 h-14 bg-white/10 text-white/40 rounded-full flex items-center justify-center cursor-not-allowed"
          aria-label="WhatsApp no disponible"
        >
          <MessageCircle className="w-7 h-7" />
        </button>
      )}
      
    </div>
  );
}
