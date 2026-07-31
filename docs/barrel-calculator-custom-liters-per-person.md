# Litros por persona personalizables en la Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Cuarta pasada sobre la calculadora, después de la de solidez técnica (`docs/barrel-calculator-hardening.md`), la de precisión de precio (`docs/barrel-calculator-price-accuracy.md`) y la de calibración de consumo (`docs/barrel-calculator-consumption-calibration.md`). Este cambio no toca la calibración recién hecha: agrega la posibilidad de pisarla manualmente para casos puntuales.

## El pedido

Dejar que quien usa la calculadora ajuste la cantidad de litros por persona, con un punto estándar predeterminado (el multiplicador calibrado de la intensidad elegida).

## Decisión de diseño

Se evaluaron tres formas de integrarlo con el selector de intensidad existente (tranqui/normal/intensa/festival, cada uno con su litro/persona fijo en `EVENT_INTENSITY_MULTIPLIERS`):

1. Campo avanzado opcional, colapsado por defecto, precargado con el valor de la intensidad elegida — **elegida**.
2. Reemplazar el selector de intensidad por un slider numérico único.
3. Selector de intensidad con un 5to estado "Personalizado".

Se descartaron las opciones 2 y 3: quitar o mutar el selector de intensidad tira el trabajo de calibración contra benchmarks reales que se acaba de hacer, y deja como única fuente de verdad un número que la mayoría de los usuarios no tiene forma de estimar sin ayuda. La opción 1 mantiene el comportamiento por defecto intacto (el selector de intensidad calibrado sigue siendo la fuente) y solo agrega una salida de emergencia para quien conoce el consumo real de su evento.

## Cambios

### `src/domain/beerConsumptionEstimate.ts`
`BeerConsumptionEstimateInput` gana un campo opcional `litersPerPerson?: number`. En `estimateBeerLiters`, la base del cálculo pasa a ser `litersPerPerson ?? EVENT_INTENSITY_MULTIPLIERS[intensity]`; el ajuste por duración y el factor de verano se siguen aplicando igual sobre esa base, sin cambios.

### `src/components/Calculadora.tsx`
- Nueva card colapsable "Litros por persona", ubicada entre "Estilo de fiesta" y el toggle de verano.
- Colapsada: muestra el valor efectivo (estándar de la intensidad elegida) y un botón "Personalizar".
- Expandida (estado `showLitersOverride` + `customLitersPerPerson`): input numérico + slider, clamp 0.2–3.0 L, paso 0.1, reusando el patrón de clamp-on-blur ya usado para invitados/horas/minutos (`parseNumericInput` + handlers `onChange`/`onBlur` separados para no romper la escritura dígito por dígito). Botón "Restablecer al estándar" que vuelve a `null` y colapsa.
- Mientras `customLitersPerPerson` es `null`, el cálculo usa el multiplicador de la intensidad activa — cero cambio de comportamiento por defecto. Una vez que el usuario edita el valor, éste se mantiene aunque cambie de intensidad, hasta que lo restablezca.

### `src/domain/beerConsumptionEstimate.test.ts`
Se agregaron 3 casos: `litersPerPerson` pisa el multiplicador de intensidad; se sigue combinando con duración y verano; sin `litersPerPerson` el comportamiento no cambia.

## Archivos tocados

- `src/domain/beerConsumptionEstimate.ts` — nuevo parámetro opcional `litersPerPerson`
- `src/components/Calculadora.tsx` — card colapsable de override + wiring al cálculo
- `src/domain/beerConsumptionEstimate.test.ts` — nuevos casos de test
