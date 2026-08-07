---
tags: [domain, constants]
related: ["[[storeCatalog]]"]
---

# `storePageConstants.ts`

**Propósito:** listas de opciones derivadas de [[storeCatalog]] para poblar los selectores de filtro de `StorePage` (categoría principal, orden, rango de precio), en el orden en que deben mostrarse.

**Exports principales:**

- `mainCategories` — orden fijo de `StoreMainCategory` para el selector de categoría (`all` primero, luego `beer`/`alcohol`/`non-alcohol`/`combo`/`accessory`).
- `sortOptions` — `Object.keys(STORE_SORT_LABELS)` casteado a `StoreSortOption[]` (el orden de las claves del objeto en [[storeCatalog]] determina el orden de aparición en el selector).
- `priceRangeOptions` — mismo patrón con `STORE_PRICE_RANGE_LABELS`.

**Reglas de negocio / edge cases:**

- `sortOptions`/`priceRangeOptions` dependen del **orden de declaración de propiedades** de los objetos `STORE_SORT_LABELS`/`STORE_PRICE_RANGE_LABELS` en `storeCatalog.ts` — si se reordenan esas claves ahí, el orden del selector cambia acá sin tocar este archivo (es intencional: una sola fuente de verdad del orden).
- `mainCategories`, en cambio, es una lista hardcodeada e independiente del orden de `STORE_MAIN_CATEGORY_LABELS` — no usa el mismo patrón `Object.keys`, así que si se agrega una categoría nueva a `StoreMainCategory` hay que actualizar este array a mano.

**Dependencias clave:** `STORE_PRICE_RANGE_LABELS`, `STORE_SORT_LABELS`, tipos `StoreMainCategory`/`StorePriceRange`/`StoreSortOption` de [[storeCatalog]].

**Tests:** no aplica (sin lógica ejecutable, solo listas derivadas).
