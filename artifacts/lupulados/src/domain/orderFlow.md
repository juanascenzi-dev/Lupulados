---
tags: [domain, context-logic]
related:
  [
    "[[barrelCalculator]]",
    "[[beerCatalog]]",
    "[[beverageMix]]",
    "[[cartStorage]]",
    "[[productCatalog]]",
  ]
---

# `orderFlow.ts`

**Propósito:** lógica del wizard de pedido de cerveza: detectar si la selección actual ya está en el carrito (para no duplicar), construir las líneas de carrito recomendadas (barriles según el plan de [[barrelCalculator]], bebidas de la mezcla de [[beverageMix]]), y generar una clave de dedup para recomendaciones pendientes.

**Exports principales:**

- `OrderType` — `CartCategory | "paquete" | null`.
- `hasCurrentSelectionInCart(items, selectedBeer, orderType)` — para `orderType === "paquete"`, chequea si el pack degustación ya está en el carrito; si no, busca si ya hay una línea de la cerveza+presentación seleccionada (matcheando por `productId`/`beerId`, o por prefijo de `id`/`name` como fallback legado) entre las presentaciones esperadas para ese `orderType` (barril/growler/porrón).
- `hasTastingPack(items)` — shortcut de si el pack degustación está en el carrito.
- `buildRecommendedBarrelItems(beer, barrelPlan)` — convierte un `BarrelRecommendation.parts` en líneas de `StoredCartItem`, agrupando por `id` si dos partes generan la misma línea (no debería pasar normalmente, pero es defensivo). Lanza si la cerveza no tiene la presentación de barril requerida, o si esa presentación no es de categoría `"barril"`.
- `preparePendingBarrelRecommendation(next)` — identidad (`next => next`); existe como punto de extensión/nombre semántico, no transforma nada hoy.
- `BeverageMixOrderResult`, `RecommendationKeyInput`, `buildRecommendationKey(input)` — arma una clave string determinística a partir de cerveza elegida, plan de barriles, mezcla de bebidas y preferencias de estilo, para detectar si ya se agregó esta misma recomendación al carrito antes.
- `buildRecommendedBeverageMixItems(mixResult, snapshot)` — para cada entrada no-cerveza de la mezcla con `percentage > 0`, busca el primer producto/presentación disponible de esa categoría en el catálogo (`listCatalogProductsByCategory` de [[productCatalog]]), calcula botellas necesarias (`Math.ceil(litros / volumen)`) y arma la línea; si no hay producto disponible para ese tipo, lo agrega a `skipped` en vez de fallar.

**Reglas de negocio / edge cases:**

- `hasCurrentSelectionInCart` tiene 3 estrategias de match en cascada para tolerar formatos de `id`/`presentationType` distintos entre versiones del carrito (mismo patrón defensivo que [[beerCatalog]] y [[cartStorage]]).
- `buildRecommendedBeverageMixItems` solo toma el **primer** producto/primera presentación disponible de cada categoría no-cerveza (`options[0]`, `option.presentations[0]`) — no hay lógica de elegir "el mejor" o el más barato, es determinista pero simple.
- `buildRecommendationKey` incluye litros/porcentaje de cada ítem de la mezcla y las preferencias de estilo de cerveza en la clave — un cambio en cualquiera de esos inputs genera una recomendación "distinta" a efectos de dedup, aunque el resultado final de litros sea el mismo.

**Dependencias clave:** `barrelPresentationIds`/`growlerPresentationIds`/`packagedPresentationIds`/`tastingPack`/`createBeerCartItem`/`getCartItemPresentationId` de [[beerCatalog]]; `BarrelRecommendation` de [[barrelCalculator]]; `BeverageMixItemEstimate`/`NonBeerBeverageType` de [[beverageMix]]; `createCommercialCartItem`/`listCatalogProductsByCategory` de [[productCatalog]]; `StoredCartItem` de [[cartStorage]].

**Tests:** `orderFlow.test.ts` (si existe) cubre este módulo.
