import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calculator } from "lucide-react";

export function Calculadora() {
  const [guests, setGuests] = useState(50);
  const [hours, setHours] = useState(4);
  const [type, setType] = useState<"casual" | "intensa">("casual");
  
  const [totalLiters, setTotalLiters] = useState(0);
  const [recommendation, setRecommendation] = useState("");

  useEffect(() => {
    // Formula: casual = 0.3L, intensa = 0.5L
    const rate = type === "casual" ? 0.3 : 0.5;
    const liters = Math.ceil(guests * hours * rate);
    setTotalLiters(liters);

    // Calculate Barrels Greedy Algorithm
    let remaining = liters;
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
      setRecommendation("No llegamos a un barril de 20L, ¡mejor pedí packs/growlers!");
    } else {
      setRecommendation(`Sugerimos: ${parts.join(" + ")}`);
    }

  }, [guests, hours, type]);

  const wpMessage = `Hola! Quiero consultar por alquiler de barriles. Calculé en la web que necesito aprox ${totalLiters} litros para ${guests} personas (${hours} horas). ${recommendation}. Me pasan info?`;
  const wpUrl = `https://wa.me/5491112345678?text=${encodeURIComponent(wpMessage)}`;

  return (
    <section id="calculadora" className="py-24 bg-background relative border-t border-white/5">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="glass-panel p-8 md:p-12 rounded-3xl">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Calculator className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-white text-center">
              Calculadora de Barriles
            </h2>
          </div>
          
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            ¿No sabés cuánta birra pedir? Usá nuestra calculadora y descubrí exactamente qué barriles necesitás para que nadie se quede con sed.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Inputs */}
            <div className="space-y-8">
              {/* Guests */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider">Invitados</label>
                  <span className="text-primary font-bold">{guests} personas</span>
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
              </div>

              {/* Hours */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-white uppercase tracking-wider">Duración</label>
                  <span className="text-primary font-bold">{hours} horas</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="12" 
                  step="1"
                  value={hours} 
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Event Type */}
              <div>
                <label className="text-sm font-semibold text-white uppercase tracking-wider block mb-3">Tipo de Evento</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setType("casual")}
                    className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold ${
                      type === 'casual' 
                      ? 'bg-primary text-black border-primary' 
                      : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/30'
                    }`}
                  >
                    Casual (Relax)
                  </button>
                  <button
                    onClick={() => setType("intensa")}
                    className={`py-3 px-4 rounded-xl border transition-all text-sm font-bold ${
                      type === 'intensa' 
                      ? 'bg-primary text-black border-primary' 
                      : 'bg-white/5 text-muted-foreground border-white/10 hover:border-white/30'
                    }`}
                  >
                    Mucha Sed (Fiesta)
                  </button>
                </div>
              </div>
            </div>

            {/* Output */}
            <div className="bg-black/40 rounded-2xl p-8 border border-primary/20 flex flex-col items-center justify-center text-center">
              <span className="text-white/60 text-sm uppercase tracking-widest font-semibold mb-2">Vas a necesitar aprox.</span>
              <div className="text-7xl font-display font-bold text-white mb-2">
                {totalLiters}<span className="text-3xl text-primary ml-1">L</span>
              </div>
              
              <div className="bg-primary/10 text-primary border border-primary/20 rounded-lg px-6 py-3 mt-6 mb-8 font-mono font-bold text-lg w-full">
                {recommendation}
              </div>

              <a 
                href={wpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-amber-500 text-black font-bold text-lg shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] hover:-translate-y-1 transition-all"
              >
                Pedir esta cantidad
              </a>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
