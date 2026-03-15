import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import {
  Check, ChevronRight, ChevronLeft, ShoppingCart, Trash2,
  Plus, Minus, Calendar, MapPin, User, Clock, Beer, Gift,
  Truck, Store, Tag, X, ChevronUp, ChevronDown, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3 | 4 | 5;
type OrderType = "barril" | "growler" | "porrón" | "paquete" | null;

const BEERS = [
  { name: "Blonde Ale", desc: "Suave, refrescante, ideal para los que arrancan.", abv: 4.8, ibu: 15, img: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=600&h=400&fit=crop", precios: { porrón: 1800, growler1L: 3200, growler2L: 5800, barril20L: 38000, barril30L: 54000, barril50L: 85000 } },
  { name: "American Pale Ale (APA)", desc: "Cítrica y lupulada, nuestro caballito de batalla.", abv: 5.2, ibu: 35, img: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=600&h=400&fit=crop", precios: { porrón: 2000, growler1L: 3600, growler2L: 6500, barril20L: 42000, barril30L: 60000, barril50L: 95000 } },
  { name: "IPA", desc: "Intensa, aromática, para los que les gusta el lúpulo.", abv: 6.5, ibu: 55, img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop", precios: { porrón: 2200, growler1L: 4000, growler2L: 7200, barril20L: 46000, barril30L: 66000, barril50L: 105000 } },
  { name: "Red Ale / Amber", desc: "Maltosa, caramelo, equilibrada.", abv: 5.0, ibu: 25, img: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&h=400&fit=crop", precios: { porrón: 1900, growler1L: 3400, growler2L: 6200, barril20L: 40000, barril30L: 57000, barril50L: 90000 } },
  { name: "Stout", desc: "Oscura, con notas de café y chocolate.", abv: 5.8, ibu: 30, img: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13?w=600&h=400&fit=crop", precios: { porrón: 2100, growler1L: 3800, growler2L: 6800, barril20L: 44000, barril30L: 63000, barril50L: 100000 } },
  { name: "Honey / Wheat", desc: "Dulce, con miel patagónica, suavecita.", abv: 4.5, ibu: 12, img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop", precios: { porrón: 1900, growler1L: 3400, growler2L: 6200, barril20L: 40000, barril30L: 57000, barril50L: 90000 } },
  { name: "Session IPA", desc: "Lupulada pero liviana, para tomar toda la noche.", abv: 4.2, ibu: 40, img: "https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=600&h=400&fit=crop", precios: { porrón: 2000, growler1L: 3600, growler2L: 6500, barril20L: 42000, barril30L: 60000, barril50L: 95000 } },
  { name: "Scotch Ale", desc: "Fuerte, maltosa, para el invierno.", abv: 7.5, ibu: 20, img: "https://images.unsplash.com/photo-1504502350688-00f5d59bbdeb?w=600&h=400&fit=crop", precios: { porrón: 2400, growler1L: 4400, growler2L: 7800, barril20L: 48000, barril30L: 69000, barril50L: 110000 } }
];

const ORDER_TYPES = [
  {
    id: "barril",
    emoji: "🛢️",
    title: "Barril",
    desc: "La experiencia completa para eventos de +20 personas.",
    desde: "Desde $38.000",
    detail: "20L · 30L · 50L disponibles",
    img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=600&h=400&fit=crop",
  },
  {
    id: "growler",
    emoji: "🫙",
    title: "Growler",
    desc: "Recargable de 1L o 2L. Ideal para compartir en casa.",
    desde: "Desde $3.200",
    detail: "1L y 2L disponibles",
    img: "https://images.unsplash.com/photo-1571613316887-6f8d5cbf7ef7?w=600&h=400&fit=crop",
  },
  {
    id: "porrón",
    emoji: "🍺",
    title: "Pack Porrones",
    desc: "Botellas individuales 500ml. Perfecto para regalo o probar.",
    desde: "Desde $1.800 c/u",
    detail: "Botella 500ml artesanal",
    img: "https://images.unsplash.com/photo-1572463395542-3e951278d04c?w=600&h=400&fit=crop",
  },
  {
    id: "paquete",
    emoji: "🎁",
    title: "Pack Degustación",
    desc: "6 estilos surtidos para descubrir tu favorita.",
    desde: "$10.500",
    detail: "6 botellas · 6 estilos distintos",
    img: "https://images.unsplash.com/photo-1505075106905-fb052892c116?w=600&h=400&fit=crop",
  },
];

const STEP_LABELS = ["Tipo", "Cerveza", "Cantidad", "Extras", "Ticket"];

const BUBBLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  size: 8 + Math.random() * 18,
  left: 5 + Math.random() * 90,
  delay: Math.random() * 8,
  duration: 5 + Math.random() * 6,
}));

function BeerGlass({ state, label }: { state: "done" | "active" | "future"; label: string }) {
  const hasBeer = state !== "future";
  const fillH = state === "done" ? "88%" : state === "active" ? "58%" : "0%";
  const borderColor = hasBeer ? "border-amber-500" : "border-white/15";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={cn("relative w-8 h-12 border-2 rounded-b-md overflow-hidden bg-transparent transition-colors duration-500", borderColor)}>
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-amber-500"
          initial={{ height: 0 }}
          animate={{ height: fillH }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {hasBeer && (
          <motion.div
            className="absolute left-0 right-0 h-2.5 bg-white/90"
            style={{ borderRadius: "50% 50% 0 0 / 80% 80% 0 0" }}
            initial={{ opacity: 0, bottom: "0%" }}
            animate={{ opacity: 1, bottom: state === "done" ? "84%" : "53%" }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        )}
        {state === "done" && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-5 h-5 rounded-full bg-black/40 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" strokeWidth={3} />
            </div>
          </div>
        )}
        {state === "active" && (
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
      <span className={cn("hidden md:block text-[9px] font-bold uppercase tracking-widest w-max text-center", hasBeer ? "text-amber-400" : "text-white/25")}>
        {label}
      </span>
    </div>
  );
}

function BeerGlassStepper({ step }: { step: Step }) {
  const progress = ((step - 1) / 4) * 100;
  return (
    <div className="mb-12">
      <div className="hidden md:flex justify-between items-end relative max-w-xl mx-auto">
        <div className="absolute left-4 right-4 h-0.5 bg-white/10 bottom-7 z-0" />
        <motion.div
          className="absolute left-4 h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 bottom-7 z-0"
          initial={{ width: 0 }}
          animate={{ width: `calc(${progress}% - 0px)` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
        {([1, 2, 3, 4, 5] as Step[]).map((i) => (
          <div key={i} className="relative z-10">
            <BeerGlass
              state={step > i ? "done" : step === i ? "active" : "future"}
              label={STEP_LABELS[i - 1]}
            />
          </div>
        ))}
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{["🛢️", "🍺", "📏", "✨", "🎟️"][step - 1]}</span>
          <div>
            <p className="text-white font-bold text-sm">Paso {step} de 5 — {STEP_LABELS[step - 1]}</p>
          </div>
        </div>
        <div className="relative h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </div>
  );
}

function LiveOrderSummary({ onClose, asDrawer = false }: { onClose?: () => void; asDrawer?: boolean }) {
  const { items, removeItem, updateQty, totalPrice, totalItems, extras, clearCart } = useCart();
  const formatPrice = (p: number) => `$${p.toLocaleString("es-AR")}`;
  const deliveryCost = extras.delivery === "norte" ? 8000 : extras.delivery === "caba" ? 12000 : 0;
  const totalLiters = items.filter(i => i.category === "barril").reduce((acc, i) => {
    const liters = i.id.includes("50L") ? 50 : i.id.includes("30L") ? 30 : 20;
    return acc + liters * i.qty;
  }, 0);

  return (
    <div className={cn("flex flex-col h-full", asDrawer ? "max-h-[75vh]" : "")}>
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-white text-lg">Tu pedido</h3>
          {totalItems > 0 && (
            <span className="bg-primary text-black text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
          )}
        </div>
        {asDrawer && onClose && (
          <button onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto space-y-3 pr-1", asDrawer ? "min-h-0" : "")}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-5xl mb-4">🍺</span>
            <p className="text-white/60 text-sm font-medium">Tu carrito está vacío</p>
            <p className="text-white/30 text-xs mt-1">¡Empezá a elegir tus cervezas!</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => {
              const beerImg = BEERS.find(b => item.name.startsWith(b.name))?.img;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, height: 0 }}
                  className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5"
                >
                  {beerImg ? (
                    <img src={beerImg} alt={item.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                      <Beer className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <button onClick={() => updateQty(item.id, item.qty - 1)} className="w-5 h-5 rounded bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-primary text-xs font-bold w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, item.qty + 1)} className="w-5 h-5 rounded bg-white/10 flex items-center justify-center hover:bg-primary hover:text-black transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-white text-xs font-bold">{formatPrice(item.price * item.qty)}</span>
                    <button onClick={() => removeItem(item.id)} className="text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-2 shrink-0">
          {totalLiters > 0 && (
            <p className="text-xs text-amber-400 font-bold">🍺 {totalLiters}L en barriles</p>
          )}
          {deliveryCost > 0 && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Delivery</span>
              <span>{formatPrice(deliveryCost)}</span>
            </div>
          )}
          {extras.discount > 0 && (
            <div className="flex justify-between text-xs text-green-400 font-bold">
              <span>Descuento ({extras.promoCode})</span>
              <span>-10%</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-white">
            <span>Total</span>
            <span className="text-primary text-lg">{formatPrice(totalPrice)}</span>
          </div>
          <button
            onClick={clearCart}
            className="w-full mt-2 py-2 rounded-xl bg-white/5 text-white/40 text-xs hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" /> Vaciar carrito
          </button>
        </div>
      )}
    </div>
  );
}

export function ArmaTuPedido() {
  const { items, addItem, updateQty, totalItems, totalPrice, extras, setExtras, clearCart } = useCart();
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState(1);
  const [orderId] = useState(() => Math.floor(10000 + Math.random() * 90000));
  const [orderType, setOrderType] = useState<OrderType>(null);
  const [selectedBeer, setSelectedBeer] = useState<typeof BEERS[0] | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<"none" | "valid" | "invalid">("none");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre: "", fecha: "", horario: "Mañana 9-12hs", direccion: "", comentarios: "" });

  const formatPrice = (p: number) => `$${p.toLocaleString("es-AR")}`;

  const canProceed = (() => {
    if (step === 1) return orderType !== null;
    if (step === 2) return selectedBeer !== null;
    if (step === 3) return totalItems > 0;
    if (step === 4) return !!formData.nombre && !!formData.fecha && (extras.delivery === "fabrica" || !!formData.direccion);
    return true;
  })();

  const goNext = () => {
    if (!canProceed) return;
    setDirection(1);
    if (step === 1 && orderType === "paquete") {
      addItem({ id: "pack-degustacion", name: "Pack Degustación — 6 estilos", price: 10500, category: "pack" });
      setStep(4);
      return;
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const goPrev = () => {
    setDirection(-1);
    if (step === 4 && orderType === "paquete") {
      setStep(1);
      return;
    }
    setStep((s) => Math.max(s - 1, 1) as Step);
  };

  const applyPromo = () => {
    if (promoInput.toUpperCase() === "PRIMERABIRRA") {
      setExtras((p) => ({ ...p, promoCode: "PRIMERABIRRA", discount: 0.1 }));
      setPromoStatus("valid");
    } else {
      setExtras((p) => ({ ...p, promoCode: "", discount: 0 }));
      setPromoStatus("invalid");
    }
  };

  const generateWhatsAppURL = () => {
    let msg = `Hola! Quiero hacer un pedido 🍺\n\n`;
    msg += `*Orden #${orderId}*\n`;
    msg += `*Cliente:* ${formData.nombre}\n`;
    msg += `*Entrega:* ${formData.fecha} (${formData.horario})\n`;
    msg += `*Método:* ${extras.delivery === "norte" ? "Zona Norte GBA (+$8.000)" : extras.delivery === "caba" ? "CABA / Sur (+$12.000)" : "Retiro en fábrica (Gratis)"}\n`;
    if (extras.delivery !== "fabrica") msg += `*Dirección:* ${formData.direccion}\n`;
    msg += `\n*DETALLE:*\n`;
    items.forEach((i) => { msg += `• ${i.qty}x ${i.name} — ${formatPrice(i.price * i.qty)}\n`; });
    if (extras.promoCode) msg += `\n*PROMO ${extras.promoCode}:* -10%\n`;
    if (formData.comentarios) msg += `\n*Notas:* ${formData.comentarios}\n`;
    msg += `\n*TOTAL: ${formatPrice(totalPrice)}*`;
    return `https://wa.me/5491133971210?text=${encodeURIComponent(msg)}`;
  };

  const slideVariants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 60 }),
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: (dir: number) => ({ opacity: 0, x: -dir * 60, transition: { duration: 0.25, ease: "easeIn" } }),
  };

  const NavButtons = () => (
    <div className="mt-10 flex items-center gap-3">
      {step > 1 && step < 5 && (
        <button
          onClick={goPrev}
          className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors border border-white/10"
        >
          <ChevronLeft className="w-5 h-5" /> Anterior
        </button>
      )}
      {step < 5 && (
        <button
          onClick={goNext}
          disabled={!canProceed}
          title={!canProceed ? "Seleccioná una opción para continuar" : undefined}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base transition-all",
            canProceed
              ? "bg-gradient-to-r from-primary to-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:-translate-y-0.5"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          )}
        >
          {step === 4 ? "Ver resumen" : "Siguiente"} <ChevronRight className="w-5 h-5" />
        </button>
      )}
      {!canProceed && step < 5 && (
        <p className="text-white/30 text-xs absolute -bottom-6 left-0">
          Seleccioná al menos una opción para continuar
        </p>
      )}
    </div>
  );

  return (
    <section id="arma-tu-pedido" className="py-24 bg-background relative border-t border-white/5 overflow-hidden">

      {/* Beer bubble decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {BUBBLES.map((b) => (
          <motion.div
            key={b.id}
            className="absolute rounded-full"
            style={{
              width: b.size,
              height: b.size,
              left: `${b.left}%`,
              bottom: "-5%",
              background: "radial-gradient(circle, rgba(245,158,11,0.25), transparent)",
            }}
            animate={{ y: [0, -window.innerHeight * 1.2], opacity: [0, 0.15, 0] }}
            transition={{
              duration: b.duration,
              delay: b.delay,
              repeat: Infinity,
              ease: "easeIn",
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Armá tu pedido</h2>
          <p className="text-muted-foreground">Configurá tu experiencia cervecera paso a paso.</p>
        </div>

        <BeerGlassStepper step={step} />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

          {/* Wizard */}
          <div className="relative min-h-[400px]">
            <AnimatePresence mode="wait" custom={direction}>

              {/* STEP 1: TIPO */}
              {step === 1 && (
                <motion.div key="s1" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <h3 className="text-xl font-bold text-white mb-6 text-center">¿Qué querés pedir?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    {ORDER_TYPES.map((opt) => {
                      const selected = orderType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setOrderType(opt.id as OrderType)}
                          className={cn(
                            "group relative flex flex-col text-left rounded-2xl overflow-hidden border-2 transition-all duration-200",
                            selected
                              ? "border-amber-500 shadow-[0_0_25px_rgba(217,119,6,0.3)]"
                              : "border-white/10 hover:border-amber-500/50 hover:scale-[1.02]"
                          )}
                        >
                          <div className="relative h-36 overflow-hidden">
                            <img
                              src={opt.img}
                              alt={opt.title}
                              className={cn("w-full h-full object-cover transition-all duration-500", selected ? "brightness-75" : "brightness-50 group-hover:brightness-[0.65]")}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <div className={cn("absolute inset-0", selected ? "bg-amber-500/10" : "bg-black/20")} />
                            {selected && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-lg"
                              >
                                <Check className="w-4 h-4 text-black" strokeWidth={3} />
                              </motion.div>
                            )}
                            <div className="absolute bottom-3 left-3 text-3xl">{opt.emoji}</div>
                          </div>
                          <div className={cn("p-4 flex-1 transition-colors", selected ? "bg-amber-500/10" : "bg-white/5")}>
                            <h4 className={cn("font-bold text-base mb-1", selected ? "text-amber-300" : "text-white")}>{opt.title}</h4>
                            <p className="text-xs text-muted-foreground leading-snug mb-2">{opt.desc}</p>
                            <p className={cn("text-sm font-bold font-mono", selected ? "text-amber-400" : "text-primary")}>{opt.desde}</p>
                            <p className="text-[10px] text-white/30 mt-1">{opt.detail}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative mt-10">
                    <button
                      onClick={goNext}
                      disabled={!canProceed}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all",
                        canProceed
                          ? "bg-gradient-to-r from-primary to-amber-400 text-black shadow-[0_0_20px_rgba(251,191,36,0.25)] hover:shadow-[0_0_30px_rgba(251,191,36,0.4)] hover:-translate-y-0.5"
                          : "bg-white/10 text-white/30 cursor-not-allowed"
                      )}
                    >
                      Siguiente <ChevronRight className="w-5 h-5" />
                    </button>
                    {!canProceed && <p className="text-white/30 text-xs text-center mt-2">Seleccioná una opción para continuar</p>}
                  </div>
                </motion.div>
              )}

              {/* STEP 2: CERVEZA */}
              {step === 2 && (
                <motion.div key="s2" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <h3 className="text-xl font-bold text-white mb-6 text-center">Elegí el estilo</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {BEERS.map((beer) => {
                      const sel = selectedBeer?.name === beer.name;
                      return (
                        <div
                          key={beer.name}
                          onClick={() => setSelectedBeer(beer)}
                          className={cn(
                            "group cursor-pointer rounded-2xl overflow-hidden border-2 transition-all duration-200",
                            sel
                              ? "border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.25)]"
                              : "border-transparent bg-white/5 hover:border-amber-500/40 hover:scale-[1.02]"
                          )}
                        >
                          <div className="relative h-32 overflow-hidden">
                            <img src={beer.img} alt={beer.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                            <div className="absolute bottom-2 left-2 flex gap-1">
                              <span className="text-[9px] font-bold bg-primary text-black px-1.5 py-0.5 rounded">IBU {beer.ibu}</span>
                              <span className="text-[9px] font-bold bg-white/20 text-white px-1.5 py-0.5 rounded">ALC {beer.abv}%</span>
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
                          <div className={cn("p-3 transition-colors", sel ? "bg-amber-500/10" : "bg-white/5")}>
                            <h4 className={cn("font-bold text-sm mb-0.5", sel ? "text-amber-300" : "text-white")}>{beer.name}</h4>
                            <p className="text-primary font-mono text-xs font-bold">
                              Desde {formatPrice(orderType === "barril" ? beer.precios.barril20L : orderType === "growler" ? beer.precios.growler1L : beer.precios.porrón)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <NavButtons />
                  </div>
                </motion.div>
              )}

              {/* STEP 3: CANTIDAD */}
              {step === 3 && (
                <motion.div key="s3" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-2xl mx-auto w-full">
                  <div className="text-center mb-8">
                    <div className="inline-block px-4 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                      {selectedBeer?.name}
                    </div>
                    <h3 className="text-2xl font-bold text-white">¿Cuánto necesitás?</h3>
                  </div>

                  <div className="grid gap-4">
                    {orderType === "barril" && [
                      { label: "Barril 20L", key: "barril20L", desc: "Aprox 40 pintas · hasta 50 personas", price: selectedBeer?.precios.barril20L },
                      { label: "Barril 30L", key: "barril30L", desc: "Aprox 60 pintas · hasta 80 personas", price: selectedBeer?.precios.barril30L },
                      { label: "Barril 50L", key: "barril50L", desc: "Aprox 100 pintas · +100 personas", price: selectedBeer?.precios.barril50L },
                    ].map((size) => {
                      const itemId = `${selectedBeer?.name}-${size.key}`;
                      const cartItem = items.find((i) => i.id === itemId);
                      return (
                        <div key={size.key} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="text-xl font-bold text-white">{size.label}</h4>
                            <p className="text-xs text-muted-foreground">{size.desc}</p>
                            <p className="text-primary font-mono font-bold mt-1">{formatPrice(size.price || 0)}</p>
                          </div>
                          {cartItem ? (
                            <div className="flex items-center bg-white/10 rounded-xl p-1 shrink-0">
                              <button onClick={() => updateQty(itemId, cartItem.qty - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-9 text-center font-bold text-white">{cartItem.qty}</span>
                              <button onClick={() => updateQty(itemId, cartItem.qty + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem({ id: itemId, name: `${selectedBeer?.name} — ${size.label}`, price: size.price || 0, category: "barril" })}
                              className="shrink-0 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                            >
                              Agregar
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {orderType === "growler" && [
                      { label: "Growler 1L", key: "growler1L", price: selectedBeer?.precios.growler1L },
                      { label: "Growler 2L", key: "growler2L", price: selectedBeer?.precios.growler2L },
                    ].map((size) => {
                      const itemId = `${selectedBeer?.name}-${size.key}`;
                      const cartItem = items.find((i) => i.id === itemId);
                      return (
                        <div key={size.key} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
                          <div>
                            <h4 className="text-xl font-bold text-white">{size.label}</h4>
                            <p className="text-primary font-mono font-bold mt-1">{formatPrice(size.price || 0)}</p>
                          </div>
                          {cartItem ? (
                            <div className="flex items-center bg-white/10 rounded-xl p-1 shrink-0">
                              <button onClick={() => updateQty(itemId, cartItem.qty - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
                                <Minus className="w-4 h-4 text-white" />
                              </button>
                              <span className="w-9 text-center font-bold text-white">{cartItem.qty}</span>
                              <button onClick={() => updateQty(itemId, cartItem.qty + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg">
                                <Plus className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addItem({ id: itemId, name: `${selectedBeer?.name} — ${size.label}`, price: size.price || 0, category: "growler" })}
                              className="shrink-0 px-5 py-2.5 bg-primary text-black font-bold rounded-xl hover:bg-amber-400 transition-colors"
                            >
                              Agregar
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {orderType === "porrón" && (
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-6">
                        <div className="text-center">
                          <h4 className="text-2xl font-bold text-white">Botellas 500ml</h4>
                          <p className="text-primary font-mono font-bold mt-1 text-xl">{formatPrice(selectedBeer?.precios.porrón || 0)} c/u</p>
                        </div>
                        <div className="flex items-center gap-6">
                          <button onClick={() => updateQty(`${selectedBeer?.name}-porrón`, (items.find((i) => i.id === `${selectedBeer?.name}-porrón`)?.qty || 0) - 1)} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                            <Minus className="w-6 h-6" />
                          </button>
                          <span className="text-4xl font-display font-bold text-white w-16 text-center">
                            {items.find((i) => i.id === `${selectedBeer?.name}-porrón`)?.qty || 0}
                          </span>
                          <button onClick={() => addItem({ id: `${selectedBeer?.name}-porrón`, name: `${selectedBeer?.name} — Porrón 500ml`, price: selectedBeer?.precios.porrón || 0, category: "porrón" })} className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                        {(items.find((i) => i.id === `${selectedBeer?.name}-porrón`)?.qty || 0) === 0 && (
                          <p className="text-muted-foreground text-sm italic">Elegí la cantidad para continuar</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <NavButtons />
                  </div>
                </motion.div>
              )}

              {/* STEP 4: EXTRAS + DATOS */}
              {step === 4 && (
                <motion.div key="s4" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Truck className="w-5 h-5 text-primary" /> Entrega
                        </h3>
                        <div className="grid gap-3">
                          {[
                            { id: "fabrica", label: "Retiro en fábrica", desc: "San Martín — Gratis", icon: Store },
                            { id: "norte", label: "Zona Norte GBA", desc: "+$8.000", icon: Truck },
                            { id: "caba", label: "CABA / Zona Sur", desc: "+$12.000", icon: MapPin },
                          ].map((d) => (
                            <button
                              key={d.id}
                              onClick={() => setExtras((p) => ({ ...p, delivery: d.id as any }))}
                              className={cn(
                                "w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4",
                                extras.delivery === d.id ? "bg-primary/10 border-primary" : "bg-white/5 border-transparent hover:bg-white/10"
                              )}
                            >
                              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", extras.delivery === d.id ? "bg-primary text-black" : "bg-white/10 text-white")}>
                                <d.icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <p className="font-bold text-white leading-none mb-1">{d.label}</p>
                                <p className="text-xs text-muted-foreground">{d.desc}</p>
                              </div>
                              {extras.delivery === d.id && <Check className="w-5 h-5 text-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                          <Tag className="w-5 h-5 text-primary" /> Código Promocional
                        </h3>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={promoInput}
                              onChange={(e) => setPromoInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                              placeholder="Ej: PRIMERABIRRA"
                              className={cn("w-full bg-white/5 border-2 rounded-xl py-3 px-4 text-white focus:outline-none transition-all uppercase placeholder:normal-case placeholder:text-white/30", promoStatus === "valid" ? "border-green-500/60" : promoStatus === "invalid" ? "border-red-500/60" : "border-white/10 focus:border-primary")}
                            />
                            {promoStatus === "valid" && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400 w-5 h-5" />}
                            {promoStatus === "invalid" && <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 w-5 h-5" />}
                          </div>
                          <button onClick={applyPromo} className="px-5 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors border border-white/10">
                            Aplicar
                          </button>
                        </div>
                        {promoStatus === "valid" && <p className="text-green-400 text-xs mt-2 font-bold">✓ ¡Descuento del 10% aplicado!</p>}
                        {promoStatus === "invalid" && <p className="text-red-400 text-xs mt-2 font-bold">✗ Código no válido</p>}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" /> Tus datos
                      </h3>
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Nombre Completo *</label>
                        <input type="text" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} placeholder="Ej: Juan Pérez" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Fecha *</label>
                          <input type="date" value={formData.fecha} onChange={(e) => setFormData({ ...formData, fecha: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Horario</label>
                          <select value={formData.horario} onChange={(e) => setFormData({ ...formData, horario: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none">
                            <option value="Mañana 9-12hs">Mañana (9-12hs)</option>
                            <option value="Tarde 12-16hs">Tarde (12-16hs)</option>
                            <option value="Noche 16-20hs">Noche (16-20hs)</option>
                          </select>
                        </div>
                      </div>
                      {extras.delivery !== "fabrica" && (
                        <div>
                          <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Dirección *</label>
                          <input type="text" value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} placeholder="Ej: Av. Corrientes 1234, CABA" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-white/20" />
                        </div>
                      )}
                      <div>
                        <label className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5 block">Comentarios</label>
                        <textarea value={formData.comentarios} onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })} placeholder="Detalles de entrega, preferencias, etc." className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary h-24 resize-none placeholder:text-white/20" />
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <NavButtons />
                  </div>
                </motion.div>
              )}

              {/* STEP 5: TICKET */}
              {step === 5 && (
                <motion.div key="s5" custom={direction} variants={slideVariants} initial="initial" animate="animate" exit="exit" className="max-w-sm mx-auto w-full">
                  <div className="relative bg-[#fafaf8] text-[#222] rounded-lg shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full overflow-hidden leading-none" style={{ height: "16px" }}>
                      <svg viewBox="0 0 1200 20" className="w-full h-full" preserveAspectRatio="none">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <polygon key={i} points={`${i * 40},0 ${i * 40 + 20},20 ${i * 40 + 40},0`} fill="#0a0a0a" />
                        ))}
                      </svg>
                    </div>
                    <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180" style={{ height: "16px" }}>
                      <svg viewBox="0 0 1200 20" className="w-full h-full" preserveAspectRatio="none">
                        {Array.from({ length: 30 }).map((_, i) => (
                          <polygon key={i} points={`${i * 40},0 ${i * 40 + 20},20 ${i * 40 + 40},0`} fill="#0a0a0a" />
                        ))}
                      </svg>
                    </div>

                    <div className="pt-10 pb-10 px-7">
                      <div className="text-center mb-6">
                        <p className="text-4xl mb-1">🍺</p>
                        <h3 className="text-2xl font-black uppercase tracking-tighter">LUPULADOS</h3>
                        <p className="text-[10px] font-mono text-[#999] mt-0.5">CERVECERÍA ARTESANAL · AV. SAN MARTÍN 1234</p>
                        <div className="mt-4 py-2 border-y-2 border-dashed border-[#ccc]">
                          <p className="font-mono font-bold text-sm tracking-widest">ORDEN #{orderId}</p>
                        </div>
                      </div>

                      <div className="space-y-2 font-mono text-sm">
                        {[
                          { label: "CLIENTE", value: formData.nombre || "—" },
                          { label: "FECHA", value: formData.fecha || "—" },
                          { label: "HORARIO", value: formData.horario },
                          { label: "ENVÍO", value: extras.delivery === "fabrica" ? "Retiro en fábrica" : extras.delivery === "norte" ? "Zona Norte GBA" : "CABA / Sur" },
                        ].map((row) => (
                          <div key={row.label} className="flex items-end gap-1">
                            <span className="text-[#777] text-[11px] shrink-0">{row.label}</span>
                            <div className="flex-1 border-b border-dotted border-[#ccc] mb-0.5 mx-1" />
                            <span className="text-[11px] shrink-0 text-right max-w-[120px] truncate">{row.value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#ddd]">
                        <p className="font-mono font-bold text-[10px] uppercase tracking-widest text-[#999] mb-3">Detalle del pedido</p>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-start font-mono text-xs gap-2">
                              <div className="flex-1">
                                <p className="font-bold text-[#333] leading-tight">{item.name}</p>
                                <p className="text-[10px] text-[#999]">{item.qty} u. × {formatPrice(item.price)}</p>
                              </div>
                              <span className="font-bold text-[#222] shrink-0">{formatPrice(item.price * item.qty)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {extras.promoCode && (
                        <div className="mt-3 flex justify-between font-mono text-xs text-green-600 font-bold">
                          <span>DESCUENTO {extras.promoCode}</span>
                          <span>-10%</span>
                        </div>
                      )}

                      <div className="mt-4 pt-4 border-t-2 border-dashed border-[#ccc] text-center">
                        <p className="text-[10px] font-mono text-[#999] uppercase tracking-widest mb-1">Total a pagar</p>
                        <p className="text-4xl font-black tracking-tight text-[#111]">{formatPrice(totalPrice)}</p>
                      </div>

                      <p className="text-center text-[9px] font-mono text-[#bbb] mt-6 leading-relaxed">
                        NO ES COMPROBANTE FISCAL<br />
                        GRACIAS POR ELEGIRNOS 🍻 LUPULADOS.AR
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <a
                      href={generateWhatsAppURL()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-4 rounded-2xl bg-[#25D366] text-white font-bold text-lg shadow-lg hover:bg-[#1db954] transition-all flex items-center justify-center gap-3"
                    >
                      Enviar por WhatsApp 📲
                    </a>
                    <button
                      onClick={() => { setDirection(-1); setStep(1); setOrderType(null); setSelectedBeer(null); clearCart(); }}
                      className="w-full py-3.5 rounded-2xl bg-white/5 text-white font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2 border border-white/10"
                    >
                      <Edit className="w-4 h-4" /> Modificar pedido
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Desktop order summary sidebar */}
          <div className="hidden lg:block sticky top-32">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <LiveOrderSummary />
            </div>
          </div>

        </div>
      </div>

      {/* Mobile bottom bar + drawer */}
      <AnimatePresence>
        {step >= 2 && step < 5 && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-0 left-0 w-full z-50 lg:hidden"
          >
            {/* Drawer */}
            <AnimatePresence>
              {drawerOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  className="bg-[#0f0f0f] border-t border-white/10 overflow-hidden"
                >
                  <div className="p-5 max-h-[65vh] overflow-y-auto">
                    <LiveOrderSummary asDrawer onClose={() => setDrawerOpen(false)} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mini bar */}
            <div className="bg-[#0f0f0f]/95 backdrop-blur-md border-t border-primary/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
                <button
                  onClick={() => setDrawerOpen(!drawerOpen)}
                  className="flex items-center gap-2 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-primary" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-black text-[9px] font-bold flex items-center justify-center">{totalItems}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-white/50 leading-none">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                    <p className="text-white font-bold text-base leading-tight">{formatPrice(totalPrice)}</p>
                  </div>
                  {drawerOpen ? <ChevronDown className="w-4 h-4 text-white/40 ml-1" /> : <ChevronUp className="w-4 h-4 text-white/40 ml-1" />}
                </button>
                <button
                  onClick={goNext}
                  disabled={!canProceed}
                  className={cn(
                    "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all",
                    canProceed ? "bg-primary text-black" : "bg-white/10 text-white/30 cursor-not-allowed"
                  )}
                >
                  Continuar <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
