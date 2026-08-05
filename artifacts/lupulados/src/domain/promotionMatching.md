# `promotionMatching.ts`

**Propósito:** única fuente de verdad para normalizar y comparar códigos promocionales ingresados por el usuario contra la promoción activa vigente. El código documenta que esta lógica estaba antes duplicada (con reglas ligeramente distintas) entre el wizard y el checkout de la tienda — este archivo la unificó (ver fix de "matcheo de código promocional" del commit `589dfc1`).

**Exports principales:**

- `normalizePromoCode(value)` — `value.trim().toUpperCase()`.
- `matchesPromotionCode(promotion, rawInput)` — compara `normalizePromoCode(rawInput)` contra `normalizePromoCode(promotion.code)`; `false` si `promotion` es `null`/`undefined` o no tiene `code`.
- `resolveAppliedPromotion(rawInput, snapshot?)` — obtiene la promoción activa vigente hoy (`getActivePromotion` de [[commercialSelectors]], que ya respeta `startDate`/`endDate`) y la devuelve solo si `matchesPromotionCode` da `true`; si no, `null`.

**Reglas de negocio / edge cases:**

- Solo existe **una** promoción "aplicable" a la vez: `resolveAppliedPromotion` no busca entre todas las promociones activas, solo compara contra la que devuelve `getActivePromotion` (la primera activa vigente del snapshot) — si hubiera múltiples promociones activas simultáneas, esta función solo puede matchear la primera.
- La normalización (trim + uppercase) es simétrica en ambos lados de la comparación (input del usuario y `promotion.code` guardado) — es indiferente si el código se guardó en mayúsculas o minúsculas en la fuente de datos.
- Este módulo reemplaza cualquier comparación manual de código promocional que pudiera existir en componentes — cualquier flujo nuevo que necesite validar un código debería usar `resolveAppliedPromotion` o `matchesPromotionCode`, no reimplementar la comparación.

**Dependencias clave:** `commercialSnapshot` de [[commercialData]] (default); `getActivePromotion` de [[commercialSelectors]]; tipos de `commercialTypes.ts`.

**Tests:** `promotionMatching.test.ts` (si existe) cubre este módulo — junto con [[promotionDiscount]], es el núcleo del fix reciente de promociones.
