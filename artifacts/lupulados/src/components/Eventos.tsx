import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const EVENTS = [
  {
    name: "Casamiento en Pilar",
    // wedding party people dancing
    img: "https://images.unsplash.com/photo-1530103862676-de88b487bb01?auto=format&fit=crop&q=80&w=800",
    size: "large"
  },
  {
    name: "Fiesta Corporativa",
    // corporate party drinking beer
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    size: "small"
  },
  {
    name: "Cumple de 50",
    // mature friends drinking beer laughing
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800",
    size: "small"
  }
];

export function Eventos() {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="eventos" className="py-24 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-primary font-semibold tracking-wider uppercase text-sm mb-3"
          >
            Galería
          </motion.h2>
          <motion.h3 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
          >
            Hacemos que tu fiesta sea épica
          </motion.h3>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-24">
          {EVENTS.map((ev, i) => (
            <motion.div
              key={ev.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
                ev.size === 'large' ? 'md:col-span-2 md:row-span-2 h-64 md:h-[500px]' : 'h-64 md:h-[240px]'
              }`}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              <img 
                src={ev.img} 
                alt={ev.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-6 left-6 z-20">
                <h4 className="text-white font-bold text-xl md:text-2xl">{ev.name}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Counters */}
        <div ref={ref} className="glass-panel rounded-3xl p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
            <div className="text-center pb-8 md:pb-0">
              <div className="text-5xl font-display font-bold text-white mb-2">
                +{inView ? <CountUp end={150} duration={2.5} /> : "0"}
              </div>
              <div className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Eventos Servidos</div>
            </div>
            <div className="text-center py-8 md:py-0">
              <div className="text-5xl font-display font-bold text-primary mb-2">
                +{inView ? <CountUp end={5000} duration={2.5} /> : "0"}
              </div>
              <div className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Litros Tirados</div>
            </div>
            <div className="text-center pt-8 md:pt-0">
              <div className="text-5xl font-display font-bold text-white mb-2">
                {inView ? <CountUp end={98} duration={2.5} /> : "0"}%
              </div>
              <div className="text-muted-foreground uppercase tracking-widest text-sm font-medium">Clientes Felices</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
