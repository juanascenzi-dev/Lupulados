import { motion } from "framer-motion";
import { scrollToSection } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function Hero() {
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: string; size: string; delay: string; duration: string }>>([]);

  useEffect(() => {
    // Generate bubbles only on client side to avoid hydration mismatch
    const newBubbles = Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 60 + 10}px`,
      delay: `${Math.random() * 15}s`,
      duration: `${Math.random() * 10 + 15}s`,
    }));
    setBubbles(newBubbles);
  }, []);

  return (
    <section id="inicio" className="relative min-h-[100svh] flex items-center justify-center overflow-hidden">
      {/* Background Image & Overlays */}
      {/* landing page hero craft beer barrel pouring */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{ backgroundImage: 'url("https://pixabay.com/get/gb3e3d76694c0dc9e949a675464916d6ff841976b1734c37176453c98b57edbe14826b5e9a2d12d9e440d0f14e5c78879cf1fc4acd240c327083bafb21ed6d97c_1280.jpg")' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/70 to-background z-0" />
      <div 
        className="absolute inset-0 opacity-40 mix-blend-overlay z-0"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-texture.png)` }}
      />

      {/* Animated Bubbles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 text-center flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-white tracking-wide uppercase">Envíos y retiro en fábrica</span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-display font-bold text-white max-w-5xl leading-[1.1] text-balance mb-6"
        >
          Cerveza artesanal para tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-500 italic pr-2">mejores momentos</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12"
        >
          Alquiler de barriles · Venta de cerveza · Servicio premium para eventos. 
          Llevamos la experiencia de la mejor cervecería a donde vos estés.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <button
            onClick={() => scrollToSection('arma-tu-pedido')}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold bg-primary text-primary-foreground hover:bg-amber-400 transition-all shadow-[0_0_20px_rgba(217,119,6,0.3)] hover:shadow-[0_0_40px_rgba(217,119,6,0.5)] hover:-translate-y-1"
          >
            Pedí tu barril
          </button>
          <button
            onClick={() => scrollToSection('eventos')}
            className="inline-flex items-center justify-center px-8 py-4 rounded-full text-lg font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-all hover:-translate-y-1 group"
          >
            Ver nuestros eventos
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
}
