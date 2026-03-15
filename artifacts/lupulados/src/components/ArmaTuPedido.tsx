import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { 
  Check, 
  ChevronRight, 
  ChevronLeft, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  AlertCircle, 
  Beer, 
  Gift, 
  Truck, 
  Store,
  Tag,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
type Step = 1 | 2 | 3 | 4 | 5;

// Data from Cervezas.tsx
const BEERS = [
  {
    name: "Blonde Ale",
    desc: "Suave, refrescante, ideal para los que arrancan.",
    abv: 4.8, ibu: 15,
    img: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop",
    precios: { porrón: 1800, growler1L: 3200, growler2L: 5800, barril20L: 38000, barril30L: 54000, barril50L: 85000 }
  },
  {
    name: "American Pale Ale (APA)",
    desc: "Cítrica y lupulada, nuestro caballito de batalla.",
    abv: 5.2, ibu: 35,
    img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop",
    precios: { porrón: 2000, growler1L: 3600, growler2L: 6500, barril20L: 42000, barril30L: 60000, barril50L: 95000 }
  },
  {
    name: "IPA",
    desc: "Intensa, aromática, para los que les gusta el lúpulo.",
    abv: 6.5, ibu: 55,
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
    precios: { porrón: 2200, growler1L: 4000, growler2L: 7200, barril20L: 46000, barril30L: 66000, barril50L: 105000 }
  },
  {
    name: "Red Ale / Amber",
    desc: "Maltosa, caramelo, equilibrada.",
    abv: 5.0, ibu: 25,
    img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop",
    precios: { porrón: 1900, growler1L: 3400, growler2L: 6200, barril20L: 40000, barril30L: 57000, barril50L: 90000 }
  },
  {
    name: "Stout",
    desc: "Oscura, con notas de café y chocolate.",
    abv: 5.8, ibu: 30,
    img: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop",
    precios: { porrón: 2100, growler1L: 3800, growler2L: 6800, barril20L: 44000, barril30L: 63000, barril50L: 100000 }
  },
  {
    name: "Honey / Wheat",
    desc: "Dulce, con miel patagónica, suavecita.",
    abv: 4.5, ibu: 12,
    img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
    precios: { porrón: 1900, growler1L: 3400, growler2L: 6200, barril20L: 40000, barril30L: 57000, barril50L: 90000 }
  },
  {
    name: "Session IPA",
    desc: "Lupulada pero liviana, para tomar toda la noche.",
    abv: 4.2, ibu: 40,
    img: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop",
    precios: { porrón: 2000, growler1L: 3600, growler2L: 6500, barril20L: 42000, barril30L: 60000, barril50L: 95000 }
  },
  {
    name: "Scotch Ale",
    desc: "Fuerte, maltosa, para el invierno.",
    abv: 7.5, ibu: 20,
    img: "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop",
    precios: { porrón: 2400, growler1L: 4400, growler2L: 7800, barril20L: 48000, barril30L: 69000, barril50L: 110000 }
  }
];

export function ArmaTuPedido() {
  const { items, addItem, updateQty, removeItem, totalItems, totalPrice, extras, setExtras, clearCart } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [orderId] = useState(() => Math.floor(10000 + Math.random() * 90000));
  
  // Local state for step logic
  const [orderType, setOrderType] = useState<"barril" | "growler" | "porrón" | null>(null);
  const [selectedBeerForS3, setSelectedBeerForS3] = useState<typeof BEERS[0] | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<"none" | "valid" | "invalid">("none");

  const [formData, setFormData] = useState({
    nombre: "",
    fecha: "",
    horario: "Mañana 9-12hs",
    direccion: "",
    comentarios: ""
  });

  const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

  const nextStep = () => {
    if (step === 1 && !orderType) {
      alert("Por favor elegí un tipo de pedido");
      return;
    }
    if (step === 2 && !selectedBeerForS3) {
        alert("Por favor elegí una cerveza");
        return;
    }
    if (step === 3 && totalItems === 0) {
      alert("Por favor agregá al menos un item");
      return;
    }
    if (step === 4 && (!formData.nombre || !formData.fecha || (extras.delivery !== 'fabrica' && !formData.direccion))) {
      alert("Por favor completá los datos obligatorios");
      return;
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };
  
  const prevStep = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const applyPromo = () => {
    if (promoInput.toUpperCase() === "PRIMERABIRRA") {
      setExtras(prev => ({ ...prev, promoCode: "PRIMERABIRRA", discount: 0.1 }));
      setPromoStatus("valid");
    } else {
      setExtras(prev => ({ ...prev, promoCode: "", discount: 0 }));
      setPromoStatus("invalid");
    }
  };

  const handleBeerSelect = (beer: typeof BEERS[0]) => {
    setSelectedBeerForS3(beer);
    setStep(3);
  };

  const generateWhatsAppURL = () => {
    let msg = `Hola! Quiero hacer un pedido 🍺\n\n`;
    msg += `*Orden #*${orderId}\n`;
    msg += `*Cliente:* ${formData.nombre}\n`;
    msg += `*Entrega:* ${formData.fecha} (${formData.horario})\n`;
    msg += `*Método:* ${extras.delivery === 'norte' ? 'Zona Norte GBA' : extras.delivery === 'caba' ? 'CABA / Sur' : 'Retiro en fábrica'}\n`;
    if (extras.delivery !== 'fabrica') msg += `*Dirección:* ${formData.direccion}\n`;
    
    msg += `\n*DETALLE:*\n`;
    items.forEach(item => {
      msg += `• ${item.qty}x ${item.name} - ${formatPrice(item.price * item.qty)}\n`;
    });

    if (extras.chopera || extras.hielo > 0 || extras.vasos > 0) {
      msg += `\n*EXTRAS:*\n`;
      if (extras.chopera) msg += `• Chopera instalada\n`;
      if (extras.hielo > 0) msg += `• ${extras.hielo}x Bolsas de hielo\n`;
      if (extras.vasos > 0) msg += `• ${extras.vasos}x Vasos choperos\n`;
    }

    if (extras.promoCode) {
      msg += `\n*CÓDIGO PROMO:* ${extras.promoCode} (-10%)\n`;
    }

    if (formData.comentarios) {
      msg += `\n*NOTAS:* ${formData.comentarios}\n`;
    }

    msg += `\n*TOTAL: ${formatPrice(totalPrice)}*`;

    return `https://wa.me/5491133971210?text=${encodeURIComponent(msg)}`;
  };

  const slideVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  return (
    <section id="arma-tu-pedido" className="py-24 bg-background relative border-t border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Armá tu pedido</h2>
          <p className="text-muted-foreground">Configurá tu experiencia cervecera paso a paso.</p>
        </div>

        {/* Animated Stepper */}
        <div className="mb-16 max-w-4xl mx-auto px-4">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full z-0" />
            <motion.div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full z-0" 
              initial={{ width: 0 }}
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="relative z-10 flex flex-col items-center">
                <motion.div 
                  initial={false}
                  animate={{
                    backgroundColor: step >= i ? "#fbbf24" : "rgba(255,255,255,0.05)",
                    scale: step === i ? 1.2 : 1,
                    boxShadow: step === i ? "0 0 20px rgba(251,191,36,0.4)" : "none"
                  }}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2",
                    step >= i ? "border-primary text-black" : "border-white/10 text-white/40"
                  )}
                >
                  {step > i ? <Check className="w-5 h-5" /> : i}
                </motion.div>
                <span className={cn(
                  "hidden md:block text-[10px] font-bold uppercase tracking-widest absolute -bottom-7 w-max text-center transition-colors",
                  step >= i ? "text-primary" : "text-white/30"
                )}>
                  {i === 1 ? 'Tipo' : i === 2 ? 'Cerveza' : i === 3 ? 'Cantidad' : i === 4 ? 'Extras' : 'Ticket'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: TIPO DE PEDIDO */}
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'barril', title: "Barril 🍺", desc: "La experiencia completa para eventos de +20 personas.", icon: Beer },
                  { id: 'growler', title: "Growler 🥤", desc: "Recargas de 1L o 2L, ideal para compartir en casa.", icon: Beer },
                  { id: 'porrón', title: "Pack Porrones 🍾", desc: "Botellas individuales de 330ml. Perfecto para regalo.", icon: Gift }
                ].map(opt => (
                  <button 
                    key={opt.id}
                    onClick={() => { setOrderType(opt.id as any); nextStep(); }}
                    className={cn(
                      "group p-8 rounded-3xl border-2 text-left transition-all duration-300 flex flex-col items-center text-center gap-6",
                      orderType === opt.id 
                        ? "bg-primary/10 border-primary shadow-[0_0_30px_rgba(251,191,36,0.15)]" 
                        : "bg-white/5 border-transparent hover:bg-white/10 hover:border-white/20"
                    )}
                  >
                    <div className={cn(
                      "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                      orderType === opt.id ? "bg-primary text-black rotate-3" : "bg-white/10 text-white group-hover:scale-110"
                    )}>
                      <opt.icon className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-3">{opt.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* STEP 2: CERVEZA */}
            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit">
                <h3 className="text-2xl font-bold text-white mb-8 text-center">Elegí el estilo</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {BEERS.map((beer) => (
                    <div 
                      key={beer.name}
                      onClick={() => handleBeerSelect(beer)}
                      className={cn(
                        "group cursor-pointer rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-primary/50 transition-all",
                        selectedBeerForS3?.name === beer.name && "border-primary bg-primary/5"
                      )}
                    >
                      <div className="h-32 md:h-40 relative overflow-hidden">
                        <img src={beer.img} alt={beer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-3 flex gap-1">
                            <span className="text-[9px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">IBU {beer.ibu}</span>
                            <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded">ALC {beer.abv}%</span>
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-white text-sm md:text-base mb-1">{beer.name}</h4>
                        <p className="text-primary font-mono text-xs font-bold">
                            Desde {formatPrice(orderType === 'barril' ? beer.precios.barril20L : orderType === 'growler' ? beer.precios.growler1L : beer.precios.porrón)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: TAMAÑO / CANTIDAD */}
            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                        {orderType} - {selectedBeerForS3?.name}
                    </div>
                    <h3 className="text-2xl font-bold text-white">¿Cuánto necesitás?</h3>
                </div>

                <div className="grid gap-4">
                    {orderType === 'barril' && (
                        [
                            { label: 'Barril 20L', key: 'barril20L', desc: 'Aprox 40 pintas', price: selectedBeerForS3?.precios.barril20L },
                            { label: 'Barril 30L', key: 'barril30L', desc: 'Aprox 60 pintas', price: selectedBeerForS3?.precios.barril30L },
                            { label: 'Barril 50L', key: 'barril50L', desc: 'Aprox 100 pintas', price: selectedBeerForS3?.precios.barril50L }
                        ].map(size => (
                            <div key={size.key} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-white">{size.label}</h4>
                                    <p className="text-sm text-muted-foreground">{size.desc}</p>
                                    <p className="text-primary font-mono font-bold mt-1">{formatPrice(size.price || 0)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`) ? (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                            <button 
                                                onClick={() => updateQty(`${selectedBeerForS3?.name}-${size.key}`, (items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty || 0) - 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-white">{items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty}</span>
                                            <button 
                                                onClick={() => updateQty(`${selectedBeerForS3?.name}-${size.key}`, (items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty || 0) + 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => addItem({ id: `${selectedBeerForS3?.name}-${size.key}`, name: `${selectedBeerForS3?.name} - ${size.label}`, price: size.price || 0, category: 'barril' })}
                                            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                                        >
                                            Agregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {orderType === 'growler' && (
                        [
                            { label: 'Growler 1L', key: 'growler1L', price: selectedBeerForS3?.precios.growler1L },
                            { label: 'Growler 2L', key: 'growler2L', price: selectedBeerForS3?.precios.growler2L }
                        ].map(size => (
                            <div key={size.key} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold text-white">{size.label}</h4>
                                    <p className="text-primary font-mono font-bold mt-1">{formatPrice(size.price || 0)}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`) ? (
                                        <div className="flex items-center bg-white/10 rounded-xl p-1">
                                            <button 
                                                onClick={() => updateQty(`${selectedBeerForS3?.name}-${size.key}`, (items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty || 0) - 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-10 text-center font-bold text-white">{items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty}</span>
                                            <button 
                                                onClick={() => updateQty(`${selectedBeerForS3?.name}-${size.key}`, (items.find(i => i.id === `${selectedBeerForS3?.name}-${size.key}`)?.qty || 0) + 1)}
                                                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={() => addItem({ id: `${selectedBeerForS3?.name}-${size.key}`, name: `${selectedBeerForS3?.name} - ${size.label}`, price: size.price || 0, category: 'growler' })}
                                            className="px-6 py-3 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                                        >
                                            Agregar
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {orderType === 'porrón' && (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
                            <div className="text-center">
                                <h4 className="text-2xl font-bold text-white">Botellas de 330ml</h4>
                                <p className="text-primary font-mono font-bold mt-1 text-xl">{formatPrice(selectedBeerForS3?.precios.porrón || 0)} c/u</p>
                            </div>
                            
                            <div className="flex items-center gap-6">
                                <button 
                                    onClick={() => updateQty(`${selectedBeerForS3?.name}-porrón`, (items.find(i => i.id === `${selectedBeerForS3?.name}-porrón`)?.qty || 0) - 1)}
                                    className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all"
                                >
                                    <Minus className="w-6 h-6" />
                                </button>
                                <span className="text-4xl font-display font-bold text-white w-16 text-center">
                                    {items.find(i => i.id === `${selectedBeerForS3?.name}-porrón`)?.qty || 0}
                                </span>
                                <button 
                                    onClick={() => addItem({ id: `${selectedBeerForS3?.name}-porrón`, name: `${selectedBeerForS3?.name} - Porrón`, price: selectedBeerForS3?.precios.porrón || 0, category: 'porrón' })}
                                    className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            
                            { (items.find(i => i.id === `${selectedBeerForS3?.name}-porrón`)?.qty || 0) === 0 && (
                                <p className="text-muted-foreground text-sm italic">Elegí la cantidad para continuar</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-12 flex justify-between gap-4">
                    <button onClick={prevStep} className="flex-1 py-4 px-6 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                        <ChevronLeft className="w-5 h-5" /> Volver
                    </button>
                    <button onClick={nextStep} className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-black font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2">
                        Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: EXTRAS + DATOS */}
            {step === 4 && (
              <motion.div key="step4" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Logística & Promo */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-primary" /> Entrega
                            </h3>
                            <div className="grid gap-3">
                                {[
                                    { id: 'fabrica', label: 'Retiro en fábrica', desc: 'San Martín (Gratis)', icon: Store },
                                    { id: 'norte', label: 'Zona Norte GBA', desc: '$8.000', icon: Truck },
                                    { id: 'caba', label: 'CABA / Zona Sur', desc: '$12.000', icon: Truck }
                                ].map(d => (
                                    <button 
                                        key={d.id}
                                        onClick={() => setExtras(prev => ({ ...prev, delivery: d.id as any }))}
                                        className={cn(
                                            "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                                            extras.delivery === d.id ? "bg-primary/10 border-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                                        )}
                                    >
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", extras.delivery === d.id ? "bg-primary text-black" : "bg-white/10 text-white")}>
                                            <d.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white leading-none mb-1">{d.label}</p>
                                            <p className="text-xs text-muted-foreground">{d.desc}</p>
                                        </div>
                                        {extras.delivery === d.id && <Check className="w-5 h-5 text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Tag className="w-5 h-5 text-primary" /> Código Promocional
                            </h3>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input 
                                        type="text"
                                        value={promoInput}
                                        onChange={(e) => setPromoInput(e.target.value)}
                                        placeholder="Tengo un código"
                                        className={cn(
                                            "w-full bg-white/5 border-2 rounded-xl py-3 px-4 text-white focus:outline-none transition-all",
                                            promoStatus === 'valid' ? "border-green-500/50" : promoStatus === 'invalid' ? "border-red-500/50" : "border-white/10"
                                        )}
                                    />
                                    {promoStatus === 'valid' && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 w-5 h-5" />}
                                    {promoStatus === 'invalid' && <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />}
                                </div>
                                <button onClick={applyPromo} className="px-6 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors">
                                    Aplicar
                                </button>
                            </div>
                            {promoStatus === 'valid' && <p className="text-green-500 text-xs mt-2 font-bold">¡Descuento del 10% aplicado!</p>}
                            {promoStatus === 'invalid' && <p className="text-red-500 text-xs mt-2 font-bold">Código no válido</p>}
                        </div>
                    </div>

                    {/* Datos del Cliente */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" /> Tus datos
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Nombre Completo *</label>
                                <input 
                                    type="text" 
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    placeholder="Ej: Lionel Messi"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Fecha *</label>
                                    <input 
                                        type="date" 
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({...formData, fecha: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Horario *</label>
                                    <select 
                                        value={formData.horario}
                                        onChange={(e) => setFormData({...formData, horario: e.target.value})}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="Mañana 9-12hs">Mañana (9-12hs)</option>
                                        <option value="Tarde 12-16hs">Tarde (12-16hs)</option>
                                        <option value="Noche 16-20hs">Noche (16-20hs)</option>
                                    </select>
                                </div>
                            </div>
                            {extras.delivery !== 'fabrica' && (
                                <div>
                                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Dirección *</label>
                                    <input 
                                        type="text" 
                                        value={formData.direccion}
                                        onChange={(e) => setFormData({...formData, direccion: e.target.value})}
                                        placeholder="Ej: Av. Siempre Viva 742, Florida"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            )}
                            <div>
                                <label className="text-xs font-bold text-white/50 uppercase tracking-widest mb-1.5 block">Comentarios</label>
                                <textarea 
                                    value={formData.comentarios}
                                    onChange={(e) => setFormData({...formData, comentarios: e.target.value})}
                                    placeholder="Detalles para la entrega, etc."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-24 resize-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-between gap-4">
                    <button onClick={prevStep} className="flex-1 py-4 px-6 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors">
                        Volver
                    </button>
                    <button onClick={nextStep} className="flex-[2] py-4 px-6 rounded-2xl bg-primary text-black font-bold hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                        Ver Resumen
                    </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: TICKET STYLE CONFIRMATION */}
            {step === 5 && (
              <motion.div key="step5" variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-md mx-auto">
                <div className="relative bg-[#f8f8f8] text-[#333] p-8 rounded-sm shadow-2xl overflow-hidden">
                    {/* Ticket Jagged Edges */}
                    <div className="absolute top-0 left-0 w-full h-3 bg-[url('https://www.transparenttextures.com/patterns/sawtooth.png')] rotate-180 opacity-20" />
                    <div className="absolute bottom-0 left-0 w-full h-3 bg-[url('https://www.transparenttextures.com/patterns/sawtooth.png')] opacity-20" />
                    
                    <div className="text-center mb-8">
                        <h3 className="text-3xl font-display font-black uppercase tracking-tighter">🍺 Lupulados</h3>
                        <p className="text-xs font-mono font-bold text-muted-foreground/60 mt-1">Cervecería Artesanal Independiente</p>
                        <div className="mt-4 py-1 border-y-2 border-dashed border-[#ccc] font-mono font-bold">
                            ORDEN #{orderId}
                        </div>
                    </div>

                    <div className="space-y-4 font-mono text-sm">
                        <div className="flex justify-between items-end gap-2">
                            <span className="shrink-0 font-bold uppercase">Cliente</span>
                            <div className="flex-1 border-b border-dotted border-[#ccc] mb-1" />
                            <span className="shrink-0 text-right uppercase">{formData.nombre}</span>
                        </div>
                        <div className="flex justify-between items-end gap-2">
                            <span className="shrink-0 font-bold uppercase">Fecha</span>
                            <div className="flex-1 border-b border-dotted border-[#ccc] mb-1" />
                            <span className="shrink-0 text-right uppercase">{formData.fecha}</span>
                        </div>
                        <div className="flex justify-between items-end gap-2">
                            <span className="shrink-0 font-bold uppercase">Envío</span>
                            <div className="flex-1 border-b border-dotted border-[#ccc] mb-1" />
                            <span className="shrink-0 text-right uppercase">
                                {extras.delivery === 'fabrica' ? 'Retiro' : extras.delivery === 'norte' ? 'Z. Norte' : 'CABA'}
                            </span>
                        </div>

                        <div className="pt-6 pb-2 border-b border-[#ccc] font-bold text-xs uppercase tracking-widest">Detalle del Pedido</div>
                        
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-bold leading-tight">{item.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{item.qty} unidades x {formatPrice(item.price)}</p>
                                </div>
                                <span className="font-bold">{formatPrice(item.price * item.qty)}</span>
                            </div>
                        ))}

                        {extras.promoCode && (
                            <div className="flex justify-between text-green-600 font-bold">
                                <span>DESCUENTO ({extras.promoCode})</span>
                                <span>-10%</span>
                            </div>
                        )}

                        <div className="pt-6 space-y-2">
                            <div className="text-center py-2 border-y-2 border-dashed border-[#ccc]">
                                <p className="text-xs uppercase font-bold text-muted-foreground mb-1">Total a Pagar</p>
                                <p className="text-4xl font-display font-black text-[#111]">{formatPrice(totalPrice)}</p>
                            </div>
                        </div>

                        <div className="text-center pt-6 text-[10px] text-muted-foreground leading-relaxed">
                            ESTE NO ES UN COMPROBANTE FISCAL<br/>
                            GRACIAS POR ELEGIRNOS 🍻 LUPULADOS.AR
                        </div>
                    </div>
                </div>

                <div className="mt-10 space-y-4">
                    <a 
                      href={generateWhatsAppURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold text-lg shadow-lg hover:bg-[#20ba59] transition-all flex items-center justify-center gap-3"
                    >
                      Pedir por WhatsApp 🟢
                    </a>
                    <button 
                        onClick={() => { clearCart(); setStep(1); setOrderType(null); setSelectedBeerForS3(null); }}
                        className="w-full py-4 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors"
                    >
                        Agregar otro producto
                    </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sticky Subtotal */}
      <AnimatePresence>
        {step >= 2 && step < 5 && (
            <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="fixed bottom-0 left-0 w-full bg-card/95 backdrop-blur-md border-t border-primary/20 p-4 z-50 lg:hidden"
            >
                <div className="flex items-center justify-between max-w-md mx-auto">
                    <div>
                        <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Total Estimado</p>
                        <p className="text-2xl font-bold text-primary">{formatPrice(totalPrice)}</p>
                    </div>
                    <button 
                        onClick={nextStep}
                        className="bg-primary text-black font-bold px-8 py-3 rounded-xl hover:bg-amber-400 transition-colors flex items-center gap-2"
                    >
                        Continuar <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
