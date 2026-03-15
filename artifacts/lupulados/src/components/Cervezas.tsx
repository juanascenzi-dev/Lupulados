import { motion } from "framer-motion";

const BEERS = [
  {
    name: "Blonde Ale",
    desc: "Suave y muy refrescante, ideal para cualquier paladar.",
    ibu: 15,
    abv: 4.8,
    hasBarril: true,
    // blonde craft beer glass
    img: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "IPA",
    desc: "Intensa, cítrica y lupulada. Para los que buscan amargor.",
    ibu: 60,
    abv: 6.5,
    hasBarril: true,
    // ipa craft beer glass
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "APA",
    desc: "Equilibrada, notas florales y un amargor moderado.",
    ibu: 35,
    abv: 5.2,
    hasBarril: false,
    // pale ale craft beer glass
    img: "https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Red Ale",
    desc: "Color ámbar, notas a caramelo y malta tostada.",
    ibu: 25,
    abv: 5.8,
    hasBarril: true,
    // red ale craft beer glass
    img: "https://images.unsplash.com/photo-1614316047463-5e921e155b41?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Stout",
    desc: "Oscura, cremosa, con profundas notas de café y chocolate.",
    ibu: 40,
    abv: 6.2,
    hasBarril: false,
    // stout craft beer glass
    img: "https://images.unsplash.com/photo-1505075955904-b552d0a52723?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Honey",
    desc: "Rubia suave y dulce con notas genuinas de miel.",
    ibu: 12,
    abv: 4.5,
    hasBarril: true,
    // honey craft beer glass
    img: "https://images.unsplash.com/photo-1563514986873-10e05ee719fb?auto=format&fit=crop&q=80&w=800"
  }
];

export function Cervezas() {
  return (
    <section id="cervezas" className="py-24 bg-secondary/50 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-wider uppercase text-sm mb-3"
            >
              Nuestra Pizarra
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white"
            >
              Estilos con personalidad
            </motion.h3>
          </div>
          <motion.a 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            href="https://wa.me/5491112345678?text=Hola!%20Quiero%20pedir%20cerveza"
            target="_blank"
            className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-white font-medium transition-colors border border-white/10 whitespace-nowrap"
          >
            Ver stock completo
          </motion.a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {BEERS.map((beer, i) => (
            <motion.div
              key={beer.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative rounded-2xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-colors shadow-lg"
            >
              <div className="h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <img 
                  src={beer.img} 
                  alt={`Cerveza artesanal ${beer.name}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {beer.hasBarril && (
                  <div className="absolute top-4 right-4 z-20 bg-primary text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    En Barril
                  </div>
                )}
              </div>
              <div className="p-6 relative z-20">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-2xl font-display font-bold text-white">{beer.name}</h4>
                </div>
                <p className="text-muted-foreground mb-6 h-12">{beer.desc}</p>
                <div className="flex items-center gap-4 text-sm font-mono bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] uppercase">IBU</span>
                    <span className="text-primary font-bold">{beer.ibu}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[10px] uppercase">ALC</span>
                    <span className="text-white font-bold">{beer.abv}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
