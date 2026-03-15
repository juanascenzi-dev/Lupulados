import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { X, Plus, Minus, ShoppingCart, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const BEERS = [
  {
    name: "Blonde Ale",
    desc: "Suave, refrescante, ideal para los que arrancan en la artesanal.",
    abv: 4.8, ibu: 15,
    badge: "Popular",
    img: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop",
    precios: {
      porrón: 1800,
      growler1L: 3200,
      growler2L: 5800,
      barril20L: 38000,
      barril30L: 54000,
      barril50L: 85000,
    }
  },
  {
    name: "American Pale Ale (APA)",
    desc: "Cítrica y lupulada, nuestro caballito de batalla.",
    abv: 5.2, ibu: 35,
    badge: "Disponible en barril",
    img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop",
    precios: {
      porrón: 2000,
      growler1L: 3600,
      growler2L: 6500,
      barril20L: 42000,
      barril30L: 60000,
      barril50L: 95000,
    }
  },
  {
    name: "IPA",
    desc: "Intensa, aromática, para los que les gusta el lúpulo.",
    abv: 6.5, ibu: 55,
    badge: "Disponible en barril",
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
    precios: {
      porrón: 2200,
      growler1L: 4000,
      growler2L: 7200,
      barril20L: 46000,
      barril30L: 66000,
      barril50L: 105000,
    }
  },
  {
    name: "Red Ale / Amber",
    desc: "Maltosa, caramelo, equilibrada.",
    abv: 5.0, ibu: 25,
    badge: "Disponible en barril",
    img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop",
    precios: {
      porrón: 1900,
      growler1L: 3400,
      growler2L: 6200,
      barril20L: 40000,
      barril30L: 57000,
      barril50L: 90000,
    }
  },
  {
    name: "Stout",
    desc: "Oscura, con notas de café y chocolate.",
    abv: 5.8, ibu: 30,
    badge: "Disponible en barril",
    img: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop",
    precios: {
      porrón: 2100,
      growler1L: 3800,
      growler2L: 6800,
      barril20L: 44000,
      barril30L: 63000,
      barril50L: 100000,
    }
  },
  {
    name: "Honey / Wheat",
    desc: "Dulce, con miel patagónica, suavecita.",
    abv: 4.5, ibu: 12,
    badge: "Disponible en barril",
    img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
    precios: {
      porrón: 1900,
      growler1L: 3400,
      growler2L: 6200,
      barril20L: 40000,
      barril30L: 57000,
      barril50L: 90000,
    }
  },
  {
    name: "Session IPA",
    desc: "Lupulada pero liviana, para tomar toda la noche.",
    abv: 4.2, ibu: 40,
    badge: "Novedad",
    img: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop",
    precios: {
      porrón: 2000,
      growler1L: 3600,
      growler2L: 6500,
      barril20L: 42000,
      barril30L: 60000,
      barril50L: 95000,
    }
  },
  {
    name: "Scotch Ale",
    desc: "Fuerte, maltosa, para el invierno.",
    abv: 7.5, ibu: 20,
    badge: "Temporada",
    img: "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop",
    precios: {
      porrón: 2400,
      growler1L: 4400,
      growler2L: 7800,
      barril20L: 48000,
      barril30L: 69000,
      barril50L: 110000,
    }
  },
];

const formatPrice = (price: number) => {
  return `$${price.toLocaleString("es-AR")}`;
};

export function Cervezas() {
  const [filter, setFilter] = useState<"Todas" | "Livianas" | "Lupuladas" | "Oscuras">("Todas");
  const [selectedBeer, setSelectedBeer] = useState<typeof BEERS[0] | null>(null);
  
  const { addItem } = useCart();
  const { toast } = useToast();

  const filteredBeers = BEERS.filter((beer) => {
    if (filter === "Todas") return true;
    if (filter === "Livianas") return beer.abv < 5;
    if (filter === "Lupuladas") return beer.ibu > 35;
    if (filter === "Oscuras") return beer.name.includes("Stout") || beer.name.includes("Scotch");
    return true;
  });

  const handleAddToCart = (presentation: string, price: number, category: "barril" | "growler" | "porrón") => {
    if (!selectedBeer) return;
    
    addItem({
      id: `${selectedBeer.name}-${presentation}`,
      name: `${selectedBeer.name} - ${presentation}`,
      price,
      category
    });

    toast({
      title: "¡Agregado al pedido!",
      description: `${selectedBeer.name} en ${presentation} se sumó a tu carrito.`,
    });
    
    setSelectedBeer(null);
  };

  return (
    <section id="cervezas" className="py-24 bg-secondary/50 relative border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
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
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-6"
            >
              Estilos con personalidad
            </motion.h3>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-2"
            >
              {["Todas", "Livianas", "Lupuladas", "Oscuras"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    filter === f 
                      ? "bg-primary text-black" 
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10"
                  )}
                >
                  {f}
                </button>
              ))}
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
          {filteredBeers.map((beer, i) => (
            <motion.div
              key={beer.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedBeer(beer)}
              className="group relative rounded-2xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-colors shadow-lg cursor-pointer"
            >
              <div className="h-40 md:h-56 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                <img 
                  src={beer.img} 
                  alt={`Cerveza artesanal ${beer.name}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {beer.badge && (
                  <div className="absolute top-3 right-3 z-20 bg-primary/90 backdrop-blur-sm text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {beer.badge}
                  </div>
                )}
              </div>
              <div className="p-4 md:p-6 relative z-20">
                <h4 className="text-xl md:text-2xl font-display font-bold text-white mb-2">{beer.name}</h4>
                <p className="text-muted-foreground text-xs md:text-sm mb-4 line-clamp-2">{beer.desc}</p>
                <div className="flex items-center gap-3 text-xs font-mono bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[9px] uppercase">IBU</span>
                    <span className="text-primary font-bold">{beer.ibu}</span>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-white/40 text-[9px] uppercase">ALC</span>
                    <span className="text-white font-bold">{beer.abv}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Costos adicionales banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-primary/20 rounded-2xl p-6 md:p-8"
        >
          <h4 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Información Adicional
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Alquiler Chopera</span>
              <span className="text-white font-bold">$15.000 <span className="text-primary text-xs font-normal ml-1">(Gratis c/ 50L)</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Delivery Zona Norte</span>
              <span className="text-white font-bold">$8.000</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Delivery CABA/Sur</span>
              <span className="text-white font-bold">$12.000</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Beneficios</span>
              <span className="text-white font-bold text-sm text-primary">Vasos de regalo +$80.000</span>
            </div>
          </div>
        </motion.div>

      </div>

      {/* Beer Modal */}
      <AnimatePresence>
        {selectedBeer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBeer(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col max-h-[90vh]"
            >
              <div className="h-48 relative shrink-0">
                <img src={selectedBeer.img} alt={selectedBeer.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                <button 
                  onClick={() => setSelectedBeer(null)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-6">
                  <h3 className="text-3xl font-display font-bold text-white">{selectedBeer.name}</h3>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <p className="text-muted-foreground mb-6">{selectedBeer.desc}</p>
                
                <div className="space-y-6">
                  {/* Barriles */}
                  <div>
                    <h5 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Barriles</h5>
                    <div className="space-y-2">
                      {[
                        { label: 'Barril 20L', key: 'barril20L', price: selectedBeer.precios.barril20L },
                        { label: 'Barril 30L', key: 'barril30L', price: selectedBeer.precios.barril30L },
                        { label: 'Barril 50L', key: 'barril50L', price: selectedBeer.precios.barril50L }
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                          <span className="text-white">{item.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-primary font-bold">{formatPrice(item.price)}</span>
                            <button 
                              onClick={() => handleAddToCart(item.label, item.price, "barril")}
                              className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-amber-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Growlers & Porrones */}
                  <div>
                    <h5 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Envasado</h5>
                    <div className="space-y-2">
                      {[
                        { label: 'Growler 1L', key: 'growler1L', price: selectedBeer.precios.growler1L, cat: 'growler' },
                        { label: 'Growler 2L', key: 'growler2L', price: selectedBeer.precios.growler2L, cat: 'growler' },
                        { label: 'Porrón 330ml', key: 'porrón', price: selectedBeer.precios.porrón, cat: 'porrón' }
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                          <span className="text-white">{item.label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-primary font-bold">{formatPrice(item.price)}</span>
                            <button 
                              onClick={() => handleAddToCart(item.label, item.price, item.cat as any)}
                              className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-amber-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
