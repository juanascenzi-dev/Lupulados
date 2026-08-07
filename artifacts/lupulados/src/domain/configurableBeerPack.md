---
tags: [domain, calculator]
related: ["[[beerCatalog]]", "[[beverageMix]]", "[[cartStorage]]"]
---

# `configurableBeerPack.ts`

**Propósito:** modela los "packs de 6 porrones configurables" (el usuario arma su propio pack eligiendo qué estilos y cuántos de cada uno, hasta completar una capacidad fija), incluyendo la lógica de agrupar packs idénticos en el carrito y convertirlos en líneas de `StoredCartItem`.

**Exports principales:**

- Constantes: `CONFIGURABLE_BEER_PACK_CAPACITY` (6), `CONFIGURABLE_BEER_PACK_MAX_PACKS` (12), `CONFIGURABLE_BEER_PACK_VERSION` (1, para invalidar packs guardados con un schema viejo), `CONFIGURABLE_BEER_PACK_PRODUCT_ID`/`_PRESENTATION_ID` (IDs sintéticos usados en el carrito).
- Tipos: `PackSelection` (`{ productId, quantity, name? }`), `ConfigurablePackComposition`, `PackDraft` (composición en edición, con `id`), `PackAvailableProduct`, `PackLineMetadata` (lo que se persiste en `StoredCartItem.pack`), `GroupedConfigurablePack`.
- `normalizePackCount`, `createEmptyPackDraft`, `normalizePackSelection`, `normalizePackComposition` — normalización/saneamiento: enteros positivos, capacidad válida, selecciones sin productos desconocidos (`validProductIds`), recortadas para no superar la capacidad, ordenadas por `productId`.
- `getPackSelectedCount`, `getPackRemainingCount`, `isPackComplete` — estado derivado de un draft.
- `updatePackSelection(draft, productId, quantity, validProductIds?)` — fija la cantidad de un producto en el draft, clampeada a lo que quede libre de capacidad (mismo patrón que `updateBeverageMixShare` en [[beverageMix]]).
- `copyPackComposition`, `resizePackDrafts`, `applyCompositionToAllPacks` — gestión de múltiples packs en el wizard (agregar/quitar packs, replicar la composición de uno a todos).
- `canonicalizePackComposition(composition)` — genera una clave string determinística de la composición (`pack=...|version=...|capacity=...|productId=qty|...`), usada para detectar packs idénticos y como parte del `id` de línea de carrito.
- `listPackAvailableProducts(beers)` — de un catálogo de cervezas, extrae las que tienen presentación `porron500ml` con precio > 0, ordenadas por nombre.
- `calculatePackPrice(composition, products)` — suma precio × cantidad de cada selección, resolviendo el precio contra la lista de productos disponibles.
- `groupIdenticalPacks(drafts, products)` — agrupa drafts **completos** (selección == capacidad) por su clave canónica, sumando `qty`; descarta drafts incompletos.
- `formatPackComposition`, `buildConfigurablePackCartItem` — texto legible de la composición y conversión final a `Omit<StoredCartItem, "qty">` (con `category: "pack"`, `id` = clave canónica).
- `isConfigurableBeerPackItem`, `isPackLineMetadata` — type guards para distinguir estas líneas de carrito de otras.

**Reglas de negocio / edge cases:**

- `resizePackDrafts` pide confirmación (`needsConfirmation: true`, sin aplicar el resize) si reducir la cantidad de packs implica **descartar un draft con selecciones ya hechas**, salvo que `options.allowDiscardConfigured` sea `true` — protege contra perder configuración del usuario sin que se dé cuenta.
- `groupIdenticalPacks` exige que la suma de cantidades **iguale exactamente** la capacidad para considerar un pack "completo" y agruparlo; un pack a medio configurar simplemente no aparece en el resultado.
- `isPackLineMetadata` valida `capacity === CONFIGURABLE_BEER_PACK_CAPACITY` (6 fijo), no solo `> 0` — un pack persistido con otra capacidad (de una versión futura/pasada del feature) se considera inválido y se descarta en la reconciliación de [[cartStorage]].
- `canonicalizePackComposition` es la base de la deduplicación: dos packs con la misma composición pero distinto orden de selección producen la misma clave porque `normalizePackComposition` ordena por `productId` antes de serializar.

**Dependencias clave:** `Beer` de [[beerCatalog]]; `StoredCartItem` de [[cartStorage]] (tipo de retorno de `buildConfigurablePackCartItem`, dependencia inversa a la de `cartStorage.ts` que importa funciones de este archivo — cuidado con imports circulares si se refactoriza).

**Tests:** `configurableBeerPack.test.ts` (si existe) cubre este módulo — es de los más complejos de `domain` junto con `cartStorage.ts`.
