import { Beer, Instagram, Facebook, Send } from "lucide-react";
import { scrollToSection } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="bg-background pt-20 pb-10 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Beer className="w-4 h-4 text-black" />
              </div>
              <span className="font-display font-bold text-xl text-white">Lupulados</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Cerveza artesanal de calidad superior. Llevamos la mejor experiencia directo a tu evento con alquiler de barriles y choperas.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-black transition-colors">
                <Send className="w-4 h-4" /> {/* TikTok icon replacement */}
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Navegación</h4>
            <ul className="space-y-3">
              <li><button onClick={() => scrollToSection('servicios')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Servicios</button></li>
              <li><button onClick={() => scrollToSection('cervezas')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Nuestras Cervezas</button></li>
              <li><button onClick={() => scrollToSection('eventos')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Eventos</button></li>
              <li><button onClick={() => scrollToSection('calculadora')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Calculadora de Barriles</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Ayuda</h4>
            <ul className="space-y-3">
              <li><button onClick={() => scrollToSection('como-funciona')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Cómo Funciona</button></li>
              <li><button onClick={() => scrollToSection('faq')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Preguntas Frecuentes</button></li>
              <li><button onClick={() => scrollToSection('ubicacion')} className="text-muted-foreground hover:text-primary transition-colors text-sm">Contacto</button></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6">Ubicación</h4>
            <ul className="space-y-3">
              <li className="text-muted-foreground text-sm">Av. San Martín 1234, CABA</li>
              <li className="text-muted-foreground text-sm">+54 9 11 1234-5678</li>
              <li className="text-muted-foreground text-sm">info@lupulados.com.ar</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="text-muted-foreground text-xs">
            © {new Date().getFullYear()} Lupulados. Todos los derechos reservados.
          </p>
          <div className="flex gap-2 items-center px-4 py-2 bg-red-950/30 text-red-500 rounded text-xs font-bold border border-red-900/30">
            BEBER CON MODERACIÓN. PROHIBIDA LA VENTA A MENORES DE 18 AÑOS.
          </div>
        </div>

      </div>
    </footer>
  );
}
