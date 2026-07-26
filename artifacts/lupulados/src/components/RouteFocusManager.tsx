import { useEffect } from "react";
import { useLocation } from "wouter";
import { getMotionAwareScrollBehavior } from "@/lib/reducedMotion";

export function RouteFocusManager() {
  const [pathname] = useLocation();

  useEffect(() => {
    const main = document.getElementById("contenido-principal");
    if (!main) return;

    main.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: getMotionAwareScrollBehavior() });
  }, [pathname]);

  return null;
}
