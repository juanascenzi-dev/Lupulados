---
tags: [domain, catalog]
related: ["[[demoStoreCatalog]]", "[[productCatalog]]", "[[storePricing]]"]
---

# `storeCatalog.ts`

**Propósito:** el módulo central del storefront (`StorePage`): arma el catálogo completo con datos demo mezclados, y provee filtrado, ordenamiento, normalización de texto/labels y agregaciones (subcategorías, tipos de presentación disponibles) para la grilla de productos.

**Exports principales:**

- `StoreMainCategory` (`"all" | "beer" | "alcohol" | "non-alcohol" | "combo" | "accessory"`), `StoreCatalogItem`, `StoreSortOption`, `StorePriceRange`, `StoreFilters`, `StorePresentationOption` — tipos del dominio de la tienda.
- `STORE_SORT_LABELS`, `STORE_PRICE_RANGE_LABELS`, `STORE_MAIN_CATEGORY_LABELS` — etiquetas en español para cada opción, tipadas con `satisfies Record<...>` para forzar que cubran todos los valores del union.
- `normalizeSearchText(value)` — quita diacríticos (`normalize("NFD")` + regex de marcas diacríticas) y pasa a minúsculas, para búsqueda tolerante a acentos.
- `getStoreMainCategory(product)` / `getStoreSubcategory(product)` — usan `product.mainCategory`/`product.subcategory` si están seteados, si no caen a `fallbackMainCategory`/`fallbackSubcategory` (mapas fijos por `ProductCategory`).
- `isValidStoreImageSource(value)` / `getStoreImageSource(product)` — filtra fuentes de imagen conocidas como placeholder inválido (`invalidImageSources`, hoy solo la URL de ejemplo `example.com`).
- `normalizePresentationLabel(label)` / `labelFromPresentationType(type)` / `getHumanPresentationLabel(presentation)` — normalización tipográfica de labels (`"20L"` → `"20 L"`, `"Porron"` → `"Porrón"`, etc.) y generación de labels legibles a partir del `presentationType` crudo cuando el label guardado no alcanza.
- `buildStoreSnapshot(snapshot)` — agrega los productos/presentaciones demo de [[demoStoreCatalog]] al snapshot real, solo los que no colisionan por `id` con datos ya existentes (así datos reales de Supabase siempre ganan sobre el demo).
- `buildStoreCatalog(snapshot)` / `buildStoreCatalogWithDemo(snapshot)` — arman `StoreCatalogItem[]` a partir de productos activos con al menos una presentación válida; la segunda variante primero mezcla el snapshot con `buildStoreSnapshot`.
- `filterStoreCatalog(items, filters)` — aplica todos los filtros de `StoreFilters` en cascada (categoría, subcategoría, tipo de presentación, solo promociones, solo con ahorro por volumen, rango de precio, texto de búsqueda).
- `sortStoreCatalog(items, sortBy?)` — 6 criterios de orden, todos con `product.sortOrder` (o nombre, según el criterio) como desempate; usa `Intl.Collator("es")` para comparación de nombres correcta con acentos/ñ.
- `getActiveStoreFilterCount(filters)` — cuenta cuántos filtros están efectivamente activos (para el badge de "N filtros aplicados" en la UI).
- `listStoreSubcategories(items, mainCategory?)`, `listStorePresentationTypes(items)`, `listStorePresentationOptions(items)` — agregaciones para poblar los selectores de filtro dinámicamente según lo que hay en el catálogo.
- `getStoreResultLabel(count)` — `"N resultado"`/`"N resultados"`.

**Reglas de negocio / edge cases:**

- `labelFromPresentationType` tiene una cascada de ~10 reglas hardcodeadas por patrón/valor exacto de `presentationType` (barriles, growlers, porrón, botellas por volumen, latas, packs, combos, "evento") — agregar un tipo de presentación nuevo que no matchee ninguna regla cae a `normalizePresentationLabel(presentation.label)` como fallback genérico.
- `buildStoreSnapshot` deduplica por `id` en dos niveles: primero filtra productos demo que no colisionen con productos reales, y luego, de esos productos demo agregados, filtra sus presentaciones que tampoco colisionen — evita productos demo "huérfanos" cuyo producto real ya existe pero con presentaciones demo residuales.
- `sortStoreCatalog` con `"savings-desc"` usa `getProductMaxSavings` de [[storePricing]] como criterio primario — depende de ese módulo para el cálculo de ahorro por volumen/promoción.
- El filtro `onlyVolumeSavings` (`hasVolumeSavings`) y `onlyPromotions` (`hasPromotion`) son conceptualmente distintos: el primero es ahorro por comparación de presentaciones (ej. barril más barato por litro que growler), el segundo es una promoción explícita marcada en el dato (`presentation.promotional`).

**Dependencias clave:** `demoStorePresentations`/`demoStoreProducts` de [[demoStoreCatalog]]; `isValidCatalogPresentation` de [[productCatalog]]; `getProductMaxSavings`/`hasPromotion`/`hasVolumeSavings` de [[storePricing]]; tipos de `commercialTypes.ts`.

**Tests:** `storeCatalog.test.ts` (si existe) cubre este módulo — es de los más grandes de `domain` junto con `cartStorage.ts`.
