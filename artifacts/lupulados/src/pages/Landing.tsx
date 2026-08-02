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
import type { BeverageMixItemEstimate } from "@/domain/beverageMix";
import { getSectionIdFromHash, scrollToSection } from "@/lib/sectionNavigation";

const Calculadora = lazy(() =>
  import("@/components/Calculadora").then((module) => ({ default: module.Calculadora })),
);
const ArmaTuPedido = lazy(() =>
  import("@/components/ArmaTuPedido").then((module) => ({ default: module.ArmaTuPedido })),
);
const ComoFunciona = lazy(() =>
  import("@/components/ComoFunciona").then((module) => ({ default: module.ComoFunciona })),
);
const Eventos = lazy(() =>
  import("@/components/Eventos").then((module) => ({ default: module.Eventos })),
);
const Testimonios = lazy(() =>
  import("@/components/Testimonios").then((module) => ({ default: module.Testimonios })),
);
const FAQ = lazy(() => import("@/components/FAQ").then((module) => ({ default: module.FAQ })));
const Ubicacion = lazy(() =>
  import("@/components/Ubicacion").then((module) => ({ default: module.Ubicacion })),
);

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
  const [pendingRecommendation, setPendingRecommendation] = useState<BarrelRecommendation | null>(
    null,
  );
  const [pendingBeverageMix, setPendingBeverageMix] = useState<BeverageMixItemEstimate[] | null>(
    null,
  );
  const [pendingBeerPreferenceIds, setPendingBeerPreferenceIds] = useState<string[]>([]);
  const [orderSectionVisible, setOrderSectionVisible] = useState(false);
  const [calculatorSectionVisible, setCalculatorSectionVisible] = useState(false);
  const [mobileViewport, setMobileViewport] = useState(false);
  const [currentHash, setCurrentHash] = useState(() =>
    typeof window === "undefined" ? "" : window.location.hash,
  );

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

  const useRecommendation = (
    recommendation: BarrelRecommendation,
    mixResult: BeverageMixItemEstimate[],
    beerPreferenceIds: string[] = [],
  ) => {
    setPendingRecommendation({
      ...recommendation,
      parts: recommendation.parts.map((part) => ({ ...part })),
    });
    setPendingBeverageMix(mixResult.map((item) => ({ ...item })));
    setPendingBeerPreferenceIds([...beerPreferenceIds]);
    scrollToSection("arma-tu-pedido", { updateHash: true });
  };

  useEffect(() => {
    let frameId: number | null = null;

    const scrollToCurrentHash = () => {
      const sectionId = getSectionIdFromHash(window.location.hash);
      if (!sectionId) return;

      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        scrollToSection(sectionId);
      });
    };

    scrollToCurrentHash();
    window.addEventListener("hashchange", scrollToCurrentHash);
    window.addEventListener("popstate", scrollToCurrentHash);
    window.addEventListener("resize", scrollToCurrentHash);

    return () => {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", scrollToCurrentHash);
      window.removeEventListener("popstate", scrollToCurrentHash);
      window.removeEventListener("resize", scrollToCurrentHash);
    };
  }, [promoBannerHeight, showBanner]);

  useEffect(() => {
    const updateHash = () => setCurrentHash(window.location.hash);
    updateHash();

    window.addEventListener("hashchange", updateHash);
    window.addEventListener("popstate", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
      window.removeEventListener("popstate", updateHash);
    };
  }, []);

  useEffect(() => {
    const section = orderSectionRef.current;
    if (!section || typeof IntersectionObserver !== "function") return;

    const observer = new IntersectionObserver(
      ([entry]) => setOrderSectionVisible(entry.isIntersecting),
      { rootMargin: "-20% 0px -45% 0px", threshold: 0 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1023px)");
    const updateMobileViewport = () => setMobileViewport(mediaQuery.matches);

    updateMobileViewport();
    mediaQuery.addEventListener("change", updateMobileViewport);
    return () => mediaQuery.removeEventListener("change", updateMobileViewport);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver !== "function") return;
    const section = document.getElementById("calculadora");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setCalculatorSectionVisible(entry.isIntersecting),
      { rootMargin: "-10% 0px -25% 0px", threshold: 0 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  const orderFlowActive = currentHash === "#arma-tu-pedido" || orderSectionVisible;
  const calculatorFlowActive =
    mobileViewport && (currentHash === "#calculadora" || calculatorSectionVisible);
  const floatingControlsOffset = orderFlowActive || calculatorFlowActive;

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
        <Suspense
          fallback={
            <RouteFallback
              id="calculadora"
              label="Cargando calculadora..."
              minHeightClassName="min-h-[420px]"
            />
          }
        >
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
            pendingBeverageMix={pendingBeverageMix}
            pendingBeerPreferenceIds={pendingBeerPreferenceIds}
            sectionRef={orderSectionRef}
          />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback
              id="eventos"
              label="Cargando eventos..."
              minHeightClassName="min-h-[560px]"
            />
          }
        >
          <Eventos />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback
              id="como-funciona"
              label="Cargando contenido..."
              minHeightClassName="min-h-[360px]"
            />
          }
        >
          <ComoFunciona />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback label="Cargando testimonios..." minHeightClassName="min-h-[320px]" />
          }
        >
          <Testimonios />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback
              id="faq"
              label="Cargando preguntas frecuentes..."
              minHeightClassName="min-h-[360px]"
            />
          }
        >
          <FAQ />
        </Suspense>
        <Suspense
          fallback={
            <RouteFallback
              id="ubicacion"
              label="Cargando ubicacion..."
              minHeightClassName="min-h-[520px]"
            />
          }
        >
          <Ubicacion />
        </Suspense>
      </main>

      <Footer />
      <FloatingActions orderFlowActive={floatingControlsOffset} />
      <CartFloating orderFlowActive={floatingControlsOffset} />
    </div>
  );
}
