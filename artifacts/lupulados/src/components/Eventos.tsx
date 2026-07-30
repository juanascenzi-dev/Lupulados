import { motion } from "framer-motion";
import { useState } from "react";
import { buildWhatsAppUrl } from "@/domain/businessConfig";
import { SectionContinueHint } from "@/components/SectionContinueHint";

const EVENTS = [
  {
    name: "Casamientos y fiestas grandes",
    img: "/events/wedding-reception.jpg",
    alt: "Pareja de casamiento celebrando al aire libre con invitados en una recepcion luminosa",
    size: "large"
  },
  {
    name: "Eventos de empresa",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800",
    alt: "Personas compartiendo una celebracion corporativa",
    size: "small"
  },
  {
    name: "Cumpleaños y juntadas",
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&q=80&w=800",
    alt: "Grupo de personas brindando en una juntada",
    size: "small"
  }
];

const EVENT_PRIORITIES = [
  { title: "Cálculo previo", desc: "Estimamos litros y formatos antes de cerrar el pedido." },
  { title: "Entrega coordinada", desc: "Acordamos modalidad, horario y datos necesarios para el evento." },
  { title: "Servicio claro", desc: "Detalle de estilos, cantidades y costos antes de enviar la consulta." },
];

function EventImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className="h-full w-full bg-[radial-gradient(circle_at_28%_24%,rgba(245,158,11,0.28),transparent_34%),linear-gradient(135deg,#3f4f38,#11100d_72%)]"
        role="img"
        aria-label={alt}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function Eventos() {
  return (
    <section id="eventos" className="site-section site-section-standard bg-background relative overflow-hidden">
      <div data-section-entry className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
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
            Ideas para llevar cerveza tirada a tu evento
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
              className={`relative rounded-2xl overflow-hidden ${
                ev.size === 'large' ? 'md:col-span-2 md:row-span-2 h-64 md:h-[500px]' : 'h-64 md:h-[240px]'
              }`}
            >
              <div className="absolute inset-0 bg-black/40 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
              <EventImage src={ev.img} alt={ev.alt} />
              <div className="absolute bottom-6 left-6 z-20">
                <h4 className="text-white font-bold text-xl md:text-2xl">{ev.name}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        <SectionContinueHint label="Mas ideas debajo" className="md:hidden" />

        <div data-section-secondary className="glass-panel rounded-3xl p-8 md:p-10 relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
            {EVENT_PRIORITIES.map((item, index) => (
              <div key={item.title} className={index === 0 ? "text-center pb-8 md:pb-0" : index === 1 ? "text-center py-8 md:py-0" : "text-center pt-8 md:pt-0"}>
                <div className="text-xl font-display font-bold text-white mb-2">
                  {item.title}
                </div>
                <div className="text-muted-foreground text-sm font-medium max-w-xs mx-auto">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <a
            href={buildWhatsAppUrl("Hola! Quiero consultar por cerveza tirada para un evento.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1"
          >
            Quiero a Lupulados en mi evento
          </a>
        </div>

      </div>
    </section>
  );
}
