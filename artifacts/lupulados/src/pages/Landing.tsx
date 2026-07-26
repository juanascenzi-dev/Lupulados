import { lazy, Suspense, useRef, useState } from "react";
import { PromoBanner } from "@/components/PromoBanner";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Cervezas } from "@/components/Cervezas";
import { Footer } from "@/components/Footer";
import { FloatingActions } from "@/components/FloatingActions";
import { CartFloating } from "@/components/CartFloating";
import { RouteFallback } from "@/components/RouteFallback";
import { useCommercialDerivedData } from "@/context/CommercialDataContext";
import type { BarrelRecommendation } from "@/domain/barrelCalculator";

const BANNER_HEIGHT = 44;
const Calculadora = lazy(() => import("@/components/Calculadora").then((module) => ({ default: module.Calculadora })));
const ArmaTuPedido = lazy(() => import("@/components/ArmaTuPedido").then((module) => ({ default: module.ArmaTuPedido })));
const ComoFunciona = lazy(() => import("@/components/ComoFunciona").then((module) => ({ default: module.ComoFunciona })));
const Eventos = lazy(() => import("@/components/Eventos").then((module) => ({ default: module.Eventos })));
const Testimonios = lazy(() => import("@/components/Testimonios").then((module) => ({ default: module.Testimonios })));
const FAQ = lazy(() => import("@/components/FAQ").then((module) => ({ default: module.FAQ })));
const Ubicacion = lazy(() => import("@/components/Ubicacion").then((module) => ({ default: module.Ubicacion })));

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
        <Suspense fallback={<RouteFallback label="Cargando calculadora..." minHeightClassName="min-h-[420px]" />}>
          <Calculadora onUseRecommendation={useRecommendation} />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback
              id="arma-tu-pedido"
              label="Cargando pedido..."
              minHeightClassName="min-h-[680px]"
              sectionRef={orderSectionRef}
            />
          }
        >
          <ArmaTuPedido
            pendingRecommendation={pendingRecommendation}
            sectionRef={orderSectionRef}
          />
        </Suspense>
        <Suspense fallback={<RouteFallback label="Cargando contenido..." minHeightClassName="min-h-[360px]" />}>
          <ComoFunciona />
        </Suspense>
        <Suspense fallback={<RouteFallback id="eventos" label="Cargando eventos..." minHeightClassName="min-h-[560px]" />}>
          <Eventos />
        </Suspense>
        <Suspense fallback={<RouteFallback label="Cargando testimonios..." minHeightClassName="min-h-[320px]" />}>
          <Testimonios />
        </Suspense>
        <Suspense fallback={<RouteFallback label="Cargando preguntas frecuentes..." minHeightClassName="min-h-[360px]" />}>
          <FAQ />
        </Suspense>
        <Suspense fallback={<RouteFallback label="Cargando ubicacion..." minHeightClassName="min-h-[520px]" />}>
          <Ubicacion />
        </Suspense>
      </main>

      <Footer />
      <FloatingActions />
      <CartFloating />
    </div>
  );
}
