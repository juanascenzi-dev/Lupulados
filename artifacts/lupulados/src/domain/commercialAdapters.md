---
tags: [domain, adapter]
related:
  ["[[beerCatalog]]", "[[businessConfig]]", "[[commercialData]]", "[[format]]", "[[whatsAppOrder]]"]
---

# `commercialAdapters.ts`

**Propósito:** puente entre el `CommercialSnapshot` (datos crudos de Supabase/estático) y las estructuras que consume la UI de la calculadora/storefront (`Beer`, opciones de tipo de pedido, config comercial pública). A diferencia de [[businessConfig]] (que congela los valores al importar), este módulo recalcula todo por snapshot pasado como parámetro — es la versión "reactiva" preferida para código nuevo.

**Exports principales:**

- `presentationIds` — orden canónico de tipos de presentación de cerveza.
- `buildBeerCatalog(snapshot?)` — arma el array `Beer[]` (con su objeto `precios` indexado por `BeerPresentationId`) a partir de los productos/presentaciones activos de tipo `"beer"` en el snapshot.
- `buildOrderTypeOptions(snapshot?)` — las 4 tarjetas de tipo de pedido (barril/growler/porrón/pack degustación), recalculando el precio "desde" real según el snapshot dado.
- `buildBusinessConfig(snapshot?)` — objeto agregado (profile, pricing, whatsapp, delivery, extras, promoción activa) equivalente al de [[businessConfig]] pero derivado en runtime de cualquier snapshot.
- `getDeliveryOptionFromSnapshot(id, snapshot?)`, `buildWhatsAppUrlFromSnapshot(message, phone?, snapshot?)`, `getCartItemLitersFromSnapshot(itemId, snapshot?)` — helpers puntuales que reutilizan `buildBusinessConfig` o consultan directo `snapshot.productPresentations`.

**Reglas de negocio / edge cases:**

- Todas las funciones aceptan `snapshot` opcional con default `commercialSnapshot` (el snapshot estático de [[commercialData]]) — en producción normalmente se les pasa el snapshot cargado dinámicamente vía `CommercialDataContext`.
- `getMinimumPresentationPrice` (local, no exportado) filtra precios `<= 0` antes de tomar el mínimo, y devuelve `0` si no queda ningún precio válido — evita mostrar "Desde $0" cuando ninguna presentación tiene precio cargado.
- El pack degustación en `buildOrderTypeOptions` sigue con precio hardcodeado (`10500`), no derivado del snapshot — a diferencia de barril/growler/porrón que sí se recalculan.
- `getCartItemLitersFromSnapshot` intenta primero un match directo de `itemId` contra `presentation.id`, y si no, extrae un `presentationType` del `itemId` (con el mismo patrón regex que [[beerCatalog]]`.getCartItemPresentationId`) para buscar por tipo — duplica esa heurística en vez de reusar la función de `beerCatalog.ts` directamente (evita import circular: `beerCatalog.ts` importa de este archivo).

**Dependencias clave:** `commercialSelectors.ts` (todas las funciones `get*`/`list*` sobre snapshot); `commercialSnapshot` de [[commercialData]] (default); tipos `Beer`/`BeerPresentation`/`BeerPresentationId`/`CartCategory` de [[beerCatalog]]; `buildWhatsAppOrderUrl` de [[whatsAppOrder]]; `formatPrice` de [[format]].

**Tests:** `commercialAdapters.test.ts` (si existe) cubre este módulo.
