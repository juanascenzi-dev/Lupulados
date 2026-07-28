import { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import {
  barrelPresentationIds,
  createBeerCartItem,
  getBeerPresentation,
  growlerPresentationIds,
  packagedPresentationIds,
  type Beer,
  type BeerPresentationId,
} from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SectionContinueHint } from "@/components/SectionContinueHint";

const FILTER_OPTIONS = ["Todas", "Livianas", "Lupuladas", "Oscuras"] as const;
type BeerFilter = (typeof FILTER_OPTIONS)[number];

export function Cervezas() {
  const [filter, setFilter] = useState<BeerFilter>("Todas");
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const { beerCatalog: BEERS, additionalCosts, deliveryOptions, priceDisclaimer } = useCommercialDerivedData();
  
  const { addItem } = useCart();
  const { toast } = useToast();

  const filteredBeers = BEERS.filter((beer) => {
    if (filter === "Todas") return true;
    if (filter === "Livianas") return beer.abv < 5;
    if (filter === "Lupuladas") return beer.ibu > 35;
    if (filter === "Oscuras") return beer.name.includes("Stout") || beer.name.includes("Scotch");
    return true;
  });

  const handleAddToCart = (beer: Beer, presentationId: BeerPresentationId) => {
    const item = createBeerCartItem(beer, presentationId);
    
    addItem(item);

    toast({
      title: "¡Agregado al pedido!",
      description: `${item.name} se sumó a tu carrito.`,
    });
    
    setSelectedBeer(null);
  };

  return (
    <section id="cervezas" className="site-section site-section-extended bg-secondary/50 relative border-y border-white/5">
      <div data-section-entry className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-6 md:mb-7 gap-4 md:gap-6">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-primary font-semibold tracking-wider uppercase text-sm mb-2"
            >
              Nuestra Pizarra
            </motion.h2>
            <motion.h3 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-white mb-3"
            >
              Estilos con personalidad
            </motion.h3>
            <p className="text-xs text-white/40">
              {priceDisclaimer}
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 md:justify-end"
          >
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "min-h-10 px-4 py-2 rounded-full text-sm font-medium transition-all",
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

        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5 mb-7 md:mb-8 items-stretch">
          {filteredBeers.map((beer, i) => (
            <Dialog
              key={beer.id}
              open={selectedBeer?.id === beer.id}
              onOpenChange={(open) => setSelectedBeer(open ? beer : null)}
            >
              <DialogTrigger asChild>
                <motion.button
                  type="button"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  aria-label={`Ver detalle de ${beer.name}`}
                  className="group relative h-full rounded-xl overflow-hidden bg-card border border-white/5 hover:border-primary/50 transition-colors shadow-lg cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background flex flex-col"
                >
                  <div className="aspect-[4/3] min-[390px]:aspect-[5/4] md:aspect-[4/3] lg:aspect-[16/11] overflow-hidden relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                    <img
                      src={beer.img}
                      alt={`Cerveza artesanal ${beer.name}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    {beer.badge && (
                      <div className="absolute top-3 right-3 z-20 bg-primary/90 backdrop-blur-sm text-black text-[10px] md:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                        {beer.badge}
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 md:p-4 relative z-20 flex flex-1 flex-col">
                    <h4 className="text-lg md:text-xl xl:text-2xl font-display font-bold text-white mb-1.5 min-h-[2.8rem] leading-tight flex items-start">{beer.name}</h4>
                    <p className="text-muted-foreground text-xs md:text-sm mb-3 line-clamp-3 min-h-[3.4rem] md:min-h-[3.9rem] leading-snug">{beer.desc}</p>
                    <div className="mt-auto flex min-h-10 items-center gap-3 text-xs font-mono bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
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
                </motion.button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-2rem)] max-w-lg bg-card border-white/10 p-0 gap-0 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <BeerDetailsDialogContent
                  beer={beer}
                  onAddToCart={(presentationId) => handleAddToCart(beer, presentationId)}
                />
              </DialogContent>
            </Dialog>
          ))}
        </div>
        
        <SectionContinueHint label="Mas informacion debajo" className="my-5" />

        {/* Costos adicionales banner */}
        <motion.div 
          data-section-secondary
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card border border-primary/20 rounded-xl p-4 md:p-5"
        >
          <h4 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" /> Información Adicional
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Alquiler Chopera</span>
              <span className="text-white font-bold">{formatPrice(additionalCosts.chopera)} <span className="text-primary text-xs font-normal ml-1">(Gratis c/ 50L)</span></span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Delivery Zona Norte</span>
              <span className="text-white font-bold">{formatPrice(deliveryOptions.find((option) => option.id === "norte")?.cost ?? 0)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Delivery CABA/Sur</span>
              <span className="text-white font-bold">{formatPrice(deliveryOptions.find((option) => option.id === "caba")?.cost ?? 0)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white/60 text-sm mb-1">Beneficios</span>
              <span className="text-white font-bold text-sm text-primary">Vasos de regalo +{formatPrice(additionalCosts.freeGlassesThreshold)}</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

export function BeerDetailsDialogContent({
  beer,
  onAddToCart,
}: {
  beer: Beer;
  onAddToCart: (presentationId: BeerPresentationId) => void;
}) {
  return (
    <>
      <div className="h-48 relative shrink-0">
        <img src={beer.img} alt={beer.name} decoding="async" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
        <div className="absolute bottom-4 left-6 right-12">
          <DialogTitle className="text-3xl font-display font-bold text-white">{beer.name}</DialogTitle>
        </div>
      </div>

      <div className="p-6 overflow-y-auto custom-scrollbar">
        <DialogDescription className="text-muted-foreground mb-6">{beer.desc}</DialogDescription>

        <div className="space-y-6">
          <div>
            <h5 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Barriles</h5>
            <div className="space-y-2">
              {barrelPresentationIds.map((presentationId) => {
                const item = getBeerPresentation(beer, presentationId);
                if (!item) return null;

                return (
                  <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <span className="text-white">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-primary font-bold">{formatPrice(item.price)}</span>
                      <button
                        type="button"
                        aria-label={`Agregar ${beer.name} ${item.label} al pedido`}
                        onClick={() => onAddToCart(item.id)}
                        className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h5 className="text-white font-semibold mb-3 border-b border-white/10 pb-2">Envasado</h5>
            <div className="space-y-2">
              {[...growlerPresentationIds, ...packagedPresentationIds].map((presentationId) => {
                const item = getBeerPresentation(beer, presentationId);
                if (!item) return null;

                return (
                  <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors">
                    <span className="text-white">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-primary font-bold">{formatPrice(item.price)}</span>
                      <button
                        type="button"
                        aria-label={`Agregar ${beer.name} ${item.label} al pedido`}
                        onClick={() => onAddToCart(item.id)}
                        className="w-8 h-8 rounded-lg bg-primary text-black flex items-center justify-center hover:bg-amber-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
