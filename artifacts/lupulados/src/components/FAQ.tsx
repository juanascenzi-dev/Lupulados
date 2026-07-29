import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { buildWhatsAppUrl } from "@/domain/businessConfig";
import { cn } from "@/lib/utils";
import { SectionContinueHint } from "@/components/SectionContinueHint";

const FAQS = [
  {
    q: "¿Qué incluye el alquiler del barril?",
    a: "Incluye la cerveza que elijas (20L, 30L o 50L), la chopera (a hielo o eléctrica según disponibilidad), el tubo de CO2, regulador, y la instalación en el lugar para que quede lista para servir."
  },
  {
    q: "¿Cuánto tiempo antes debo reservar?",
    a: "Recomendamos reservar con al menos 1 semana de anticipación para asegurar disponibilidad de estilos y equipos, especialmente en temporada alta (noviembre-diciembre)."
  },
  {
    q: "¿Hacen entregas a domicilio?",
    a: "Sí, contemplamos entrega según zona y retiro en fábrica. El costo o punto de retiro se confirma al coordinar el pedido."
  },
  {
    q: "¿Qué pasa si sobra cerveza?",
    a: "La cerveza sobrante no tiene devolución. Te recomendamos usar nuestra Calculadora de Barriles para pedir la cantidad justa y evitar que sobre."
  },
  {
    q: "¿Aceptan Mercado Pago / transferencia?",
    a: "Sí, aceptamos transferencia bancaria, Mercado Pago y efectivo. Pedimos una seña del 50% para confirmar la reserva."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="site-section site-section-compact bg-background relative">
      <div data-section-entry className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3">
            Preguntas Frecuentes
          </h2>
          <p className="text-muted-foreground">Todo lo que necesitás saber antes de pedir tu barril.</p>
        </div>

        <div className="space-y-3 mb-7 md:mb-8">
          {FAQS.slice(0, 3).map((faq, i) => (
            <div 
              key={i} 
              className={cn(
                "border rounded-lg transition-colors duration-300",
                openIndex === i ? "bg-white/5 border-primary/30" : "bg-card border-white/5 hover:border-white/10"
              )}
            >
              <button
                id={`faq-question-${i}`}
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
                aria-controls={`faq-answer-${i}`}
                className="flex min-h-14 items-center justify-between w-full p-4 md:px-5 md:py-4 text-left gap-4"
              >
                <span className="text-base md:text-lg font-bold text-white">{faq.q}</span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-primary transition-transform duration-300",
                    openIndex === i ? "rotate-180" : ""
                  )} 
                  aria-hidden="true"
                />
              </button>
              
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div
                      id={`faq-answer-${i}`}
                      role="region"
                      aria-labelledby={`faq-question-${i}`}
                      className="px-4 pb-4 pt-0 md:px-5 md:pb-5 text-sm md:text-base text-muted-foreground leading-snug"
                    >
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <SectionContinueHint label="Mas respuestas debajo" className="my-4" />

          <div data-section-secondary className="space-y-3">
            {FAQS.slice(3).map((faq, offset) => {
              const i = offset + 3;
              return (
                <div
                  key={i}
                  className={cn(
                    "border rounded-lg transition-colors duration-300",
                    openIndex === i ? "bg-white/5 border-primary/30" : "bg-card border-white/5 hover:border-white/10"
                  )}
                >
                  <button
                    id={`faq-question-${i}`}
                    type="button"
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    aria-expanded={openIndex === i}
                    aria-controls={`faq-answer-${i}`}
                    className="flex min-h-14 items-center justify-between w-full p-4 md:px-5 md:py-4 text-left gap-4"
                  >
                    <span className="text-base md:text-lg font-bold text-white">{faq.q}</span>
                    <ChevronDown
                      className={cn(
                        "w-5 h-5 text-primary transition-transform duration-300",
                        openIndex === i ? "rotate-180" : ""
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  <AnimatePresence>
                    {openIndex === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div
                          id={`faq-answer-${i}`}
                          role="region"
                          aria-labelledby={`faq-question-${i}`}
                          className="px-4 pb-4 pt-0 md:px-5 md:pb-5 text-sm md:text-base text-muted-foreground leading-snug"
                        >
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground mb-3">¿Tenés otra duda?</p>
          <a
            href={buildWhatsAppUrl("Hola! Quiero hacer una consulta")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all"
          >
            Consultanos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
