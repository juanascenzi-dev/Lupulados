import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { Check, ChevronRight, ChevronLeft, ShoppingCart, Trash2, Plus, Minus, Calendar, MapPin, User, Clock, AlertCircle, Beer } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type Step = 1 | 2 | 3 | 4 | 5;

// Data
const ESTILOS_BARRIL = ["Blonde Ale", "American Pale Ale (APA)", "IPA", "Red Ale / Amber", "Stout", "Honey / Wheat", "Session IPA", "Scotch Ale"];
const PRECIOS_BARRIL = { "20L": 42000, "30L": 60000, "50L": 95000 }; // Avg
const PRECIOS_GROWLER = { "1L": 3600, "2L": 6500 };
const PRECIO_PORRON = 2000;

export function ArmaTuPedido() {
  const { items, addItem, updateQty, removeItem, totalItems, totalPrice, extras, setExtras, clearCart } = useCart();
  const [step, setStep] = useState<Step>(1);
  
  // Local state for step 1 selection
  const [wantsBarriles, setWantsBarriles] = useState(false);
  const [wantsGrowlers, setWantsGrowlers] = useState(false);
  const [wantsPorrones, setWantsPorrones] = useState(false);
  const [wantsPack, setWantsPack] = useState(false);

  // Local state for step 4
  const [formData, setFormData] = useState({
    nombre: "",
    fecha: "",
    horario: "Mañana 9-12hs",
    direccion: "",
    comentarios: ""
  });

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

  const nextStep = () => {
    if (step === 1 && !wantsBarriles && !wantsGrowlers && !wantsPorrones && !wantsPack) {
      alert("Por favor elegí al menos una opción");
      return;
    }
    if (step === 2 && totalItems === 0) {
      alert("Por favor agregá al menos un item a tu pedido");
      return;
    }
    if (step === 4 && (!formData.nombre || !formData.fecha || (extras.delivery !== 'fabrica' && !formData.direccion))) {
      alert("Por favor completá los datos obligatorios");
      return;
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleBarrilAdd = (estilo: string, tamano: string, price: number) => {
    const id = `${estilo}-barril${tamano}`;
    const existing = items.find(i => i.id === id);
    if (existing) {
      updateQty(id, existing.qty + 1);
    } else {
      addItem({ id, name: `${estilo} - Barril ${tamano}`, price, category: "barril" });
    }
  };

  const handlePackToggle = () => {
    const id = "pack-degustacion";
    const existing = items.find(i => i.id === id);
    if (existing) {
      removeItem(id);
      setWantsPack(false);
    } else {
      addItem({ id, name: "Pack Degustación (6 porrones)", price: 10500, category: "pack" });
      setWantsPack(true);
    }
  };

  const generateWhatsAppURL = () => {
    let msg = `*NUEVO PEDIDO - LUPULADOS* 🍺\n\n`;
    msg += `*Cliente:* ${formData.nombre}\n`;
    msg += `*Fecha:* ${formData.fecha} (${formData.horario})\n`;
    if (extras.delivery !== 'fabrica') {
      msg += `*Dirección:* ${formData.direccion}\n`;
    }
    msg += `*Envío:* ${extras.delivery === 'norte' ? 'Zona Norte GBA' : extras.delivery === 'caba' ? 'CABA / Sur' : 'Retiro en fábrica'}\n\n`;
    
    msg += `*TU PEDIDO:*\n`;
    items.forEach(item => {
      msg += `• ${item.qty}x ${item.name} - ${formatPrice(item.price * item.qty)}\n`;
    });

    if (extras.chopera || extras.hielo > 0 || extras.vasos > 0) {
      msg += `\n*Extras:*\n`;
      if (extras.chopera) msg += `• Chopera instalada\n`;
      if (extras.hielo > 0) msg += `• ${extras.hielo}x Bolsas de hielo\n`;
      if (extras.vasos > 0) msg += `• ${extras.vasos}x Vasos choperos\n`;
    }

    if (formData.comentarios) {
      msg += `\n*Comentarios:* ${formData.comentarios}\n`;
    }

    msg += `\n*TOTAL ESTIMADO: ${formatPrice(totalPrice)}*\n\n`;
    msg += `¡Hola! Les paso mi pedido generado desde la web. ¿Me confirman disponibilidad?`;

    return `https://wa.me/5491133971210?text=${encodeURIComponent(msg)}`;
  };

  const slideVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <section id="arma-tu-pedido" className="py-24 bg-background relative border-t border-white/5">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Armá tu pedido</h2>
          <p className="text-muted-foreground">Configurá todo lo que necesitás. Es fácil, rápido y sin compromiso.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 max-w-3xl mx-auto">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0 transition-all duration-500" 
              style={{ width: `${((step - 1) / 4) * 100}%` }}
            />
            
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors duration-300",
                  step >= i ? "bg-primary text-black" : "bg-card border-2 border-white/10 text-white/50"
                )}>
                  {step > i ? <Check className="w-5 h-5" /> : i}
                </div>
                <span className={cn(
                  "hidden md:block text-xs font-medium uppercase tracking-wider absolute -bottom-6 w-max text-center",
                  step >= i ? "text-primary" : "text-white/40"
                )}>
                  {i === 1 ? 'Tipo' : i === 2 ? 'Cervezas' : i === 3 ? 'Extras' : i === 4 ? 'Datos' : 'Resumen'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="glass-panel p-6 md:p-10 rounded-3xl min-h-[500px] flex flex-col">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: QUÉ BUSCAS */}
                {step === 1 && (
                  <motion.div key="step1" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-6">¿Qué estás buscando?</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                      {[
                        { id: 'barriles', title: "Barriles", desc: "Para eventos de +20 personas", icon: Beer, state: wantsBarriles, set: setWantsBarriles },
                        { id: 'growlers', title: "Growlers", desc: "Para compartir en casa (1L / 2L)", icon: Beer, state: wantsGrowlers, set: setWantsGrowlers },
                        { id: 'porrones', title: "Porrones", desc: "Botellas individuales de 330ml", icon: Beer, state: wantsPorrones, set: setWantsPorrones },
                        { id: 'pack', title: "Pack Degustación", desc: "6 porrones variados ($10.500)", icon: ShoppingCart, state: wantsPack, set: () => handlePackToggle() }
                      ].map(opt => (
                        <div 
                          key={opt.id}
                          onClick={() => opt.set(!opt.state)}
                          className={cn(
                            "p-6 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-start text-left gap-4",
                            opt.state ? "bg-primary/10 border-primary" : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
                          )}
                        >
                          <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", opt.state ? "bg-primary text-black" : "bg-white/10 text-white")}>
                            <opt.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-white mb-1">{opt.title}</h4>
                            <p className="text-sm text-muted-foreground">{opt.desc}</p>
                          </div>
                          <div className={cn("mt-auto w-6 h-6 rounded-md flex items-center justify-center border transition-colors", opt.state ? "bg-primary border-primary text-black" : "border-white/20")}>
                            {opt.state && <Check className="w-4 h-4" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: CANTIDADES */}
                {step === 2 && (
                  <motion.div key="step2" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-6">Elegí tus cervezas</h3>
                    <div className="space-y-8 flex-1">
                      
                      {wantsBarriles && (
                        <div>
                          <h4 className="text-primary font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Barriles</h4>
                          <div className="grid gap-3">
                            {ESTILOS_BARRIL.slice(0, 4).map(estilo => (
                              <div key={estilo} className="bg-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <span className="font-bold text-white">{estilo}</span>
                                <div className="flex gap-2">
                                  {["20L", "30L", "50L"].map(t => (
                                    <button 
                                      key={t}
                                      onClick={() => handleBarrilAdd(estilo, t, PRECIOS_BARRIL[t as keyof typeof PRECIOS_BARRIL])}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-primary hover:text-black rounded-lg text-sm font-medium transition-colors"
                                    >
                                      + {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                            <div className="text-center text-sm text-muted-foreground mt-2">Para ver todos los estilos, consultá el catálogo completo.</div>
                          </div>
                        </div>
                      )}

                      {wantsGrowlers && (
                        <div>
                          <h4 className="text-primary font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">Growlers</h4>
                          <div className="grid gap-3">
                            {ESTILOS_BARRIL.slice(0, 3).map(estilo => (
                              <div key={`g-${estilo}`} className="bg-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <span className="font-bold text-white">{estilo}</span>
                                <div className="flex gap-2">
                                  {["1L", "2L"].map(t => (
                                    <button 
                                      key={t}
                                      onClick={() => handleBarrilAdd(estilo, t, PRECIOS_GROWLER[t as keyof typeof PRECIOS_GROWLER])}
                                      className="px-3 py-1.5 bg-white/10 hover:bg-primary hover:text-black rounded-lg text-sm font-medium transition-colors"
                                    >
                                      + {t}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {(!wantsBarriles && !wantsGrowlers && !wantsPorrones && !wantsPack) && (
                        <div className="text-center text-muted-foreground py-12">No elegiste nada en el paso anterior. ¡Volvé atrás!</div>
                      )}

                    </div>
                  </motion.div>
                )}

                {/* STEP 3: EXTRAS */}
                {step === 3 && (
                  <motion.div key="step3" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-6">Extras y Logística</h3>
                    <div className="space-y-6 flex-1">
                      
                      {wantsBarriles && (
                        <div 
                          className="bg-white/5 p-5 rounded-xl border border-white/10 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                          onClick={() => setExtras({...extras, chopera: !extras.chopera})}
                        >
                          <div>
                            <h4 className="font-bold text-white flex items-center gap-2">
                              Alquiler Chopera
                              {items.some(i => i.id.includes("50L")) && <span className="bg-green-500/20 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Gratis con 50L</span>}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">Obligatorio si no tenés equipo propio.</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-primary">{formatPrice(15000)}</span>
                            <div className={cn("w-6 h-6 rounded border flex items-center justify-center transition-colors", extras.chopera ? "bg-primary border-primary text-black" : "border-white/30")}>
                              {extras.chopera && <Check className="w-4 h-4" />}
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <h4 className="font-bold text-white mb-3">Envío</h4>
                        <div className="grid gap-3">
                          {[
                            { id: 'fabrica', label: 'Retiro en fábrica (San Martín)', price: 0 },
                            { id: 'norte', label: 'Envío Zona Norte GBA', price: 8000 },
                            { id: 'caba', label: 'Envío CABA / Zona Sur', price: 12000 }
                          ].map(d => (
                            <div 
                              key={d.id}
                              onClick={() => setExtras({...extras, delivery: d.id as any})}
                              className={cn(
                                "p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center",
                                extras.delivery === d.id ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10 hover:border-white/30"
                              )}
                            >
                              <span className="text-white">{d.label}</span>
                              <span className="font-mono text-primary font-bold">{d.price === 0 ? 'Gratis' : formatPrice(d.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                          <div className="mb-4">
                            <h4 className="font-bold text-white">Hielo (bolsas 5kg)</h4>
                            <p className="text-xs text-muted-foreground">$3.000 c/u</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <button onClick={() => setExtras({...extras, hielo: Math.max(0, extras.hielo - 1)})} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold text-white">{extras.hielo}</span>
                            <button onClick={() => setExtras({...extras, hielo: extras.hielo + 1})} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                          <div className="mb-4">
                            <h4 className="font-bold text-white flex items-center gap-2">Vasos choperos</h4>
                            <p className="text-xs text-muted-foreground">$800 c/u (Gratis en +$80k)</p>
                          </div>
                          <div className="flex items-center justify-between">
                            <button onClick={() => setExtras({...extras, vasos: Math.max(0, extras.vasos - 1)})} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                            <span className="font-bold text-white">{extras.vasos}</span>
                            <button onClick={() => setExtras({...extras, vasos: extras.vasos + 1})} className="w-8 h-8 rounded bg-white/10 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 4: DATOS */}
                {step === 4 && (
                  <motion.div key="step4" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col">
                    <h3 className="text-2xl font-bold text-white mb-6">Datos del evento</h3>
                    <div className="space-y-4 flex-1">
                      
                      <div>
                        <label className="text-sm font-medium text-white/70 mb-1 block">Nombre completo *</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                          <input 
                            type="text" 
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                            placeholder="Juan Pérez"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-white/70 mb-1 block">Fecha *</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                            <input 
                              type="date" 
                              value={formData.fecha}
                              onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all [color-scheme:dark]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-white/70 mb-1 block">Horario de entrega *</label>
                          <select 
                            value={formData.horario}
                            onChange={(e) => setFormData({...formData, horario: e.target.value})}
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none"
                          >
                            <option value="Mañana 9-12hs">Mañana (9-12hs)</option>
                            <option value="Tarde 12-16hs">Tarde (12-16hs)</option>
                            <option value="Tarde-noche 16-20hs">Tarde-noche (16-20hs)</option>
                          </select>
                        </div>
                      </div>

                      {extras.delivery !== 'fabrica' && (
                        <div>
                          <label className="text-sm font-medium text-white/70 mb-1 block">Dirección de entrega *</label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-3 w-5 h-5 text-white/30" />
                            <input 
                              type="text" 
                              value={formData.direccion}
                              onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                              placeholder="Calle Falsa 123, Localidad"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium text-white/70 mb-1 block">Comentarios adicionales</label>
                        <textarea 
                          value={formData.comentarios}
                          onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-white/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all resize-none h-24"
                          placeholder="Algún detalle para la entrega, etc."
                        />
                      </div>

                    </div>
                  </motion.div>
                )}

                {/* STEP 5: RESUMEN (solo mobile, desktop lo tiene fijo) */}
                {step === 5 && (
                  <motion.div key="step5" variants={slideVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col justify-center items-center text-center">
                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
                      <Check className="w-10 h-10" />
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white mb-4">¡Todo listo!</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                      Revisá tu pedido en el ticket de la derecha. Si está todo bien, envialo por WhatsApp para confirmar disponibilidad y pago.
                    </p>
                    
                    <a 
                      href={generateWhatsAppURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-sm py-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 mb-4"
                    >
                      📲 Enviar por WhatsApp
                    </a>
                    
                    <button 
                      onClick={prevStep}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      ← Volver a editar
                    </button>
                  </motion.div>
                )}

              </AnimatePresence>

              {/* Navigation Buttons (not on step 5) */}
              {step < 5 && (
                <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center">
                  <button 
                    onClick={prevStep}
                    disabled={step === 1}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 font-medium transition-colors",
                      step === 1 ? "text-transparent pointer-events-none" : "text-white hover:text-primary"
                    )}
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button 
                    onClick={nextStep}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-black rounded-lg font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-primary/20"
                  >
                    {step === 4 ? "Ver Resumen" : "Siguiente"} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Ticket / Resumen (Sidebar) */}
          <div className="lg:col-span-1">
            <div className="bg-black border border-white/10 rounded-3xl p-6 sticky top-24 shadow-2xl font-mono text-sm h-max">
              <div className="text-center border-b border-dashed border-white/20 pb-4 mb-4">
                <h3 className="font-bold text-lg text-white uppercase tracking-widest">TICKET DE PEDIDO</h3>
                <p className="text-muted-foreground text-xs mt-1">LUPULADOS - CERVEZA ARTESANAL</p>
              </div>

              {items.length === 0 ? (
                <div className="py-12 text-center text-white/30 flex flex-col items-center gap-2">
                  <ShoppingCart className="w-8 h-8" />
                  <span>Tu carrito está vacío</span>
                </div>
              ) : (
                <div className="space-y-4 min-h-[200px]">
                  {/* Items */}
                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between items-start group">
                        <div className="flex-1 pr-4">
                          <div className="text-white/90">{item.qty}x {item.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-white/50 hover:text-white"><Minus className="w-3 h-3" /></button>
                            <span className="text-xs text-white/50">{item.qty}</span>
                            <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-5 h-5 rounded bg-white/10 flex items-center justify-center text-white/50 hover:text-white"><Plus className="w-3 h-3" /></button>
                            <button onClick={() => removeItem(item.id)} className="ml-2 text-red-400/50 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </div>
                        <div className="text-right whitespace-nowrap text-primary">{formatPrice(item.price * item.qty)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Extras */}
                  {(extras.chopera || extras.hielo > 0 || extras.vasos > 0 || extras.delivery !== 'fabrica') && (
                    <div className="border-t border-dashed border-white/20 pt-4 space-y-2 text-xs">
                      <div className="text-white/40 mb-2 uppercase">Extras y Envío</div>
                      
                      {extras.chopera && (
                        <div className="flex justify-between text-white/70">
                          <span>Chopera</span>
                          <span>{items.some(i => i.id.includes("50L")) ? "Gratis" : formatPrice(15000)}</span>
                        </div>
                      )}
                      
                      {extras.delivery !== 'fabrica' && (
                        <div className="flex justify-between text-white/70">
                          <span>Envío ({extras.delivery})</span>
                          <span>{formatPrice(extras.delivery === 'norte' ? 8000 : 12000)}</span>
                        </div>
                      )}

                      {extras.hielo > 0 && (
                        <div className="flex justify-between text-white/70">
                          <span>{extras.hielo}x Hielo</span>
                          <span>{formatPrice(extras.hielo * 3000)}</span>
                        </div>
                      )}

                      {extras.vasos > 0 && (
                        <div className="flex justify-between text-white/70">
                          <span>{extras.vasos}x Vasos</span>
                          <span>{totalPrice > 80000 ? "Gratis" : formatPrice(extras.vasos * 800)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Total */}
                  <div className="border-t border-white/20 pt-4 mt-6">
                    <div className="flex justify-between items-end">
                      <span className="text-white/60">TOTAL ESTIMADO</span>
                      <span className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</span>
                    </div>
                    {totalPrice > 80000 && extras.vasos > 0 && (
                      <div className="text-green-400 text-[10px] mt-1 text-right flex items-center justify-end gap-1">
                        <AlertCircle className="w-3 h-3" /> ¡Vasos gratis aplicados!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
