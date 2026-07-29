import { useCallback, useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INSTALL_INITIAL_EXPANDED_MS,
  getInstallUiState,
  hasStoredIosInstallDismissal,
  isIosDevice,
  isStandaloneDisplayMode,
  shouldCompactInstallPrompt,
  storeIosInstallDismissal,
} from "@/domain/pwaInstall";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function getStandaloneDisplay() {
  return isStandaloneDisplayMode(
    window.matchMedia("(display-mode: standalone)").matches,
    "standalone" in window.navigator
      ? (window.navigator as Navigator & { standalone?: boolean }).standalone
      : undefined,
  );
}

function getIosDevice() {
  return isIosDevice({
    userAgent: window.navigator.userAgent,
    platform: window.navigator.platform,
    maxTouchPoints: window.navigator.maxTouchPoints,
  });
}

function usesCoarsePointer() {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: none), (pointer: coarse)").matches
  );
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [compacted, setCompacted] = useState(false);
  const [interactionExpanded, setInteractionExpanded] = useState(false);
  const [mobileExplanationOpen, setMobileExplanationOpen] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (getStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    if (getIosDevice() && !hasStoredIosInstallDismissal(window.localStorage)) {
      setShowIosHint(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallAvailable(true);
      setShowIosHint(false);
      setCompacted(false);
      setInteractionExpanded(false);
      setMobileExplanationOpen(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallAvailable(false);
      setShowIosHint(false);
      setMobileExplanationOpen(false);
      setInteractionExpanded(false);
      setIsPrompting(false);
      setInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    if (!installAvailable || compacted) return;

    const timerId = window.setTimeout(() => {
      setCompacted(true);
    }, INSTALL_INITIAL_EXPANDED_MS);

    return () => window.clearTimeout(timerId);
  }, [compacted, installAvailable]);

  useEffect(() => {
    if (!installAvailable || compacted) return;

    const initialScrollY = window.scrollY;
    const handleScroll = () => {
      if (shouldCompactInstallPrompt(initialScrollY, window.scrollY)) {
        setCompacted(true);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [compacted, installAvailable]);

  const closeMobileExplanation = () => {
    setMobileExplanationOpen(false);
  };

  const installApp = useCallback(async () => {
    if (!deferredPrompt || isPrompting) return;

    const clearNativePrompt = () => {
      setDeferredPrompt(null);
      setInstallAvailable(false);
      setMobileExplanationOpen(false);
      setInteractionExpanded(false);
    };

    setIsPrompting(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice.catch(() => null);
      if (choice) {
        clearNativePrompt();
      }
    } catch {
      clearNativePrompt();
    } finally {
      setIsPrompting(false);
    }
  }, [deferredPrompt, isPrompting]);

  const handleInstallButtonClick = () => {
    if (compacted && usesCoarsePointer() && !mobileExplanationOpen) {
      setMobileExplanationOpen(true);
      return;
    }

    void installApp();
  };

  const closeIosHint = () => {
    storeIosInstallDismissal(window.localStorage);
    setShowIosHint(false);
  };

  const uiState = getInstallUiState({
    installed,
    installAvailable,
    iosHintAvailable: showIosHint,
    compacted,
    interactionExpanded,
    mobileExplanationOpen,
    prompting: isPrompting,
  });

  if (uiState === "none") return null;

  if (uiState === "ios-hint") {
    return (
      <div className="max-w-64 rounded-lg border border-white/10 bg-background/95 p-3 text-sm text-foreground shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="leading-snug">{"Compartir \u2192 Agregar a pantalla de inicio"}</p>
          <button
            type="button"
            onClick={closeIosHint}
            className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Cerrar indicacion de instalacion"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  const isExpanded = uiState === "expanded" || uiState === "prompting";
  const isMobilePanelOpen = uiState === "mobile-explanation";

  return (
    <div className="relative flex flex-col items-end gap-2">
      {isMobilePanelOpen && (
        <div className="w-[min(18rem,calc(100vw-3rem))] rounded-xl border border-white/10 bg-background/95 p-4 text-sm text-foreground shadow-xl backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-white">Instalar Lupulados</p>
              <p className="mt-1 leading-snug text-muted-foreground">
                Instala Lupulados para abrirla como una app y acceder mas rapido.
              </p>
            </div>
            <button
              type="button"
              onClick={closeMobileExplanation}
              className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Cerrar explicacion de instalacion"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => void installApp()}
            disabled={isPrompting}
            className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground transition-colors hover:bg-amber-500 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {isPrompting ? "Abriendo..." : "Instalar"}
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={handleInstallButtonClick}
        onMouseEnter={() => compacted && setInteractionExpanded(true)}
        onMouseLeave={() => setInteractionExpanded(false)}
        onFocus={() => compacted && setInteractionExpanded(true)}
        onBlur={() => setInteractionExpanded(false)}
        className={cn(
          "inline-flex min-h-14 items-center justify-center gap-2 overflow-hidden border border-primary/40 bg-background/95 text-sm font-semibold text-primary shadow-lg backdrop-blur-md transition-[width,padding,background-color,color,transform] duration-200 hover:bg-primary hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transition-none",
          isExpanded
            ? "w-[min(15rem,calc(100vw-3rem))] rounded-full px-4 py-2"
            : "h-14 w-14 rounded-full p-0",
        )}
        aria-label="Instalar Lupulados"
        aria-describedby={isExpanded ? "pwa-install-description" : undefined}
        disabled={isPrompting}
      >
        <Download className="h-5 w-5 shrink-0" aria-hidden="true" />
        {isExpanded && (
          <span className="min-w-0 text-left leading-tight">
            <span className="block whitespace-nowrap">Instalar Lupulados</span>
            <span id="pwa-install-description" className="block text-xs font-normal opacity-80">
              Abrila como app y accede mas rapido.
            </span>
          </span>
        )}
      </button>
    </div>
  );
}
