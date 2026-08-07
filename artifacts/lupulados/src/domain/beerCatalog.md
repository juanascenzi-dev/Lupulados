---
tags: [domain, catalog]
related: ["[[commercialAdapters]]", "[[commercialData]]", "[[format]]", "[[productCatalog]]"]
---

# `beerCatalog.ts`

**Propósito:** punto central del catálogo de cervezas y sus presentaciones/precios para la calculadora y el flujo de armado de pedido; también arma los "tipos de pedido" (barril/growler/porrón/pack degustación) que se muestran como opciones de entrada al usuario.

**Exports principales:**

- `Beer`, `BeerPresentation`, `CartCategory`, `BeerPresentationId` (= `PresentationType` de `commercialTypes.ts`), `CartItemDraft` — tipos base del dominio de cerveza/carrito.
- `beerCatalog` — array de `Beer`, construido en runtime con `buildBeerCatalog()` de [[commercialAdapters]] (no está hardcodeado acá).
- `barrelPresentationIds` / `growlerPresentationIds` / `packagedPresentationIds` — agrupan los `BeerPresentationId` por categoría física.
- `tastingPack` — ítem especial fijo (Pack Degustación 6 estilos), no es parte del catálogo dinámico.
- `orderTypeOptions` — las 4 tarjetas de "tipo de pedido" (barril/growler/porrón/paquete) con precio "desde" calculado como el mínimo real del catálogo cargado.
- `getBeerPresentation(beer, presentationId)`, `createBeerCartItem(beer, presentationId)` — arma un `CartItemDraft` a partir de una cerveza+presentación, generando su `id` con `createCartLineKey` de [[productCatalog]].
- `getCartItemImage(itemName)`, `getCartItemPresentationId(itemId)`, `getCartItemLiters(itemId)` — funciones inversas para reconstruir info a partir del `id`/nombre de un ítem de carrito ya persistido (ej. en `cartStorage.ts`).

**Reglas de negocio / edge cases:**

- `getMinimumPresentationPrice` se calcula sobre `beerCatalog` **al momento del import** (top-level, no lazy): si el catálogo cambia dinámicamente después, `orderTypeOptions` no se recalcula solo.
- `getCartItemPresentationId` intenta 3 estrategias en cascada para extraer el `presentationId` de un `itemId` legado/con distintos formatos: (1) regex sobre el patrón `presentation=beerId:presentationId`, (2) split directo por `:`, (3) buscar cualquier `presentationId` conocido como substring — refleja compatibilidad con IDs de carrito de distintas épocas del código.
- `getCartItemLiters` delega en `getCartItemLitersFromSnapshot` de [[commercialAdapters]] usando el `commercialSnapshot` global de [[commercialData]] — depende de que el snapshot ya esté cargado.

**Dependencias clave:** `buildBeerCatalog`/`getCartItemLitersFromSnapshot` de [[commercialAdapters]]; `commercialSnapshot` de [[commercialData]]; `createCartLineKey` de [[productCatalog]]; `formatPrice` de [[format]].

**Tests:** `beerCatalog.test.ts` (si existe) cubre este módulo.
