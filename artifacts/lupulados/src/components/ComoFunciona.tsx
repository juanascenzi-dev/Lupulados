import { motion } from "framer-motion";
import { MessageCircle, Beer, Truck, PartyPopper, RefreshCcw } from "lucide-react";

const STEPS = [
  {
    icon: <MessageCircle className="w-6 h-6 text-primary-foreground" />,
    title: "1. Contactanos",
    desc: "Escribinos por WhatsApp y contanos qué tenés en mente."
  },
  {
    icon: <Beer className="w-6 h-6 text-primary-foreground" />,
    title: "2. Elegí tu cerveza",
    desc: "Te asesoramos sobre estilos y cantidades ideales para tus invitados."
  },
  {
    icon: <Truck className="w-6 h-6 text-primary-foreground" />,
    title: "3. Entrega a domicilio",
    desc: "Llevamos el barril y la chopera al lugar del evento y lo dejamos listo."
  },
  {
    icon: <PartyPopper className="w-6 h-6 text-primary-foreground" />,
    title: "4. Disfrutá",
    desc: "Tirá la mejor cerveza fresca durante toda tu fiesta."
  },
  {
    icon: <RefreshCcw className="w-6 h-6 text-primary-foreground" />,
    title: "5. Retiro",
    desc: "Pasamos a buscar los equipos al día siguiente, sin complicaciones."
  }
];

export function ComoFunciona() {
  return (
    <section id="como-funciona" className="site-section site-section-standard bg-secondary/30 relative">
      <div data-section-entry className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
            Alquilar es muy fácil
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Nos encargamos de toda la logística para que vos solo tengas que preocuparte por disfrutar la fiesta.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 md:block hidden" />
          <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-white/10 -translate-x-1/2 md:hidden" />

          <div className="space-y-12">
            {STEPS.map((step, i) => {
              const isEven = i % 2 !== 0;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  className={`flex flex-col md:flex-row items-start md:items-center relative ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content Box */}
                  <div className={`w-full md:w-1/2 pl-16 md:pl-0 ${isEven ? 'md:pl-16' : 'md:pr-16 text-left md:text-right'}`}>
                    <div className="bg-card border border-white/5 p-6 rounded-2xl shadow-xl hover:border-primary/30 transition-colors">
                      <h4 className="text-xl font-bold text-white mb-2">{step.title}</h4>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>

                  {/* Circle Icon */}
                  <div className="absolute left-0 md:left-1/2 w-14 h-14 bg-primary rounded-full flex items-center justify-center -translate-x-1/2 shadow-[0_0_20px_rgba(217,119,6,0.4)] border-4 border-background z-10 mt-1 md:mt-0">
                    {step.icon}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
