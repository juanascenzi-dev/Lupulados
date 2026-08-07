---
tags: [domain, util]
related:
  [
    "[[adminFormAdapters]]",
    "[[businessConfig]]",
    "[[checkout]]",
    "[[commercialAdapters]]",
    "[[commercialData]]",
    "[[commercialSchemas]]",
  ]
---

# `commercialSelectors.ts`

**Propósito:** capa de lectura/consulta sobre un `CommercialSnapshot`: filtra por activo/status, ordena por `sortOrder`, y resuelve reglas puntuales (canal de WhatsApp principal para pedidos, promoción vigente por fecha). Es la base que reutilizan tanto [[businessConfig]] (congelado) como [[commercialAdapters]] (dinámico).

**Exports principales:**

- `getBusinessProfile(snapshot?)`, `getPricingConfig(snapshot?)` — perfil y config de pricing (status + disclaimer), copiados por valor.
- `listActiveWhatsAppChannels(snapshot?)` — canales `active`, ordenados por `sortOrder`.
- `getPrimaryOrderWhatsAppChannel(channels)` / `getPrimaryOrderWhatsAppChannelFromSnapshot(snapshot?)` — de los canales activos, válidos (`isValidWhatsAppPhone`) y que aceptan pedidos (`purpose` `orders` u `orders_and_contact`), devuelve el marcado `isPrimary`, o si no hay ninguno marcado, el de menor `sortOrder`; `null` si no hay ninguno elegible.
- `listActiveProducts(snapshot?)` — productos con `status === "active"`, ordenados.
- `listActiveProductPresentations(productId, snapshot?)` — presentaciones activas de un producto, pero **solo si el producto en sí está activo** (devuelve `[]` si no).
- `listActiveDeliveryOptions(snapshot?)`, `listActiveExtraOptions(snapshot?)` — filtradas por `active`, ordenadas.
- `listActivePromotions(snapshot?)` — promociones `active` **y** dentro de su ventana de fechas (`isPromotionInWindow`).
- `getActivePromotion(snapshot?)` — la primera promoción activa vigente, o `null`.
- `getFreeGlassesThreshold(snapshot?)` — de `snapshot.pricingRules`.
- `isValidWhatsAppPhone(phone)` — regex `^54911\d{8}$` (mismo patrón que en [[commercialSchemas]] y [[adminFormAdapters]], duplicado en los tres lugares — no está centralizado en una sola constante).

**Reglas de negocio / edge cases:**

- `acceptsOrders` **no** incluye `purpose === "contact"` como canal válido para pedidos (a diferencia de `listOrderWhatsAppChannels` en [[checkout]], que sí acepta `"contact"` como fallback) — hay una pequeña divergencia intencional entre "canal principal de pedidos del negocio" (más estricto) y "cualquier canal disponible para mandar el pedido en el checkout" (más permisivo).
- `isPromotionInWindow` compara strings de fecha `YYYY-MM-DD` directamente contra `today` (mismo truco de comparación lexicográfica que en [[checkout]]); si `startDate`/`endDate` son `null`/`undefined`, ese límite no aplica (promoción sin fecha de inicio/fin = siempre vigente por ese lado).
- Todas las funciones `list*`/`get*` devuelven **copias** (`{...}` o `[...items].sort()`) del snapshot, nunca referencias directas — evita que un caller mute el snapshot compartido por accidente.

**Dependencias clave:** `commercialSnapshot` de [[commercialData]] (default de todos los parámetros `snapshot`); tipos de `commercialTypes.ts`.

**Tests:** `commercialSelectors.test.ts` (si existe) cubre este módulo.
