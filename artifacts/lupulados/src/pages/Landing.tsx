import { lazy, Suspense, useEffect, useRef, useState } from "react";
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
import { scrollToSection } from "@/lib/sectionNavigation";

const Calculadora = lazy(() => import("@/components/Calculadora").then((module) => ({ default: module.Calculadora })));
const ArmaTuPedido = lazy(() => import("@/components/ArmaTuPedido").then((module) => ({ default: module.ArmaTuPedido })));
const ComoFunciona = lazy(() => import("@/components/ComoFunciona").then((module) => ({ default: module.ComoFunciona })));
const Eventos = lazy(() => import("@/components/Eventos").then((module) => ({ default: module.Eventos })));
const Testimonios = lazy(() => import("@/components/Testimonios").then((module) => ({ default: module.Testimonios })));
const FAQ = lazy(() => import("@/components/FAQ").then((module) => ({ default: module.FAQ })));
const Ubicacion = lazy(() => import("@/components/Ubicacion").then((module) => ({ default: module.Ubicacion })));

function isPromoBannerClosed(storageKey: string) {
  try {
    return localStorage.getItem(storageKey) === "true";
  } catch {
    return false;
  }
}

function persistPromoBannerClosed(storageKey: string) {
  try {
    localStorage.setItem(storageKey, "true");
  } catch {
    // The banner can still close in memory when browser storage is unavailable.
  }
}

export default function Landing() {
  const { promotionConfig } = useCommercialDerivedData();
  const orderSectionRef = useRef<HTMLElement | null>(null);
  const [promoBannerElement, setPromoBannerElement] = useState<HTMLDivElement | null>(null);
  const [promoBannerHeight, setPromoBannerHeight] = useState(0);
  const [showBanner, setShowBanner] = useState(() => {
    return !isPromoBannerClosed(promotionConfig.bannerClosedStorageKey);
  });
  const [pendingRecommendation, setPendingRecommendation] =
    useState<BarrelRecommendation | null>(null);

  const closeBanner = () => {
    setShowBanner(false);
    persistPromoBannerClosed(promotionConfig.bannerClosedStorageKey);
  };

  useEffect(() => {
    if (!promoBannerElement) {
      setPromoBannerHeight(0);
      return;
    }

    const updateBannerHeight = () => {
      setPromoBannerHeight(Math.ceil(promoBannerElement.getBoundingClientRect().height));
    };

    updateBannerHeight();
    const resizeObserver =
      typeof ResizeObserver === "function" ? new ResizeObserver(updateBannerHeight) : null;
    resizeObserver?.observe(promoBannerElement);
    window.addEventListener("resize", updateBannerHeight);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateBannerHeight);
    };
  }, [promoBannerElement]);

  const useRecommendation = (recommendation: BarrelRecommendation) => {
    setPendingRecommendation({
      ...recommendation,
      parts: recommendation.parts.map((part) => ({ ...part })),
    });
    scrollToSection("arma-tu-pedido");
  };

  return (
    <div className="relative w-full bg-background">
      <a href="#contenido-principal" className="skip-link">
        Saltar al contenido
      </a>
      <PromoBanner visible={showBanner} onClose={closeBanner} bannerRef={setPromoBannerElement} />
      <Navbar bannerVisible={showBanner} bannerHeight={promoBannerHeight} />

      <main id="contenido-principal" tabIndex={-1}>
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
