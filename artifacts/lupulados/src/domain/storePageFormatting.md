# `storePageFormatting.ts`

**Propósito:** formatea porcentajes y el texto de "ahorro" (copy tipo "Ahorrás $X (Y%)") que se muestra en las tarjetas de producto de la tienda, a partir de una comparación de precios ya calculada por [[storePricing]].

**Exports principales:**

- `formatPercent(value)` — redondea a entero y agrega `%`; `"0%"` si `value` no es finito o `<= 0`.
- `getSavingsCopy(comparison)` — dado un `PresentationComparison` (o `null`), arma el texto final: si hay ahorro promocional (`hasPromotionalSavings`), usa ese monto/tasa y el texto es `"Ahorras $X (Y%)"`; si no, usa el ahorro por comparación de volumen (`savings`/`savingsRate`) y, si hay una presentación de referencia, el texto incluye contra qué se comparó (`"Ahorras $X comparado con Barril 20 L"`); si no hay `savings > 0` en ningún caso, devuelve `null` (no se muestra nada).

**Reglas de negocio / edge cases:**

- La promoción explícita (`hasPromotionalSavings`) tiene **prioridad** sobre el ahorro por comparación de volumen — si una presentación tiene ambas, solo se muestra el copy de promoción, no los dos.
- El texto varía según si hay `referencePresentation` disponible: con referencia, es más específico ("comparado con X"); sin ella (caso borde donde `buildPresentationComparison` devolvió savings pero sin referencia — no debería pasar en la práctica dado cómo arma el objeto `storePricing.ts`, pero el código lo contempla), cae al mismo formato genérico que la rama promocional.

**Dependencias clave:** `formatPrice` de [[format]]; `getHumanPresentationLabel` de [[storeCatalog]]; tipo `buildPresentationComparison` (solo como `ReturnType`) de [[storePricing]].

**Tests:** `storePageFormatting.test.ts` (si existe) cubre este módulo.
