---
tags: [domain, schema]
related: []
---

# `checkout.ts`

**Propósito:** validación del formulario de checkout (datos del pedido: nombre, fecha, entrega, dirección) y selección del canal de WhatsApp por defecto para enviar el pedido.

**Exports principales:**

- `CheckoutFormData` — `{ name, eventDate, timeSlot, delivery, address, notes }`.
- `CheckoutValidationInput` — `{ formData, totalItems, today, deliveryRequiresAddress }`.
- `getTodayInputValue(now?)` — fecha de hoy en formato `YYYY-MM-DD` ajustada a la zona horaria local del browser (para precargar el mínimo de un `<input type="date">`).
- `validateCheckout(input)` — devuelve `{ valid, errors }`; acumula mensajes en español: carrito vacío, nombre faltante, fecha faltante o anterior a hoy, dirección faltante cuando la entrega elegida la requiere.
- `listOrderWhatsAppChannels(channels)` — filtra canales activos con propósito de pedidos (`orders`, `orders_and_contact`, o `contact`) y los ordena por `isPrimary` primero, luego `sortOrder`.
- `getDefaultWhatsAppChannelId(channels)` — el primer canal de `listOrderWhatsAppChannels`, o `""` si no hay ninguno.

**Reglas de negocio / edge cases:**

- `validateCheckout` no corta en el primer error: acumula todos los errores aplicables en un array, para poder mostrarlos todos juntos en la UI.
- La comparación `eventDate < today` es un string compare directo (ambos en formato `YYYY-MM-DD`, que ordena lexicográficamente igual que cronológicamente) — no usa `Date`.
- `listOrderWhatsAppChannels` incluye canales de propósito `"contact"` puro como opción de pedido (no solo `"orders"`/`"orders_and_contact"`) — cualquier canal activo no purely-unrelated sirve como fallback para mandar el pedido.

**Dependencias clave:** `DeliveryOptionId`, `WhatsAppChannel` de `commercialTypes.ts`.

**Tests:** `checkout.test.ts` (si existe) cubre este módulo.
