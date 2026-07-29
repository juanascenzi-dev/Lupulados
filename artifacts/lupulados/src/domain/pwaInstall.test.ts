import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  INSTALL_INITIAL_EXPANDED_MS,
  IOS_INSTALL_DISMISSED_KEY,
  getInstallUiState,
  hasStoredIosInstallDismissal,
  isIosDevice,
  isStandaloneDisplayMode,
  shouldCompactInstallPrompt,
  storeIosInstallDismissal,
} from "./pwaInstall";

const pwaInstallSource = readFileSync(new URL("../components/PwaInstall.tsx", import.meta.url), "utf8");

describe("PWA install UI state", () => {
  it("does not render when no install path is available", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: false,
      iosHintAvailable: false,
      compacted: false,
      interactionExpanded: false,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("none");
  });

  it("starts expanded when beforeinstallprompt is available", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: false,
      compacted: false,
      interactionExpanded: false,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("expanded");
  });

  it("uses the compact state after the initial window", () => {
    expect(INSTALL_INITIAL_EXPANDED_MS).toBe(5000);
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: false,
      compacted: true,
      interactionExpanded: false,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("compact");
  });

  it("compacts after significant scroll only", () => {
    expect(shouldCompactInstallPrompt(100, 106)).toBe(false);
    expect(shouldCompactInstallPrompt(100, 112)).toBe(true);
    expect(shouldCompactInstallPrompt(100, 87)).toBe(true);
  });

  it("expands compact desktop affordances while hovered or focused", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: false,
      compacted: true,
      interactionExpanded: true,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("expanded");
  });

  it("opens the mobile explanation without hiding the native install action", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: false,
      compacted: true,
      interactionExpanded: false,
      mobileExplanationOpen: true,
      prompting: false,
    })).toBe("mobile-explanation");
  });

  it("shows prompting as an explicit in-progress state", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: false,
      compacted: true,
      interactionExpanded: false,
      mobileExplanationOpen: true,
      prompting: true,
    })).toBe("prompting");
  });

  it("hides every install surface after appinstalled or standalone", () => {
    expect(isStandaloneDisplayMode(true, false)).toBe(true);
    expect(isStandaloneDisplayMode(false, true)).toBe(true);
    expect(getInstallUiState({
      installed: true,
      installAvailable: true,
      iosHintAvailable: true,
      compacted: false,
      interactionExpanded: true,
      mobileExplanationOpen: true,
      prompting: true,
    })).toBe("none");
  });

  it("supports iOS and iPadOS hints without native prompt", () => {
    expect(isIosDevice({ userAgent: "Mozilla/5.0 (iPhone)", platform: "iphone", maxTouchPoints: 1 })).toBe(true);
    expect(isIosDevice({ userAgent: "Mozilla/5.0", platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
    expect(getInstallUiState({
      installed: false,
      installAvailable: false,
      iosHintAvailable: true,
      compacted: false,
      interactionExpanded: false,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("ios-hint");
  });

  it("prioritizes normal install over iOS hint so both are not visible", () => {
    expect(getInstallUiState({
      installed: false,
      installAvailable: true,
      iosHintAvailable: true,
      compacted: false,
      interactionExpanded: false,
      mobileExplanationOpen: false,
      prompting: false,
    })).toBe("expanded");
  });

  it("stores iOS dismissals best-effort", () => {
    const storage = { getItem: vi.fn(() => "true"), setItem: vi.fn() };

    expect(hasStoredIosInstallDismissal(storage)).toBe(true);
    storeIosInstallDismissal(storage);
    expect(storage.setItem).toHaveBeenCalledWith(IOS_INSTALL_DISMISSED_KEY, "true");
  });
});

describe("PwaInstall component wiring", () => {
  it("cleans initial timers and scroll listeners", () => {
    expect(pwaInstallSource).toContain("window.setTimeout");
    expect(pwaInstallSource).toContain("window.clearTimeout(timerId)");
    expect(pwaInstallSource).toContain('window.addEventListener("scroll", handleScroll, { passive: true })');
    expect(pwaInstallSource).toContain('window.removeEventListener("scroll", handleScroll)');
  });

  it("handles install lifecycle events without console errors", () => {
    expect(pwaInstallSource).toContain('window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)');
    expect(pwaInstallSource).toContain('window.addEventListener("appinstalled", handleAppInstalled)');
    expect(pwaInstallSource).toContain('window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)');
    expect(pwaInstallSource).toContain('window.removeEventListener("appinstalled", handleAppInstalled)');
    expect(pwaInstallSource).toContain("clearNativePrompt");
    expect(pwaInstallSource).not.toContain("console.error");
    expect(pwaInstallSource).not.toContain("console.log");
  });

  it("keeps desktop and mobile install affordances accessible", () => {
    expect(pwaInstallSource).toContain('aria-label="Instalar Lupulados"');
    expect(pwaInstallSource).toContain("onMouseEnter");
    expect(pwaInstallSource).toContain("onFocus");
    expect(pwaInstallSource).toContain("usesCoarsePointer()");
    expect(pwaInstallSource).toContain("Cerrar explicacion de instalacion");
  });
});
