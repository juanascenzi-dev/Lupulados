# `activationGuard.ts`

**Propósito:** decide si una acción "activable" (ej. un botón de instalar PWA, un prompt reintentable) puede dispararse de nuevo o si todavía está dentro de su período de enfriamiento (cooldown).

**Exports principales:**

- `GuardedActivationState` — `{ allowed, lastActivatedAt }`, el resultado de evaluar el guard.
- `getGuardedActivationState(lastActivatedAt, now, intervalMs)` — devuelve `allowed: true` y actualiza `lastActivatedAt` a `now` si pasó `intervalMs` desde la última activación (o si nunca se activó, `lastActivatedAt <= 0`); si no, devuelve `allowed: false` sin tocar `lastActivatedAt`.

**Reglas de negocio / edge cases:**

- Si `now`, `lastActivatedAt` o `intervalMs` no son números finitos (`NaN`, `Infinity`), devuelve `allowed: false` como fallback seguro en vez de lanzar.
- `lastActivatedAt <= 0` o `intervalMs <= 0` se tratan como "sin guard activo" → siempre permite.
- No tiene efectos secundarios ni guarda estado propio: el caller es responsable de persistir `lastActivatedAt` (ej. en localStorage) entre llamadas.

**Dependencias clave:** ninguna (módulo puro, sin imports).

**Tests:** no existe `activationGuard.test.ts` en el momento de este doc.
