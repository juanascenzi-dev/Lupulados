import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const SERVICE_PROMISES = [
  {
    title: "Pedido claro",
    detail: "Antes de enviar la consulta ves estilos, cantidades, modalidad de entrega y total estimado.",
  },
  {
    title: "Cantidad razonada",
    detail: "La calculadora ayuda a elegir barriles según invitados, duración y tipo de evento.",
  },
  {
    title: "Coordinación simple",
    detail: "El resumen queda listo para consultar por WhatsApp y ajustar los detalles pendientes.",
  }
];

export function Testimonios() {
  return (
    <section className="py-24 bg-secondary/20 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white"
          >
            Pensado para pedir sin vueltas
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {SERVICE_PROMISES.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-white/5 p-8 rounded-2xl relative"
            >
              <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-lg mb-8">{item.detail}</p>
              <div className="mt-auto">
                <h5 className="text-white font-bold">{item.title}</h5>
                <span className="text-primary text-sm uppercase tracking-wider font-semibold">Experiencia de pedido</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
