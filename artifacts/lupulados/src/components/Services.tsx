import { motion } from "framer-motion";
import { Truck, Users, Beer, GlassWater } from "lucide-react";
import { scrollToSection } from "@/lib/utils";

const SERVICES = [
  {
    icon: <Beer className="w-8 h-8 text-primary" />,
    title: "Alquiler de Barriles",
    description: "Barriles de 20L, 30L y 50L. Incluye chopera con hielo o eléctrica, tubo de CO2 y todo listo para tirar.",
    action: () => scrollToSection("arma-tu-pedido"),
  },
  {
    icon: <GlassWater className="w-8 h-8 text-primary" />,
    title: "Venta Directa",
    description: "Latas, porrones, growlers y packs surtidos para que disfrutes en casa la mejor birra.",
    action: () => scrollToSection("arma-tu-pedido"),
  },
  {
    icon: <Truck className="w-8 h-8 text-primary" />,
    title: "Entrega y Retiro",
    description: "Llevamos todo a domicilio, lo dejamos instalado funcionando y lo retiramos al día siguiente.",
    href: "https://wa.me/5491133971210?text=Hola!%20Quiero%20consultar%20por%20envíos",
  },
  {
    icon: <Users className="w-8 h-8 text-primary" />,
    title: "Asesoramiento",
    description: "Te ayudamos a calcular cantidades y elegir los mejores estilos de cerveza para tu evento.",
    action: () => scrollToSection("calculadora"),
  }
];

export function Services() {
  return (
    <section id="servicios" className="py-24 bg-background relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-sm mb-3"
          >
            Lo que hacemos
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
          >
            Servicios diseñados para que vos solo disfrutes
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-8 rounded-2xl flex flex-col group hover:-translate-y-2 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_10px_30px_-10px_rgba(217,119,6,0.15)]"
            >
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                {service.icon}
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{service.title}</h4>
              <p className="text-muted-foreground flex-1 mb-8">{service.description}</p>
              
              {service.action ? (
                <button 
                  onClick={service.action}
                  className="text-primary font-semibold text-sm inline-flex items-center uppercase tracking-wide group-hover:text-amber-400 transition-colors mt-auto text-left"
                >
                  Consultar <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              ) : (
                <a 
                  href={service.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary font-semibold text-sm inline-flex items-center uppercase tracking-wide group-hover:text-amber-400 transition-colors mt-auto"
                >
                  Consultar <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
