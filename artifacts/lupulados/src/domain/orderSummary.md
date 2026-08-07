---
tags: [domain, calculator]
related:
  [
    "[[businessConfig]]",
    "[[commercialAdapters]]",
    "[[commercialData]]",
    "[[configurableBeerPack]]",
    "[[promotionDiscount]]",
    "[[promotionMatching]]",
  ]
---

# `orderSummary.ts`

**Propósito:** el cálculo final del pedido: dado el carrito y los "extras" del checkout (chopera, hielo, vasos, entrega, código promocional), arma el desglose completo (subtotal, líneas de extras, costo de entrega, descuento, total) que se muestra en el resumen y se manda por WhatsApp.

**Exports principales:**

- `OrderSummaryItem` — shape de línea de pedido (superset de campos de `StoredCartItem`, usado como input desacoplado del storage).
- `OrderSummaryExtras` — `{ chopera, delivery, hielo, vasos, promoCode, discount, discountType? }`; `discount` es fracción (0-1) si `discountType === "percentage"`, o monto en pesos si `"fixed"`.
- `OrderExtraLine`, `OrderSummary` — shapes del resultado.
- `calculateOrderSummary(items, extras, snapshot?)` — función principal.

**Reglas de negocio / edge cases:**

- `totalLiters`: para packs configurables (`item.pack?.type === "configurable-beer-pack"`) asume **0.5L por unidad** (`capacity * 0.5`, ya que son porrones de 500ml) en vez de resolver el volumen real de la presentación — es una aproximación hardcodeada, no viene de `getCartItemLitersFromSnapshot`.
- La chopera **no se cobra** si el pedido ya incluye un barril de 50L (`has50L`) — se asume que ese tamaño de barril viene con chopera incluida.
- Los vasos son gratis (`vasosCost = 0`) si `itemsSubtotal` supera `additionalCosts.freeGlassesThreshold` (umbral configurable del snapshot) — pero la línea de vasos solo se agrega al desglose si además `extras.vasos > 0`.
- `delivery` se resuelve primero con `getDeliveryOptionFromSnapshot` (dinámico, snapshot actual) y solo si eso da `null`/`undefined` cae a `getDeliveryOption` de [[businessConfig]] (estático, congelado al import) — doble fallback para no romper si el snapshot dinámico no tiene la opción.
- El descuento se calcula con `calculateDiscountAmount` de [[promotionDiscount]] — este archivo **no** valida el código promocional en sí (eso es responsabilidad de [[promotionMatching]] antes de llegar acá); acá solo se aplica el `discount`/`discountType` que ya vienen resueltos. Ver el fix reciente de matcheo de código promocional y descuento fijo en $0 (`589dfc1`).
- `discountCode` en el resultado queda vacío (`""`) si `discountValue <= 0`, aunque el usuario haya tipeado un código — evita mostrar "código aplicado" cuando el descuento efectivo es 0.

**Dependencias clave:** `getDeliveryOption` de [[businessConfig]]; `buildBusinessConfig`/`getCartItemLitersFromSnapshot`/`getDeliveryOptionFromSnapshot` de [[commercialAdapters]]; `commercialSnapshot` de [[commercialData]]; `calculateDiscountAmount` de [[promotionDiscount]]; `PackLineMetadata` de [[configurableBeerPack]]; tipos de `commercialTypes.ts`.

**Tests:** `orderSummary.test.ts` (si existe) cubre este módulo — es el punto donde se validan escenarios de descuento (ver commits recientes sobre matcheo de promo y descuento fijo).
