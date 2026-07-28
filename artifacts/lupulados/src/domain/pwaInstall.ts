export const IOS_INSTALL_DISMISSED_KEY = "lupulados-ios-install-dismissed";
export const INSTALL_INITIAL_EXPANDED_MS = 5000;
export const INSTALL_SCROLL_COMPACT_THRESHOLD_PX = 12;

export type InstallUiState =
  | "none"
  | "expanded"
  | "compact"
  | "mobile-explanation"
  | "prompting"
  | "ios-hint";

export interface IosDeviceInput {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
}

export interface InstallUiStateInput {
  installed: boolean;
  installAvailable: boolean;
  iosHintAvailable: boolean;
  compacted: boolean;
  interactionExpanded: boolean;
  mobileExplanationOpen: boolean;
  prompting: boolean;
}

export function isStandaloneDisplayMode(displayModeStandalone: boolean, navigatorStandalone?: boolean) {
  return displayModeStandalone || navigatorStandalone === true;
}

export function isIosDevice(input: IosDeviceInput) {
  const userAgent = input.userAgent.toLowerCase();
  const platform = input.platform.toLowerCase();

  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform === "macintel" && input.maxTouchPoints > 1)
  );
}

export function shouldCompactInstallPrompt(initialScrollY: number, currentScrollY: number) {
  return Math.abs(currentScrollY - initialScrollY) >= INSTALL_SCROLL_COMPACT_THRESHOLD_PX;
}

export function getInstallUiState(input: InstallUiStateInput): InstallUiState {
  if (input.installed) return "none";
  if (input.prompting) return "prompting";

  if (input.installAvailable) {
    if (input.mobileExplanationOpen) return "mobile-explanation";
    if (!input.compacted || input.interactionExpanded) return "expanded";
    return "compact";
  }

  if (input.iosHintAvailable) return "ios-hint";

  return "none";
}

export function hasStoredIosInstallDismissal(storage: Pick<Storage, "getItem">) {
  try {
    return storage.getItem(IOS_INSTALL_DISMISSED_KEY) === "true";
  } catch {
    return false;
  }
}

export function storeIosInstallDismissal(storage: Pick<Storage, "setItem">) {
  try {
    storage.setItem(IOS_INSTALL_DISMISSED_KEY, "true");
  } catch {
    // Dismissal is best-effort; UI can still close for the current session.
  }
}
