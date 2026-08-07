---
tags: [domain, catalog]
related: ["[[beerCatalog]]", "[[cartStorage]]", "[[configurableBeerPack]]", "[[orderFlow]]"]
---

# `productCatalog.ts`

**Propósito:** capa de catálogo genérica (no específica de cerveza) sobre el `CommercialSnapshot`: categorías visibles, productos/presentaciones activos por categoría, construcción de líneas de carrito comerciales, y reconciliación de una selección de categoría/producto/presentación contra lo disponible actualmente (usado por el selector de productos no-cerveza del wizard).

**Exports principales:**

- `PRODUCT_CATEGORIES` — las 16 categorías válidas (mismo set que `ProductCategory` de `commercialTypes.ts`, pero como array runtime para poder iterar/validar).
- `PRODUCT_CATEGORY_ORDER` — orden de visualización (difiere levemente de `PRODUCT_CATEGORIES`: `pack` va antes que `accessory`).
- `PRODUCT_CATEGORY_LABELS` — etiqueta en español por categoría.
- `LegacyOrderCategory` — union de categorías de carrito legadas (`barril`/`growler`/`porron`/`porrón`/`pack`).
- `CommercialCartLineDraft`, `CatalogCategoryOption`, `CatalogProductOption`, `CatalogSelectionState` — shapes de UI/estado del selector de catálogo.
- `isProductCategory(value)` — type guard runtime contra `PRODUCT_CATEGORIES`.
- `createCartLineKey(line)` — genera el `id` canónico de una línea de carrito: `category=X|product=Y|presentation=Z[|variant=W]` — es la función central de la que dependen [[beerCatalog]], [[cartStorage]] y [[configurableBeerPack]] indirectamente para IDs estables.
- `getProductVariantLabel(product, presentation?)` — resuelve el "variante" (ej. estilo de cerveza) mostrado en la línea: prioriza `presentation.variantLabel`, si no cae a `product.style`.
- `createCommercialCartItem(product, presentation)` — arma un `CommercialCartLineDraft` completo a partir de producto+presentación, con nombre formateado vía `formatCommercialLineName`.
- `formatCommercialLineName(productName, presentationLabel?, variantLabel?)` — concatena con `" — "`, omitiendo `variantLabel` si es igual a `productName` (evita "Vino Malbec — Vino Malbec — Botella 750ml").
- `buildActiveCatalogIndexes(snapshot)` — `Map`s de productos/presentaciones activos y válidos, indexados por `id`, para lookups O(1).
- `isValidCatalogPresentation(presentation)` — activa **y** con `unitPrice` finito y `> 0` (una presentación con precio 0/inválido no cuenta como comprable).
- `listCatalogProductsByCategory(snapshot, category)` — productos activos de una categoría con al menos una presentación válida, ordenados por `sortOrder`/nombre, con `priceFrom` (mínimo de sus presentaciones).
- `listVisibleCatalogCategories(snapshot)` — categorías con al menos un producto disponible, en el orden de `PRODUCT_CATEGORY_ORDER`.
- `shouldShowCategorySelector(categories)` — `true` solo si hay más de una categoría visible (no tiene sentido un selector con una sola opción).
- `reconcileCatalogSelection(snapshot, selection)` — dada una selección parcial/potencialmente stale, la resuelve contra el catálogo actual: si la categoría ya no es válida, cae a la primera visible; si el producto ya no existe en esa categoría, queda `null`; si la presentación no matchea pero el producto tiene una sola presentación, la autoselecciona.
- `normalizeCatalogQuantity(quantity)` — clamp a entero `[1, 999]`.
- `findActiveProductPresentation(snapshot, productId, presentationId)` — busca ambos por índice y valida que la presentación pertenezca al producto; `null` si cualquier cosa no matchea.

**Reglas de negocio / edge cases:**

- `createCartLineKey` es la pieza central de identidad de línea de carrito en todo el dominio — cualquier cambio a su formato de output rompe la deduplicación de carritos ya persistidos en `localStorage` de usuarios existentes (hay que pensar la migración de versión, ver `CURRENT_CART_STORAGE_VERSION` en [[cartStorage]]).
- `reconcileCatalogSelection` autoselecciona la única presentación disponible de un producto (`product.presentations.length === 1`), pero **no** autoselecciona el único producto de una categoría — solo resuelve presentación, no producto, cuando hay una sola opción.
- `PRODUCT_CATEGORY_ORDER` y `PRODUCT_CATEGORIES` tienen el mismo contenido pero **distinto orden** (deliberado, ver el comentario de posiciones de `pack`/`accessory`) — no son intercambiables aunque parezcan duplicados.

**Dependencias clave:** tipos `CommercialSnapshot`/`Product`/`ProductCategory`/`ProductPresentation` de `commercialTypes.ts`. Es importado por [[beerCatalog]], [[cartStorage]] y [[orderFlow]] (posible candidato a import circular con `beerCatalog.ts`, cuidado al refactorizar).

**Tests:** `productCatalog.test.ts` (si existe) cubre este módulo.
