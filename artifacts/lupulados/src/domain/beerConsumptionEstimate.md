---
tags: [domain, calculator]
related: ["[[beverageMix]]"]
---

# `beerConsumptionEstimate.ts`

**Propósito:** estima cuántos litros de cerveza va a consumir un evento en base a cantidad de invitados (o composición por género), intensidad del evento, duración y si es en verano. Es la fórmula base que reutiliza [[beverageMix]] para escalar también las bebidas no-cerveza.

**Exports principales:**

- `EventIntensity` — `"tranqui" | "normal" | "intensa" | "festival"`.
- `EVENT_INTENSITY_MULTIPLIERS` — litros/persona base por intensidad (0.5 a 1.8).
- `GENDER_LITERS_MULTIPLIER` — ajuste relativo por género (`men: 1.15`, `women: 0.85`) sobre el litro/persona base, cuando se usa composición por género en vez de `guests` plano.
- `GenderComposition` — `{ men, women }` (cantidad de personas, no porcentaje).
- `BeerConsumptionEstimateInput` — input de `estimateBeerLiters`; `genderComposition`, si está presente, **reemplaza** `guests` (no se usan ambos).
- `applyDurationAndSummerAdjustment(baseLiters, totalHoursDecimal, isSummer)` — ajusta ±15% por cada hora de diferencia respecto de una duración de referencia de 4hs, y +25% adicional si `isSummer`.
- `estimateBeerLiters(input)` — combina litros base (por `litersPerPerson` override o por `intensity`) × `guests` (o composición por género) y le aplica el ajuste de duración/verano, redondeando hacia arriba.

**Reglas de negocio / edge cases:**

- Cuando se pasa `genderComposition`, `guests` se ignora completamente — el cálculo pondera `men`/`women` por separado con `GENDER_LITERS_MULTIPLIER`.
- El ajuste de duración es lineal y simétrico alrededor de 4hs (+15%/hora arriba, -15%/hora abajo), sin piso — un evento muy corto puede reducir el litraje agresivamente (no hay clamp a un mínimo positivo acá; el `Math.ceil` final evita 0 solo si `rawLiters` ya es > 0).
- `litersPerPerson` (override manual) tiene prioridad sobre el multiplicador de `intensity`.

**Dependencias clave:** ninguna externa (módulo base reutilizado por [[beverageMix]]).

**Tests:** `beerConsumptionEstimate.test.ts` (si existe) cubre este módulo.
