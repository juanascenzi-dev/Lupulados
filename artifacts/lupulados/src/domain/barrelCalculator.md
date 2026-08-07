---
tags: [domain, calculator]
related: ["[[beerCatalog]]"]
---

# `barrelCalculator.ts`

**Propósito:** dado un requerimiento de litros (y opcionalmente una cerveza puntual), calcula la combinación de barriles (20L/30L/50L) que minimiza el excedente y el precio, para recomendar qué comprar en la calculadora.

**Exports principales:**

- `BarrelRecommendationPart` — `{ size, count, price, presentationId }`, una línea de la recomendación (ej. "2x 30L").
- `BarrelRecommendation` — resultado completo: litros requeridos/cubiertos/excedente, precio total/estimado, cantidad total de barriles, `parts`, `label` legible, y `beerId`.
- `calculateBarrelRecommendation(requiredLiters, beer?, catalog?)` — función principal. `beer` es opcional (si no se pasa, usa el precio mínimo del catálogo por presentación como estimación); `catalog` por defecto es `beerCatalog` de [[beerCatalog]].

**Reglas de negocio / edge cases:**

- Asume **exactamente 3 presentaciones de barril** (`barrelPresentationIds` en [[beerCatalog]]: 20L/30L/50L). El algoritmo fija la cantidad del barril más chico con una fórmula cerrada y hace doble loop sobre los otros dos tamaños (`countA`, `countB`) — agregar un 4° tamaño de barril requeriría un loop adicional (comentado explícitamente en el código).
- `requiredLiters` se redondea hacia arriba (`Math.ceil`) y se clampea a `>= 0`; si el resultado normalizado es `<= 0`, devuelve una recomendación vacía con `label` de tipo "no llegamos a un barril de Xl, mejor pedí packs o growlers".
- Lanza `RangeError` si `requiredLiters` no es un número finito (`NaN`/`Infinity`) — no hace fallback silencioso ahí, a diferencia de otros módulos de `domain`.
- El desempate entre candidatas (`compareRecommendations`) prioriza, en orden: menor excedente → menor precio estimado → menos barriles totales → orden alfabético del label (para determinismo cuando hay empate exacto).
- Si no hay `beer` puntual, `price` de cada `part` usa el precio mínimo de esa presentación entre todo el catálogo (aproximación, no el precio real de un producto).

**Dependencias clave:** `barrelPresentationIds`, `beerCatalog`, tipos `Beer`/`BeerPresentationId` de [[beerCatalog]].

**Tests:** `barrelCalculator.test.ts` (si existe) cubre este módulo.
