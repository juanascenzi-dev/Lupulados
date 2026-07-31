# Solidez técnica: Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Este cambio no toca UX, precio ni features nuevas: es una pasada de deuda técnica sobre `src/components/Calculadora.tsx` y `src/domain/barrelCalculator.ts` (paquete `artifacts/lupulados`).

## 1. Fórmula de litros movida al dominio

**Antes:** la estimación de litros (invitados × multiplicador de intensidad, ajustado por duración y por verano) vivía hardcodeada dentro de un `useEffect` en `Calculadora.tsx`, duplicando el diccionario de multiplicadores que ya existía en `EVENT_TYPES` para la UI. No tenía tests.

**Ahora:** `src/domain/beerConsumptionEstimate.ts` expone `estimateBeerLiters({ guests, intensity, totalHoursDecimal, isSummer })`, pura y testeada (`beerConsumptionEstimate.test.ts`), con `EVENT_INTENSITY_MULTIPLIERS` como única fuente de verdad para los multiplicadores por tipo de evento. `Calculadora.tsx` importa esa función y el tipo `EventIntensity`; `EVENT_TYPES` ya no lleva un `multiplier` propio. Sigue la misma convención del resto del dominio (`eventDuration.ts`, `barrelCalculator.ts`): lógica pura co-ubicada con su test.

## 2. Inputs numéricos ya no rompen con NaN

**Antes:** los `<input type="number">` de invitados/horas/minutos llamaban `Number(e.target.value)` directo. Un valor no numérico o parcial podía producir `NaN`, que se propagaba a `calculateBarrelRecommendation(NaN)` — la cual lanza `RangeError`, capaz de romper el render mientras el usuario edita el campo.

**Ahora:** `parseNumericInput(raw)` en `Calculadora.tsx` devuelve `null` si el string está vacío o no representa un número finito. Los tres inputs de texto usan wrappers (`handleGuestsInputChange`, `handleHoursInputChange`, `handleMinutesInputChange`) que sólo aplican el clamp existente cuando el valor es válido — así el usuario puede borrar el campo momentáneamente sin que salte a un mínimo ni dispare un NaN. Los botones `+/-`, el slider y los chips de duración no cambiaron: siguen usando los handlers numéricos originales, que siempre reciben valores válidos.

## 3. Algoritmo de recomendación de barriles: O(n³) → O(n²)

**Antes:** `calculateBarrelRecommendation` probaba por fuerza bruta todas las combinaciones de conteos de los 3 tamaños de barril (`b20 × b30 × b50`, cada uno hasta `~maxCount`), recalculado en cada cambio de input. Para el caso extremo (500 invitados, festival + verano) eran ~474.000 iteraciones.

**Optimización aplicada:** para un par fijo de conteos de los "otros" dos tamaños, los litros cubiertos crecen estrictamente con la cantidad del barril más chico (tamaño > 0). Como `compareRecommendations` ordena primero por excedente (`excessLiters`) de forma ascendente, y el excedente también crece estrictamente con esa cantidad, ningún conteo mayor al mínimo necesario para cubrir el requerimiento puede ganar la comparación — sin importar precio ni cantidad total de barriles. Eso permite reemplazar el loop del barril más chico por una fórmula cerrada (`Math.ceil(remaining / minimumBarrelSize)`), bajando de O(n³) a O(n²) (~6.000 iteraciones en el mismo caso extremo) **sin cambiar el resultado óptimo**: es la misma solución, sólo se dejan de evaluar candidatos matemáticamente dominados.

La suite existente (`barrelCalculator.test.ts`, que mantiene su propio fuerza-bruta de referencia independiente, y `orderFlow.test.ts`) no necesitó modificarse — sirvió como red de regresión para validar que el resultado es idéntico.

Limitación documentada en el código: el enfoque asume exactamente 3 presentaciones de barril (2 loops + 1 fórmula cerrada). Si el catálogo agregara un 4° tamaño, haría falta un loop adicional.

## 4. Tamaño mínimo de barril derivado del catálogo

**Antes:** el `20` (tamaño del barril más chico) estaba hardcodeado en dos lugares de `barrelCalculator.ts`: el mensaje de `emptyRecommendation` y el `Math.max(20, normalizedRequired)`.

**Ahora:** `minimumBarrelSize` se deriva de `barrelOptions` (`Math.min` de los tamaños reales del catálogo, identificando el índice sin asumir el orden del array). Si el catálogo cambiara su barril más chico, el mensaje y el umbral se actualizan solos.

## Archivos tocados

- `src/domain/barrelCalculator.ts` — optimización del algoritmo + tamaño mínimo derivado
- `src/domain/beerConsumptionEstimate.ts` (nuevo) — fórmula de litros extraída
- `src/domain/beerConsumptionEstimate.test.ts` (nuevo)
- `src/components/Calculadora.tsx` — consume el dominio, arregla NaN en inputs
