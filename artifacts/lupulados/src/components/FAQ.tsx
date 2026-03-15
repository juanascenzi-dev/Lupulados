import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
    a: "Sí, llevamos los equipos a CABA y Gran Buenos Aires. El costo de envío se calcula según la zona. También podés retirar sin cargo por nuestra fábrica en San Martín."
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
    <section id="faq" className="py-24 bg-background relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Preguntas Frecuentes
          </h2>
          <p className="text-muted-foreground">Todo lo que necesitás saber antes de pedir tu barril.</p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <div 
              key={i} 
              className={cn(
                "border rounded-xl transition-colors duration-300",
                openIndex === i ? "bg-white/5 border-primary/30" : "bg-card border-white/5 hover:border-white/10"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="flex items-center justify-between w-full p-6 text-left"
              >
                <span className="text-lg font-bold text-white">{faq.q}</span>
                <ChevronDown 
                  className={cn(
                    "w-5 h-5 text-primary transition-transform duration-300",
                    openIndex === i ? "rotate-180" : ""
                  )} 
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
                    <div className="px-6 pb-6 pt-0 text-muted-foreground">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
