---
tags: [domain, calculator]
related: ["[[storeCatalog]]", "[[storePageFormatting]]"]
---

# `storePricing.ts`

**Propósito:** el motor de comparación de precios de la tienda: calcula precio unitario efectivo (por litro/botella/unidad), detecta cuál presentación de un producto es "mejor precio", y determina cuánto ahorra el usuario tanto por comprar de a más volumen como por promociones explícitas.

**Exports principales:**

- `PresentationComparison` — resultado completo de comparar una presentación contra sus pares del mismo `comparisonGroup`.
- `getComparisonUnitLabel(unit?)` — `unit?.trim() || "unidad"`.
- `getEffectiveUnitPrice(presentation)` — `unitPrice / comparisonQuantity`; `null` si `comparisonQuantity` o `unitPrice` no son positivos/finitos.
- `getPromotionalSavings(presentation)` — `compareAtPrice - unitPrice` si la presentación es `promotional` y tiene `compareAtPrice` válido; `null` si no aplica o el resultado no es positivo.
- `getBestValuePresentation(presentations)` — la de menor `effectiveUnitPrice` entre las comparables, desempatando por `sortOrder`.
- `buildPresentationComparison(presentation, presentations)` — función central: busca todas las presentaciones del mismo `comparisonGroup`, toma la de menor cantidad como referencia (`reference`), calcula cuánto costaría igualar la cantidad de `presentation` al precio unitario de la referencia (`referenceCost`), y de ahí deriva `savings`/`savingsRate`. Si la presentación no tiene `comparisonGroup`/`comparisonQuantity` válidos pero sí tiene ahorro promocional, devuelve un resultado "solo promocional" (sin datos de comparación de volumen). Si no hay ni lo uno ni lo otro, devuelve `null`.
- `getPresentationSavings(presentation, presentations)` — atajo: `buildPresentationComparison(...).savings` si `hasSavings`, si no `0`.
- `getProductMaxSavings(presentations)` — el máximo entre ahorro por comparación y ahorro promocional, tomando el mayor de todas las presentaciones del producto (usado para ordenar por `"savings-desc"` en [[storeCatalog]]).
- `hasVolumeSavings(presentations)` / `hasPromotion(presentations)` — booleanos usados como filtros (`onlyVolumeSavings`/`onlyPromotions` en `StoreFilters`).

**Reglas de negocio / edge cases:**

- La "referencia" de comparación es siempre la presentación de **menor cantidad** dentro del mismo `comparisonGroup` (ej. la botella individual es la referencia para la caja) — el ahorro se calcula como "cuánto pagarías si compraras esta cantidad al precio unitario de la referencia" menos "lo que realmente pagás", nunca al revés.
- `isBestValue`/`bestValueLabel` se calculan comparando el `effectiveUnitPrice` de **todas** las presentaciones comparables (no solo contra la referencia), así que la de "mejor precio" puede ser una tercera presentación distinta de la referencia y de la que se está evaluando.
- Ahorro promocional (`getPromotionalSavings`) y ahorro por volumen (`savings`/`savingsRate` derivados de `comparisonGroup`) son cálculos completamente independientes — una presentación puede tener ambos, y `buildPresentationComparison` los devuelve por separado (`promotionalSavings` vs `savings`); es [[storePageFormatting]] quien decide cuál mostrar con prioridad.
- Todos los cálculos son defensivos ante datos faltantes/inválidos (`isPositiveFinite` como guard central) — un producto sin `comparisonGroup`/`comparisonQuantity` configurados simplemente no participa en comparación de volumen, sin lanzar errores.

**Dependencias clave:** `ProductPresentation` de `commercialTypes.ts`. Es la base de [[storeCatalog]] (`getProductMaxSavings`/`hasPromotion`/`hasVolumeSavings`) y [[storePageFormatting]] (`buildPresentationComparison`).

**Tests:** `storePricing.test.ts` (si existe) cubre este módulo — dada la cantidad de ramas, es candidato a cobertura alta.
