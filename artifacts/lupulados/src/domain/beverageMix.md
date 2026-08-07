---
tags: [domain, calculator]
related: ["[[beerConsumptionEstimate]]"]
---

# `beverageMix.ts`

**Propósito:** modela la mezcla de bebidas de un evento cuando el usuario quiere combinar cerveza con otras bebidas (fernet, whisky, vino, gin, vodka, ron, tequila) en vez de solo cerveza. La cerveza nunca se asigna explícitamente: es siempre el remanente (`100 - suma de los demás shares`).

**Exports principales:**

- `NonBeerBeverageType`, `BeverageType` (`"beer" | NonBeerBeverageType`), `BEVERAGE_TYPE_ORDER`, `BEVERAGE_LABELS` — catálogo de tipos de bebida no-cerveza y su orden/etiqueta de UI.
- `BEVERAGE_LITERS_PER_PERSON` — litro/persona de referencia por tipo, calibrado a mano con guías generales de bartending (documentado en el propio código: fernet ~750ml/6-8 personas, vino ~150ml×3 copas, destilados ~50ml×3 tragos, tequila ~35ml, tragos más cortos).
- `BEVERAGE_BOTTLE_SIZE_LITERS` — tamaño de botella genérico por tipo, usado solo para aproximar cantidad de botellas antes de resolver un SKU real.
- `BeverageMixShare` — `{ type, percentage }`.
- `normalizeBeverageMixShares(shares)` — fusiona duplicados por `type`, descarta `<= 0`, y clampea el acumulado a 100 en el orden de aparición del array (si la suma ya cruzada 100, los últimos shares se recortan o se eliminan).
- `updateBeverageMixShare(shares, type, percentage)` — fija el % de `type`, clampeado a lo que quede libre una vez descontado el resto (nunca hace falta validar "que sume 100": el resto no asignado cae en cerveza).
- `getBeerSharePercentage(shares)` / `getNonBeerShareTotal(shares)` — cerveza = `100 - total de shares no-cerveza`.
- `validateBeverageMixShares(shares)` — devuelve mensaje de error en español si hay porcentajes negativos o si la suma normalizada supera 100; `null` si es válido.
- `distributeBeverageMixShares(types)` — reparte 100% equitativamente entre `types` únicos (ej. "quiero de todos un poco"), repartiendo el resto entero (`100 % n`) a los primeros tipos.
- `isDefaultBeverageMix(shares)` — `true` si, normalizado, no queda ningún share (o sea, 100% cerveza implícito).
- `BeverageMixCalculationInput`, `BeverageMixItemEstimate`, `calculateBeverageMixEstimate(input)` — combina esta lógica con [[beerConsumptionEstimate]]: calcula litros de cada bebida (incluida cerveza) según fracción del share, intensidad del evento y ajuste de duración/verano; para no-cerveza también calcula `approxBottles`.

**Reglas de negocio / edge cases:**

- `updateBeverageMixShare` clampea contra el total de **los demás** shares, nunca contra 100 directo — así el share de un tipo no puede "robarle" espacio a otro sin que el caller lo pida explícitamente.
- `estimateNonBeerLiters` escala el litro/persona de cada bebida no-cerveza por el mismo factor de intensidad relativo (`EVENT_INTENSITY_MULTIPLIERS[intensity] / EVENT_INTENSITY_MULTIPLIERS.normal`) que usa la cerveza, no por una tabla independiente por bebida.
- `calculateBeverageMixEstimate` escala también `genderComposition` proporcionalmente a la fracción de cerveza (`scaleGenderComposition`) antes de llamar a `estimateBeerLiters`, para que la composición de género siga siendo consistente aun cuando la cerveza es solo una porción del evento.
- El resultado final se ordena según `BEVERAGE_TYPE_ORDER` (orden fijo de UI), no según el orden en que llegaron los `shares`.

**Dependencias clave:** `EVENT_INTENSITY_MULTIPLIERS`, `GENDER_LITERS_MULTIPLIER`, `applyDurationAndSummerAdjustment`, `estimateBeerLiters` de [[beerConsumptionEstimate]]; `ProductCategory` de `commercialTypes.ts`.

**Tests:** `beverageMix.test.ts` (si existe) cubre este módulo.
