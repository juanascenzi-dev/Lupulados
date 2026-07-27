import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const IOS_INSTALL_DISMISSED_KEY = "lupulados-ios-install-dismissed";

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function isIosDevice() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && window.navigator.maxTouchPoints > 1)
  );
}

function wasIosInstallDismissed() {
  try {
    return window.localStorage.getItem(IOS_INSTALL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

function dismissIosInstallPrompt() {
  try {
    window.localStorage.setItem(IOS_INSTALL_DISMISSED_KEY, "true");
  } catch {
    // The dismiss button still hides the hint for the current session.
  }
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installAvailable, setInstallAvailable] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) return;

    if (isIosDevice() && !wasIosInstallDismissed()) {
      setShowIosHint(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setInstallAvailable(true);
      setShowIosHint(false);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setInstallAvailable(false);
      setShowIosHint(false);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    setInstallAvailable(false);
    try {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice.catch(() => null);
    } finally {
      setDeferredPrompt(null);
    }
  };

  const closeIosHint = () => {
    dismissIosInstallPrompt();
    setShowIosHint(false);
  };

  if (installAvailable) {
    return (
      <button
        type="button"
        onClick={installApp}
        className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary/40 bg-background/95 px-4 py-2 text-sm font-semibold text-primary shadow-lg backdrop-blur-md transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        Instalar Lupulados
      </button>
    );
  }

  if (showIosHint) {
    return (
      <div className="max-w-64 rounded-lg border border-white/10 bg-background/95 p-3 text-sm text-foreground shadow-lg backdrop-blur-md">
        <div className="flex items-start gap-3">
          <Download className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <p className="leading-snug">{"Compartir \u2192 Agregar a pantalla de inicio"}</p>
          <button
            type="button"
            onClick={closeIosHint}
            className="-mr-1 -mt-1 rounded-full p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar indicacion de instalacion"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
