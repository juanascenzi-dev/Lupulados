import { motion } from "framer-motion";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Martín G.",
    event: "Cumpleaños 40",
    text: "Excelente servicio. Me llevaron el barril de IPA, armaron la chopera en 5 minutos y la cerveza estaba helada toda la noche. ¡Un lujo!",
    rating: 5
  },
  {
    name: "Sofía R.",
    event: "Casamiento",
    text: "Contratamos 3 barriles para nuestra boda y fue un éxito total. La Honey voló. Super recomendables, cumplieron con todo a la perfección.",
    rating: 5
  },
  {
    name: "Juan Pablo C.",
    event: "Juntada con amigos",
    text: "Pedí un barril de 20L de Blonde para ver el partido. Nada que envidiarle a estar sentado en la cervecería. Muy buena onda los chicos que entregan.",
    rating: 5
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
            Nuestros clientes opinan
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {REVIEWS.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card border border-white/5 p-8 rounded-2xl relative"
            >
              <div className="flex gap-1 mb-6">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground text-lg mb-8 italic">"{review.text}"</p>
              <div className="mt-auto">
                <h5 className="text-white font-bold">{review.name}</h5>
                <span className="text-primary text-sm uppercase tracking-wider font-semibold">{review.event}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
