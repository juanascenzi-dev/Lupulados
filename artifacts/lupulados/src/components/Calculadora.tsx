import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator, Sun, Users, Clock, Beer } from "lucide-react";
import { scrollToSection } from "@/lib/utils";

export function Calculadora() {
  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [type, setType] = useState<"tranqui" | "normal" | "intensa" | "festival">("normal");
  const [isSummer, setIsSummer] = useState(false);
  
  const [totalLiters, setTotalLiters] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const handleGuestsChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 10), 500);
    setGuests(clamped);
  };

  const handleHoursChange = (val: number) => {
    const clamped = Math.min(Math.max(val, 2), 12);
    setHours(clamped);
  };

  useEffect(() => {
    // Base 1L per person for 4hs normal
    const baseLiters = guests;
    
    // Multipliers
    const typeMultipliers = {
      tranqui: 0.6,
      normal: 1.0,
      intensa: 1.4,
      festival: 1.8
    };

    let calculatedLiters = baseLiters * typeMultipliers[type];

    // Hour adjustment (base 4hs). For every hour above 4, add 15%
    if (hours > 4) {
      const extraHours = hours - 4;
      calculatedLiters *= (1 + (0.15 * extraHours));
    } else if (hours < 4) {
      const lessHours = 4 - hours;
      calculatedLiters *= (1 - (0.15 * lessHours));
    }

    // Summer bonus
    if (isSummer) {
      calculatedLiters *= 1.2;
    }

    const finalLiters = Math.ceil(calculatedLiters);
    setTotalLiters(finalLiters);

    // Calculate Barrels Greedy Algorithm
    let remaining = finalLiters;
    const b50 = Math.floor(remaining / 50);
    remaining %= 50;
    const b30 = Math.floor(remaining / 30);
    remaining %= 30;
    // Anything left goes to a 20L barrel
    const b20 = remaining > 0 ? 1 : 0;

    const parts = [];
    if (b50 > 0) parts.push(`${b50}x 50L`);
    if (b30 > 0) parts.push(`${b30}x 30L`);
    if (b20 > 0) parts.push(`${b20}x 20L`);

    if (parts.length === 0) {
      setRecommendation("No llegamos a un barril de 20L, ¡mejor pedí packs o growlers!");
    } else {
      setRecommendation(`${parts.join(" + ")}`);
    }

    // Estimate price based on APA 30L average ($60000 -> $2000 per L)
    const avgPricePerLiter = 2000;
    setEstimatedPrice(finalLiters * avgPricePerLiter);

  }, [guests, hours, type, isSummer]);

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

  return (
    <section id="calculadora" className="py-24 bg-background relative border-t border-white/5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Calculator className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center">
              Calculadora de Barriles
            </h2>
          </div>
          
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Ajustá los detalles de tu evento y descubrí exactamente qué cantidad de cerveza necesitás para que la fiesta sea un éxito.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Inputs - 7 cols */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Guests */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" /> Invitados
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={guests}
                      onChange={(e) => handleGuestsChange(Number(e.target.value))}
                      className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                      min="10"
                      max="500"
                    />
                  </div>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="500" 
                  step="5"
                  value={guests} 
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground font-mono">
                  <span>10</span>
                  <span>500+</span>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Duración (hs)
                  </label>
                  <input
                    type="number"
                    value={hours}
                    onChange={(e) => handleHoursChange(Number(e.target.value))}
                    className="w-20 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-primary font-bold text-center focus:outline-none focus:border-primary transition-colors"
                    min="2"
                    max="12"
                  />
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[2, 3, 4, 5, 6, 8, 10, 12].map(h => (
                    <button
                      key={h}
                      onClick={() => setHours(h)}
                      className={`py-2 px-1 rounded-lg border transition-all text-sm font-bold ${
                        hours === h 
                        ? 'bg-primary text-black border-primary' 
                        : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/30'
                      }`}
                    >
                      {h === 12 ? '12hs+' : `${h}hs`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Type & Summer */}
              <div className="grid grid-cols-1 gap-6">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Beer className="w-4 h-4 text-primary" /> Estilo de fiesta
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { id: 'tranqui', label: 'Tranqui 🍺' },
                      { id: 'normal', label: 'Normal 🍻' },
                      { id: 'intensa', label: 'Intensa 🔥' },
                      { id: 'festival', label: 'Festival 🤘' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id as any)}
                        className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold text-center flex items-center justify-center ${
                          type === t.id 
                          ? 'bg-primary/20 text-primary border-primary shadow-[0_0_15px_rgba(217,119,6,0.2)]' 
                          : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/20'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div 
                  onClick={() => setIsSummer(!isSummer)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-row items-center justify-between ${
                    isSummer 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Sun className={`w-10 h-10 ${isSummer ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <span className="text-sm font-semibold text-white uppercase tracking-wider block mb-0.5">¿Es verano?</span>
                      <span className="text-xs text-muted-foreground">La gente toma más con calor (+20%)</span>
                    </div>
                  </div>
                  
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isSummer ? 'bg-amber-500' : 'bg-secondary'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isSummer ? 'translate-x-6' : 'translate-x-0'}`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Output - 5 cols */}
            <div className="lg:col-span-5 flex flex-col h-full">
              <div className="bg-black/40 rounded-3xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center flex-1 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
                
                <div className="relative z-10 w-full">
                  <span className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-2 block">Vas a necesitar</span>
                  <div className="text-7xl font-display font-bold text-white mb-2 tracking-tighter">
                    {totalLiters}<span className="text-3xl text-primary ml-1">L</span>
                  </div>
                  
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
                  
                  <span className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-3 block">Sugerencia de barriles</span>
                  <div className="bg-primary/10 text-primary border border-primary/20 rounded-xl px-4 py-3 mb-6 font-mono font-bold text-lg w-full">
                    {recommendation}
                  </div>

                  <div className="mb-8">
                    <span className="text-white/40 text-xs block mb-1">Presupuesto estimado (aprox)</span>
                    <span className="text-white font-bold text-2xl">{formatPrice(estimatedPrice)}</span>
                  </div>

                  <button 
                    onClick={() => scrollToSection("arma-tu-pedido")}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-lg shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:-translate-y-1 transition-all"
                  >
                    Armá tu pedido →
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
