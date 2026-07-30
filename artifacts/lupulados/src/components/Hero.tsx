import { motion, AnimatePresence } from "framer-motion";
import { scrollToSection } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { prefersReducedMotion } from "@/lib/reducedMotion";

const HERO_IMAGES = [
  {
    url: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=1920&h=1080&fit=crop&q=90",
    alt: "Barriles de cerveza artesanal"
  },
  {
    url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1920&h=1080&fit=crop&q=90",
    alt: "Amigos brindando con cerveza artesanal"
  },
  {
    url: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?w=1920&h=1080&fit=crop&q=90",
    alt: "Lúpulos frescos para cerveza artesanal"
  },
  {
    url: "https://images.unsplash.com/photo-1566633806327-68e152aaf26d?w=1920&h=1080&fit=crop&q=90",
    alt: "Cerveza artesanal siendo servida"
  },
  {
    url: "https://images.unsplash.com/photo-1528823872057-9c018a7a7553?w=1920&h=1080&fit=crop&q=90",
    alt: "Gente celebrando con cerveza artesanal"
  },
  {
    url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=1920&h=1080&fit=crop&q=90",
    alt: "Cerveza artesanal en vaso chopero"
  },
];

const INTERVAL_MS = 12000;

export function Hero() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: string; size: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const newBubbles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 60 + 10}px`,
      delay: `${Math.random() * 15}s`,
      duration: `${Math.random() * 10 + 15}s`,
    }));
    setBubbles(newBubbles);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="inicio" className="site-section relative min-h-[100svh] flex items-center justify-center overflow-hidden">

      {/* Slideshow Images — crossfade */}
      <div className="absolute inset-0 z-0">
        {HERO_IMAGES.map((img, i) => (
          <AnimatePresence key={i}>
            {i === currentIndex && (
              <motion.div
                key={`img-${i}`}
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: `url("${img.url}")` }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                aria-hidden="true"
              />
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Dark overlay gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/65 to-background z-[1]" />
      <div className="absolute inset-0 bg-black/30 z-[1]" />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay z-[1]"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-texture.png)` }}
      />

      {/* Animated Bubbles */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="beer-bubble"
            style={{
              left: b.left,
              width: b.size,
              height: b.size,
              animationDelay: b.delay,
              animationDuration: b.duration,
              bottom: '-10%',
            }}
          />
        ))}
      </div>

      {/* Slide indicator dots */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            aria-label={`Ir a imagen ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === currentIndex
                ? "w-6 h-2 bg-primary"
                : "w-2 h-2 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-white tracking-wide uppercase">Envíos y retiro en fábrica</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white max-w-5xl leading-[1.1] text-balance mb-6"
        >
          Cerveza artesanal para tus{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500 italic pr-2">
            mejores momentos
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
        >
          Alquiler de barriles · Venta de cerveza · Servicio premium para eventos.{" "}
          Llevamos la experiencia de la mejor cervecería a donde vos estés.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            type="button"
            onClick={() => scrollToSection("arma-tu-pedido", { updateHash: true })}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold bg-primary text-primary-foreground hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] hover:-translate-y-1"
          >
            Pedí tu barril
          </button>
          <a
            href="/tienda"
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1 group"
          >
            Ver tienda demo
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </a>
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
