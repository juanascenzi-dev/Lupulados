# `promotionDiscount.ts`

**Propósito:** calcula el monto de descuento de una promoción sobre un subtotal, y formatea el valor de una promoción para mostrar en UI/mensajes. Es intencionalmente tolerante a inputs inválidos (a diferencia de [[barrelCalculator]]) porque corre en cada render vía `useCart()` → `calculateOrderSummary`.

**Exports principales:**

- `PromotionValueInput` — `Pick<Promotion, "type" | "value"> | null | undefined`.
- `calculateDiscountAmount(subtotal, promotion)` — `"percentage"` descuenta una fracción del subtotal (`subtotal * value`), `"fixed"` descuenta `value` tal cual en pesos; el resultado siempre se clampea a `[0, subtotal]` para que el total nunca quede negativo. Devuelve `0` si `promotion` es `null`/`undefined`, si `subtotal` no es finito o `<= 0`, o si `promotion.value` no es finito o `<= 0` — nunca lanza.
- `formatPromotionValue(promotion)` — `"percentage"` → `"10%"` (multiplica `value` × 100), `"fixed"` → precio formateado con `formatPrice`. Es la única fuente de verdad de este formato; el código documenta que antes cada consumidor asumía `percentage` y hardcodeaba `${value*100}% OFF`.

**Reglas de negocio / edge cases:**

- El clamp final (`Math.min(Math.max(rawAmount, 0), subtotal)`) es lo que garantiza que un descuento "fixed" más grande que el subtotal no deje el total en negativo (ver fix de "descuento de monto fijo en $0" del commit `589dfc1` — este archivo es el punto donde se resolvió esa clase de bug).
- Nunca lanza ante input inválido: cualquier cosa fuera de rango degrada silenciosamente a "sin descuento" (`0`), documentado explícitamente en el JSDoc del archivo como decisión deliberada (checkout no debe romperse por un dato de promoción corrupto).

**Dependencias clave:** `formatPrice` de [[format]]; `Promotion` de `commercialTypes.ts`.

**Tests:** `promotionDiscount.test.ts` (si existe) cubre este módulo — candidato natural para casos de regresión del fix de descuento fijo.
