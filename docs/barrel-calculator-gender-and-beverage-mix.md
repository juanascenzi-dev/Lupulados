# Desglose por género y mezcla de bebidas en la Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Quinta pasada sobre la calculadora, después de la de solidez técnica (`docs/barrel-calculator-hardening.md`), la de precisión de precio (`docs/barrel-calculator-price-accuracy.md`), la de calibración de consumo (`docs/barrel-calculator-consumption-calibration.md`) y la de litros por persona personalizables (`docs/barrel-calculator-custom-liters-per-person.md`). Este cambio tampoco toca la calibración de intensidad: agrega dos formas nuevas de segmentar el consumo, ambas opcionales y con el comportamiento por defecto intacto.

## El pedido

Que la calculadora sea "adaptable" a la composición real del evento: poder decir "somos 3 hombres y 6 mujeres" y que el consumo estimado refleje esa proporción, y poder decir "vamos a tomar tal % de cerveza y tal de fernet/whisky/etc." en vez de asumir 100% cerveza.

## Decisiones de diseño (ya validadas con el usuario antes de implementar)

- **Género**: multiplicador relativo fijo (hombres +15%, mujeres -15% sobre el litro/persona base del evento), no campos de litros/persona editables libremente por género — mantiene todo calibrado contra el mismo estándar que ya existe para intensidad.
- **Mezcla de bebidas**: estimación simple. Sin integrar el catálogo comercial real ni precios reales para bebidas no-cerveza en esta iteración — solo litros estimados + una aproximación de cantidad de botellas con un tamaño de botella genérico. Cerveza sigue siendo la única bebida con catálogo/precio/barriles reales.
- El multiplicador de género se aplica de forma **uniforme** a todas las bebidas de la mezcla, no solo a cerveza, para no mantener una segunda tabla de ajuste por bebida.
- Los porcentajes de la mezcla representan **"% de invitados cuya bebida principal es X"**, no "% del volumen total" — evita el resultado físicamente absurdo de repartir litros-equivalente-de-cerveza proporcionalmente entre bebidas con tasas de consumo muy distintas (una persona no toma la misma cantidad de whisky que de cerveza).
- Modelo de porcentajes "cerveza absorbe el resto": a diferencia del patrón de `configurableBeerPack.ts` (redistribución libre entre N slots), acá cerveza es la bebida por defecto implícita — nunca hace falta validar "que sume 100" en la UI, lo no asignado explícitamente a otra bebida queda en cerveza.
- Ambas features son opt-in con el mismo patrón de revelado progresivo que ya usa la card de "Litros por persona": colapsadas por defecto, comportamiento idéntico al actual hasta que el usuario las activa.

## Cambios

### `src/domain/beerConsumptionEstimate.ts`

- Se extrajo el ajuste de duración/verano (antes inline en `estimateBeerLiters`) a un helper exportado `applyDurationAndSummerAdjustment(baseLiters, totalHoursDecimal, isSummer)`, extracción literal sin cambiar la matemática, para reutilizarlo en el nuevo módulo de mezcla.
- Nuevo `GENDER_LITERS_MULTIPLIER = { men: 1.15, women: 0.85 }` y tipo `GenderComposition { men, women }`.
- `BeerConsumptionEstimateInput` gana `genderComposition?: GenderComposition`. Cuando está presente, `estimateBeerLiters` reemplaza `guests * base` por `men*base*1.15 + women*base*0.85`; el resto (duración, verano, `Math.ceil`) queda igual. Sin `genderComposition`, el resultado es idéntico al de antes.

### `src/domain/beverageMix.ts` (nuevo)

Módulo de dominio para la mezcla de bebidas, catálogo-agnóstico (no toca precios/SKUs reales):

- `NonBeerBeverageType` = subconjunto alcohólico de `ProductCategory` (fernet, whisky, wine, gin, vodka, rum, tequila), importado solo como tipo.
- `BEVERAGE_LITERS_PER_PERSON` y `BEVERAGE_BOTTLE_SIZE_LITERS`: tablas placeholder marcadas explícitamente como estimaciones a ojo, pendientes de una calibración como la que tuvo la cerveza en su momento.
- `normalizeBeverageMixShares` / `updateBeverageMixShare` / `getBeerSharePercentage` / `isDefaultBeverageMix`: manejo de la lista de shares con el modelo "cerveza absorbe el resto" (clamp al remanente, nunca supera 100).
- `calculateBeverageMixEstimate`: para cerveza delega en `estimateBeerLiters` escalando `guests`/`genderComposition` por la fracción de cerveza (garantiza que el caso por defecto da un número idéntico a llamar `estimateBeerLiters` directo); para cada bebida no-cerveza usa su litro/persona propio y el mismo helper de duración/verano, y calcula `approxBottles = Math.ceil(liters / tamaño de botella)`.

### `src/components/Calculadora.tsx`

- **Card "Invitados"**: nuevo toggle "Personalizar por género" (mismo lenguaje visual que "Personalizar" de litros/persona). Colapsado: stepper único de siempre. Expandido: dos steppers "Hombres"/"Mujeres" con readout de total; al activar se reparte el valor actual de invitados a la mitad, al desactivar se sincroniza `guests` con la suma.
- **Nueva card "Mezcla de bebidas"**, después de la de estilo de cerveza. Colapsada: "100% cerveza (comportamiento estándar)" + botón "Personalizar mezcla". Expandida: badge de solo lectura con el % de cerveza restante, chips para activar fernet/whisky/vino/gin/vodka/ron/tequila, slider de porcentaje por bebida activa (clamp incorporado en `updateBeverageMixShare`, sin validación manual de "debe sumar 100"), botón "Volver a solo cerveza".
- **Panel de resultado**: si la mezcla es la default (100% cerveza), el markup es exactamente el de siempre. Si no, se reemplaza por una lista de desglose por bebida — cerveza con litros + plan de barriles + precio real (igual que hoy), el resto con litros + cantidad aproximada de botellas. El botón "Usar esta recomendación" sigue atado solo al barril de cerveza; cuando la cerveza queda en 0% de la mezcla, el guard existente `barrelPlan.parts.length === 0` ya lo deshabilita solo (`calculateBarrelRecommendation(0, ...)` devuelve `parts: []`), sin lógica nueva — se agregó solo una leyenda explicando por qué.

### Tests

- `src/domain/beerConsumptionEstimate.test.ts`: 7 casos nuevos para `genderComposition` (solo hombres, solo mujeres, mixto, combinado con duración/verano/override, y que `guests` se ignora cuando hay `genderComposition`) + un bloque nuevo para `applyDurationAndSummerAdjustment` (5 casos).
- `src/domain/beverageMix.test.ts` (nuevo, 17 casos): normalización de shares, clamp de `updateBeverageMixShare`, `getBeerSharePercentage`/`isDefaultBeverageMix`, regresión contra `estimateBeerLiters` directo con shares vacíos, caso 70/30 cerveza/fernet con números exactos, consistencia del ajuste duración/verano entre fila cerveza y no-cerveza, propagación de género a bebidas no-cerveza, cálculo de `approxBottles`, y el caso límite de 100% en una sola bebida no-cerveza.

Los 320 tests del proyecto (`npm test`) pasan. Se verificó manualmente en navegador (Playwright headless contra `npm run serve`): modo simple sin cambios visuales, activación de género con recálculo correcto, y mezcla cerveza/fernet/whisky mostrando el desglose y manteniendo "Usar esta recomendación" funcional.

## Archivos tocados

- `src/domain/beerConsumptionEstimate.ts` — helper `applyDurationAndSummerAdjustment` extraído, soporte de `genderComposition`
- `src/domain/beverageMix.ts` — nuevo módulo de mezcla de bebidas
- `src/components/Calculadora.tsx` — toggle de género en Invitados, card de mezcla de bebidas, panel de resultado con desglose
- `src/domain/beerConsumptionEstimate.test.ts` — nuevos casos de género y del helper extraído
- `src/domain/beverageMix.test.ts` — nuevo archivo de tests
