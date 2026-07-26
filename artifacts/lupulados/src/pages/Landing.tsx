import { useRef, useState } from "react";
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
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";

const BANNER_HEIGHT = 44;

export default function Landing() {
  const { promotionConfig } = useCommercialDerivedData();
  const orderSectionRef = useRef<HTMLElement | null>(null);
  const [showBanner, setShowBanner] = useState(() => {
    return localStorage.getItem(promotionConfig.bannerClosedStorageKey) !== "true";
  });
  const [pendingRecommendation, setPendingRecommendation] =
    useState<BarrelRecommendation | null>(null);

  const closeBanner = () => {
    setShowBanner(false);
    localStorage.setItem(promotionConfig.bannerClosedStorageKey, "true");
  };

  const useRecommendation = (recommendation: BarrelRecommendation) => {
    setPendingRecommendation({
      ...recommendation,
      parts: recommendation.parts.map((part) => ({ ...part })),
    });
    orderSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative w-full bg-background">
      <PromoBanner visible={showBanner} onClose={closeBanner} />
      <Navbar bannerVisible={showBanner} bannerHeight={BANNER_HEIGHT} />

      <main>
        <Hero />
        <Services />
        <Cervezas />
        <Calculadora onUseRecommendation={useRecommendation} />
        <ArmaTuPedido
          pendingRecommendation={pendingRecommendation}
          sectionRef={orderSectionRef}
        />
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
