import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Beer as CatalogBeer } from "@/domain/beerCatalog";
import { formatPrice } from "@/domain/format";
import type { OrderType } from "@/domain/orderFlow";

interface BeerStyleGridProps {
  beers: CatalogBeer[];
  selectedBeerId: string | null;
  orderType: OrderType;
  onSelect: (beer: CatalogBeer) => void;
}

export function BeerStyleGrid({ beers, selectedBeerId, orderType, onSelect }: BeerStyleGridProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {beers.map((beer) => {
        const sel = selectedBeerId === beer.id;
        return (
          <button
            type="button"
            key={beer.id}
            onClick={() => onSelect(beer)}
            aria-pressed={sel}
            className={cn(
              "group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200 text-left hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(245,158,11,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:hover:translate-y-0",
              sel
                ? "border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
                : "border-transparent bg-white/5 hover:border-amber-500/40",
            )}
          >
            <div className="relative h-24 md:h-28 overflow-hidden">
              <img
                src={beer.img}
                alt={beer.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-2 left-2 flex gap-1">
                <span className="text-[9px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">
                  IBU {beer.ibu}
                </span>
                <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded">
                  ALC {beer.abv}%
                </span>
              </div>
              {sel && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 400 }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                </motion.div>
              )}
            </div>
            <div className={cn("p-2.5 transition-colors", sel ? "bg-amber-500/10" : "bg-white/5")}>
              <h4
                className={cn(
                  "font-bold text-sm mb-0.5 leading-tight",
                  sel ? "text-amber-300" : "text-white",
                )}
              >
                {beer.name}
              </h4>
              <p className="text-primary font-mono text-xs font-bold">
                Desde{" "}
                {formatPrice(
                  orderType === "barril"
                    ? beer.precios.barril20L
                    : orderType === "growler"
                      ? beer.precios.growler1L
                      : beer.precios.porron500ml,
                )}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
