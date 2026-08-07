---
tags: [domain, constants]
related: ["[[commercialAdapters]]", "[[format]]", "[[whatsAppOrder]]"]
---

# `businessConfig.ts`

**Propósito:** capa de compatibilidad hacia atrás: expone como constantes top-level (calculadas una sola vez al importar el módulo) la misma configuración comercial que [[commercialAdapters]] arma dinámicamente vía `buildBusinessConfig`. Pensado para código legado que espera `import { whatsappNumber, deliveryOptions, ... } from "./businessConfig"` en vez de leer del snapshot.

**Exports principales:**

- `PublicDeliveryOption` — shape público de una opción de entrega (`id`, `label`, `desc`, `cost`, `requiresAddress`).
- `businessProfile`, `pricing`, `priceDisclaimer`, `whatsappChannels`, `primaryOrderWhatsAppChannel`, `whatsappNumber`, `whatsappDisplayLabel`, `publicContactEmail`, `businessLocation`, `deliveryOptions`, `additionalCosts`, `promotionConfig` — snapshot de configuración comercial derivado de `commercialSelectors.ts` en el momento del import.
- `getDeliveryOption(id)` — busca en `deliveryOptions`, con fallback al primero si no encuentra el `id`.
- `buildWhatsAppUrl(message, phone?)` — wrapper de `buildWhatsAppOrderUrl` de [[whatsAppOrder]], con `whatsappNumber` como default.
- `formatDeliveryForMessage(id)` — texto para el mensaje de WhatsApp del pedido ("Zona Norte GBA ($8.000)" o "Retiro en fábrica (Gratis)").

**Reglas de negocio / edge cases:**

- Todos los valores exportados se calculan **una sola vez, al cargar el módulo** (top-level), a diferencia de `buildBusinessConfig` en [[commercialAdapters]] que recalcula por snapshot en cada llamada. Si el snapshot comercial cambia en runtime (ej. tras editar datos en el admin), este módulo **no se entera** — solo sirve para el snapshot estático inicial. El código nuevo que necesite reactividad debería usar `commercialAdapters.ts` directamente, no este archivo.
- `getDeliveryOption` nunca devuelve `undefined`: si el `id` no matchea, cae al primer elemento de `deliveryOptions`.

**Dependencias clave:** `commercialSelectors.ts` (fuente de la configuración); `buildWhatsAppOrderUrl` de [[whatsAppOrder]]; `formatPrice` de [[format]].

**Tests:** `businessConfig.test.ts` (si existe) cubre este módulo.
