# `eventDuration.ts`

**Propósito:** parseo, normalización y formateo de la duración de un evento (días/horas/minutos) para el wizard de pedido, incluyendo la conversión a horas decimales que consume [[beerConsumptionEstimate]].

**Exports principales:**

- `EventDurationParts` — `{ days, hours, minutes }`.
- `MIN_EVENT_DURATION_MINUTES` (0), `MAX_EVENT_DURATION_MINUTES` (20160 = 14 días).
- `parseDurationUnit(value)` — parsea un input de texto/número a entero no-negativo seguro (`Number.isSafeInteger`), o `null` si no matchea `^\d+$` (rechaza decimales, negativos, notación científica, etc.). Pensado para validar un campo de input individual (ej. el campo "horas" del picker).
- `normalizeDurationMinutes(totalMinutes)` — clampea a `[0, MAX_EVENT_DURATION_MINUTES]`, truncando decimales; `NaN`/negativos → 0.
- `durationPartsFromMinutes(totalMinutes)` — descompone minutos totales normalizados en días/horas/minutos.
- `durationMinutesFromInputs(hours, minutes)` — arma minutos totales normalizados a partir de horas+minutos sueltos (cada uno saneado independientemente antes de sumar).
- `formatDuration(totalMinutes)` / `formatDurationLabel(totalMinutes)` — texto en español ("2 horas y 30 minutos", con manejo de singular/plural); `formatDurationLabel` antepone `"= "` para mostrar como resultado de un cálculo.
- `durationToHoursDecimal(totalMinutes)` — minutos normalizados / 60, el input que espera `estimateBeerLiters` de [[beerConsumptionEstimate]].
- `validateEventDuration(totalMinutes)` — mensaje de error en español si la duración es inválida o si normaliza a 0 (una duración de evento debe ser > 0 para calcular consumo).

**Reglas de negocio / edge cases:**

- `parseDurationUnit` es intencionalmente más estricto que `normalizeDurationMinutes`: rechaza (`null`) cualquier string que no sea solo dígitos, en vez de intentar parsear parcialmente — usado para inputs de formulario donde se quiere feedback de "valor inválido" en vez de un fallback silencioso a 0.
- `MAX_EVENT_DURATION_MINUTES` = 14 días es un límite arbitrario de sanity check, no una regla de negocio real sobre cuánto puede durar un evento.
- `formatDuration` con `totalMinutes` que normaliza a 0 devuelve el string literal `"0 minutos"` (no una lista vacía ni `""`).

**Dependencias clave:** ninguna (módulo puro).

**Tests:** `eventDuration.test.ts` (si existe) cubre este módulo.
