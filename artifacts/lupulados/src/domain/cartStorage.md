# `cartStorage.ts`

**Propósito:** el módulo más grande y crítico de persistencia del carrito: serializa/deserializa el carrito en `localStorage`, migra formatos legados (versión 2→3, mojibake de encoding, categorías viejas), y reconcilia el carrito persistido contra el catálogo comercial vigente (por si un producto/presentación cambió de precio o se archivó desde la última visita).

**Exports principales:**

- `CART_STORAGE_KEY`, `MAX_CART_ITEM_QTY` (999), `CURRENT_CART_STORAGE_VERSION` (3).
- `StoredCartItem` — shape persistido de un ítem de carrito; incluye campos legacy (`beerId`/`beerName`) mantenidos "for compatibility with persisted carts".
- `parseCartItems(rawValue)` / `readCartItems(storage)` / `writeCartItems(storage, items)` — leer/escribir el carrito en un `Storage`-like (ej. `localStorage`), con `try/catch` silencioso ante JSON inválido o storage no disponible (modo privado, cuota excedida).
- `normalizeCartQuantity(qty)` — clampea `qty` a un entero en `[0, MAX_CART_ITEM_QTY]`.
- `getCartLineKey(item)` / `areSameCartLine(a, b)` — clave estable de una línea de carrito (para deduplicar/mergear cantidades), usando `createCartLineKey` de [[productCatalog]] cuando puede resolver `productId`+`presentationId`, o un fallback `category:id`.
- `getCartItemSubtotal(item)`, `getCartTotal(items)` — cálculos de precio.
- `addCartItemToCart(items, item, qty?)`, `updateCartItemQuantity(items, id, qty)` — mutaciones inmutables del array de carrito (mergean cantidad si ya existe la misma línea; quitan el ítem si la cantidad normalizada queda en 0).
- `reconcileCartItemsWithSnapshot(items, snapshot)` — recorre el carrito persistido y descarta/reconstruye cada línea contra el `CommercialSnapshot` actual: si el producto/presentación ya no está activo, la línea se descarta; si sigue activo, se reconstruye con el precio/label actuales (evita mostrar precios stale).

**Reglas de negocio / edge cases:**

- `LEGACY_MOJIBAKE_REPLACEMENTS`: tabla de reemplazos hardcodeados para arreglar texto guardado con doble-encoding UTF-8 roto (ej. "PorrÃn" → "Porrón") de versiones viejas del carrito — se aplica en `normalizeLegacyCatalogText` sobre cualquier campo de texto legado al leer del storage.
- `isStoredCartItem` es un type guard estricto: exige `price` finito, `qty` entero > 0, y `category` no vacío; cualquier ítem que no cumpla se descarta silenciosamente al parsear (protege contra storage corrupto).
- `readCartItems` limpia la key del storage (`removeItem`) si el JSON parseaba pero terminó en 0 ítems válidos — evita relecturas repetidas de basura.
- `writeCartItems` nunca lanza: si `setItem` falla (cuota, modo privado), el carrito sigue funcionando solo en memoria para esa sesión.
- `reconcileCartItemsWithSnapshot` trata 3 casos de línea por separado: pack degustación fijo (`isTastingPackLine`), pack configurable de porrones (`isConfigurableBeerPackItem`, reconstruido con `buildConfigurablePackCartItem` de [[configurableBeerPack]] y descartado si el `canonicalKey` cambió, o sea la composición ya no es reproducible), y presentación simple (`reconcilePresentationItem`, que exige que tanto el producto como la presentación sigan activos y con precio > 0).
- `getStablePresentationId`/`getLegacyProductId` reconstruyen IDs a partir de distintos formatos históricos de `item.id`/`item.presentationId` (con o sin `:`), para poder matchear contra el snapshot aun con IDs de carritos viejos.

**Dependencias clave:** `tastingPack`, `CartCategory` de [[beerCatalog]]; `createCartLineKey`, `isProductCategory` de [[productCatalog]]; `buildConfigurablePackCartItem`, `isConfigurableBeerPackItem`, `isPackLineMetadata`, `listPackAvailableProducts` de [[configurableBeerPack]]; `CommercialSnapshot`/`ProductCategory` de `commercialTypes.ts`.

**Tests:** `cartStorage.test.ts` (si existe) cubre este módulo — es de los archivos con más superficie de edge cases en `domain`.
