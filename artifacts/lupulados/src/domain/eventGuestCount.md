---
tags: [domain, util]
related: ["[[eventDuration]]"]
---

# `eventGuestCount.ts`

**Propósito:** parseo y clamp de la cantidad de invitados de un evento, con límites fijos de sanity check.

**Exports principales:**

- `MIN_EVENT_GUESTS` (1), `MAX_EVENT_GUESTS` (500).
- `parseEventGuestCount(value)` — parsea texto/número a entero seguro; `null` si no matchea `^\d+$` o es menor a `MIN_EVENT_GUESTS`; si es válido pero supera `MAX_EVENT_GUESTS`, lo clampea hacia abajo (a diferencia de rechazarlo).
- `clampEventGuestCount(value)` — clamp directo de un número ya parseado a `[MIN_EVENT_GUESTS, MAX_EVENT_GUESTS]`; `NaN`/no-finito → `MIN_EVENT_GUESTS`.

**Reglas de negocio / edge cases:**

- `parseEventGuestCount` y `clampEventGuestCount` difieren en su tratamiento del piso: `parseEventGuestCount` **rechaza** (`null`) valores por debajo de `MIN_EVENT_GUESTS`, mientras que `clampEventGuestCount` los **sube** a `MIN_EVENT_GUESTS` — el primero es para validar input de texto crudo (se quiere detectar "0 invitados" como error), el segundo para sanear un valor numérico ya en uso (ej. resultado de un cálculo).
- Igual patrón estricto que `parseDurationUnit` de [[eventDuration]]: solo acepta dígitos puros vía regex, sin decimales ni signos.

**Dependencias clave:** ninguna (módulo puro).

**Tests:** `eventGuestCount.test.ts` (si existe) cubre este módulo.
