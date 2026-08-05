# `pwaInstall.ts`

**Propósito:** lógica de estado del prompt de instalación de la PWA: detecta si ya corre en modo standalone, si el dispositivo es iOS (que no soporta el evento `beforeinstallprompt` nativo y necesita un hint manual), cuándo compactar el prompt al hacer scroll, y persistencia de "el usuario ya descartó el hint de iOS".

**Exports principales:**

- `IOS_INSTALL_DISMISSED_KEY`, `INSTALL_INITIAL_EXPANDED_MS` (5000), `INSTALL_SCROLL_COMPACT_THRESHOLD_PX` (12).
- `InstallUiState` — union de los estados visuales posibles (`none`, `expanded`, `compact`, `mobile-explanation`, `prompting`, `ios-hint`).
- `IosDeviceInput`, `InstallUiStateInput` — inputs de detección.
- `isStandaloneDisplayMode(displayModeStandalone, navigatorStandalone?)` — `true` si el media query CSS `display-mode: standalone` matchea, o si `navigator.standalone` (API legada de iOS Safari) es `true`.
- `isIosDevice(input)` — detecta iPhone/iPad/iPod por user agent, o Mac con soporte táctil multi-touch (`platform === "macintel" && maxTouchPoints > 1`, el caso de iPads que reportan como Mac desde iPadOS 13).
- `shouldCompactInstallPrompt(initialScrollY, currentScrollY)` — `true` si el usuario se movió más de `INSTALL_SCROLL_COMPACT_THRESHOLD_PX` desde el scroll inicial.
- `getInstallUiState(input)` — máquina de estados: `installed` → `"none"`; `prompting` → `"prompting"`; si `installAvailable` (evento nativo disponible), decide entre `"mobile-explanation"`/`"expanded"`/`"compact"` según si está compactado o el usuario expandió manualmente; si no hay prompt nativo pero `iosHintAvailable`, `"ios-hint"`; si no, `"none"`.
- `hasStoredIosInstallDismissal(storage)` / `storeIosInstallDismissal(storage)` — leer/escribir el dismissal en `localStorage`, con `try/catch` silencioso (mismo patrón defensivo que [[cartStorage]]).

**Reglas de negocio / edge cases:**

- `getInstallUiState` prioriza `installed` y `prompting` por encima de todo lo demás — aunque el usuario haya expandido manualmente o esté en modo iOS-hint, si ya está instalado o hay un prompt nativo en curso, esos estados ganan.
- La detección de iPad como Mac (`macintel` + `maxTouchPoints > 1`) es un workaround conocido de la industria para iPadOS, no una heurística inventada acá — necesaria porque Apple decidió que iPadOS reporte el mismo `platform` que macOS desde la v13.
- `storeIosInstallDismissal` nunca lanza: si falla el storage, el dismissal solo dura la sesión actual en memoria (comentario explícito en el código: "best-effort").

**Dependencias clave:** ninguna externa (módulo puro sobre inputs que el caller extrae del browser).

**Tests:** `pwaInstall.test.ts` (si existe) cubre este módulo.
