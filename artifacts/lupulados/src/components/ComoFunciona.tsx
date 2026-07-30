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
    <section id="como-funciona" className="site-section how-it-works-section site-section-compact bg-secondary/30 relative flex items-center">
      <span data-section-entry className="absolute top-0 h-px w-px overflow-hidden" aria-hidden="true" />
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6 md:mb-7">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3">
            Alquilar es muy fácil
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-snug">
            Nos encargamos de toda la logística para que vos solo tengas que preocuparte por disfrutar la fiesta.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-[22px] md:left-1/2 top-3 bottom-3 w-0.5 bg-white/10 -translate-x-1/2 md:block hidden" />
          <div className="absolute left-[22px] top-3 bottom-3 w-0.5 bg-white/10 -translate-x-1/2 md:hidden" />

          <div className="space-y-4 md:space-y-4">
            {STEPS.map((step, i) => {
              const isEven = i % 2 !== 0;
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1, margin: "0px 0px 96px 0px" }}
                  className={`flex flex-col md:flex-row items-start md:items-center relative ${
                    isEven ? 'md:flex-row-reverse' : ''
                  }`}
                >
                  {/* Content Box */}
                  <div className={`w-full md:w-1/2 pl-14 md:pl-0 ${isEven ? 'md:pl-12' : 'md:pr-12 text-left md:text-right'}`}>
                    <div className="bg-card border border-white/5 p-4 rounded-xl shadow-xl hover:border-primary/30 transition-colors">
                      <h4 className="text-lg md:text-xl font-bold text-white mb-1.5">{step.title}</h4>
                      <p className="text-sm md:text-base text-muted-foreground leading-snug">{step.desc}</p>
                    </div>
                  </div>

                  {/* Circle Icon */}
                  <div className="absolute left-0 md:left-1/2 w-11 h-11 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center -translate-x-1/2 shadow-[0_0_16px_rgba(217,119,6,0.35)] border-[3px] border-background z-10 mt-1 md:mt-0">
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
