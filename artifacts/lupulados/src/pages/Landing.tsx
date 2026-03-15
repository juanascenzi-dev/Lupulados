import { PromoBanner } from "@/components/PromoBanner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Cervezas } from "@/components/Cervezas";
import { Eventos } from "@/components/Eventos";
import { ComoFunciona } from "@/components/ComoFunciona";
import { Calculadora } from "@/components/Calculadora";
import { Testimonios } from "@/components/Testimonios";
import { FAQ } from "@/components/FAQ";
import { Ubicacion } from "@/components/Ubicacion";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { ArmaTuPedido } from "@/components/ArmaTuPedido";
import { CartFloating } from "@/components/CartFloating";

export default function Landing() {
  return (
    <div className="relative w-full overflow-hidden bg-background">
      <PromoBanner />
      <Navbar />
      
      <main>
        <Hero />
        <Services />
        <Cervezas />
        <Calculadora />
        <ArmaTuPedido />
        <ComoFunciona />
        <Eventos />
        <Testimonios />
        <FAQ />
        <Ubicacion />
      </main>

      <Footer />
      <FloatingActions />
      <CartFloating />
    </div>
  );
}
