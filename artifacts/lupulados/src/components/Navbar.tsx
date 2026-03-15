import { useState, useEffect } from "react";
import { Menu, X, Beer } from "lucide-react";
import { cn, scrollToSection } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { name: "Inicio", href: "inicio" },
  { name: "Servicios", href: "servicios" },
  { name: "Cervezas", href: "cervezas" },
  { name: "Calculadora", href: "calculadora" },
  { name: "Armá tu Pedido", href: "arma-tu-pedido" },
  { name: "Eventos", href: "eventos" },
  { name: "Cómo Funciona", href: "como-funciona" },
  { name: "FAQ", href: "faq" },
];

interface NavbarProps {
  bannerVisible: boolean;
  bannerHeight: number;
}

export function Navbar({ bannerVisible, bannerHeight }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    scrollToSection(href);
  };

  const navTop = bannerVisible ? bannerHeight : 0;

  return (
    <nav
      style={{ top: `${navTop}px` }}
      className={cn(
        "fixed left-0 right-0 z-40 transition-all duration-300",
        isScrolled
          ? "bg-background/95 backdrop-blur-md border-b border-white/5 py-3 shadow-lg"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => handleNavClick("inicio")}
          >
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(217,119,6,0.3)] group-hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] transition-all">
              <Beer className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl tracking-wide text-white">
              Lupulados
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <button
                key={link.name}
                onClick={() => handleNavClick(link.href)}
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group whitespace-nowrap"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </button>
            ))}
            <button
              onClick={() => handleNavClick("ubicacion")}
              className="px-5 py-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-semibold transition-all hover:border-primary/50"
            >
              Contacto
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden absolute top-full left-0 w-full bg-background/98 backdrop-blur-xl border-b border-white/10 shadow-2xl"
          >
            <div className="flex flex-col p-4 gap-2 max-h-[80vh] overflow-y-auto">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.name}
                  onClick={() => handleNavClick(link.href)}
                  className="w-full text-left px-4 py-3 rounded-lg text-muted-foreground hover:text-primary hover:bg-white/5 transition-colors text-lg font-medium"
                >
                  {link.name}
                </button>
              ))}
              <button
                onClick={() => handleNavClick("ubicacion")}
                className="w-full mt-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-center"
              >
                Contacto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
