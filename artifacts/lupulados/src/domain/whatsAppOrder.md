# `whatsAppOrder.ts`

**Propósito:** genera el mensaje de texto completo del pedido (formato específico, en español, pensado para pegarse en WhatsApp) a partir de un `OrderSummary` ya calculado, y construye la URL `wa.me` final con el mensaje URL-encoded.

**Exports principales:**

- `WhatsAppOrderCustomer` — datos del cliente para el mensaje (`name`, `eventDate`, `timeSlot`, `address`, `notes`), todos opcionales.
- `WhatsAppOrderInput` — `{ customer, summary, snapshot? }`.
- `buildWhatsAppOrderMessage(input)` — arma el mensaje completo por secciones: saludo, "DATOS DEL CLIENTE" (solo si hay al menos un dato, y "Dirección" solo si `summary.delivery.requiresAddress`), "PEDIDO" (una entrada por línea de `summary.items`, con tratamiento especial para packs configurables — desglosa la composición por estilo — vs. líneas simples), "EXTRAS" (si hay), "RESUMEN" (unidades, litros si > 0, subtotal, extras, envío, subtotal, descuento si aplica, total, disclaimer de precios), y notas del cliente si las hay.
- `buildWhatsAppOrderUrl(phone, message)` — normaliza el teléfono a solo dígitos y valida formato internacional (`^[1-9]\d{7,14}$`, sin el `54` fijo que exige [[commercialSelectors]]/[[commercialSchemas]] — acá es más permisivo, cualquier E.164 genérico), y arma `https://wa.me/{phone}?text={encoded}`.

**Reglas de negocio / edge cases:**

- `buildWhatsAppOrderUrl` **lanza** si el teléfono no matchea el formato esperado o si el mensaje queda vacío tras `trim()` — a diferencia de [[promotionDiscount]], acá sí se prefiere fallar fuerte (no tiene sentido generar un link de WhatsApp roto).
- `splitItemName` es un fallback: si el ítem no tiene `productName`/`variantLabel`/`presentationLabel` explícitos (formato legado), intenta extraerlos parseando `item.name` por el separador `"—"` — mismo patrón defensivo que [[cartLineFormatting]].
- El bloque "Variante" del mensaje se omite explícitamente para `productCategory === "beer" | "pack"` — el nombre del producto ya es suficientemente descriptivo para esos casos, mostrar la variante sería redundante.
- Los packs configurables tienen su propio formato de línea (composición por estilo, total de porrones) completamente distinto al de una línea de producto simple — si se agrega un tipo de línea nuevo (otro tipo de pack, por ejemplo), este switch implícito (`if (item.pack?.type === ...)`) necesita un caso nuevo.
- El disclaimer de precios (`getPricingConfig(snapshot).disclaimer`) siempre se incluye al final del resumen, sea cual sea el snapshot pasado — refuerza que los precios son estimativos sujetos a confirmación.

**Dependencias clave:** `formatPrice` de [[format]]; `getPricingConfig` de [[commercialSelectors]]; `formatPromotionValue` de [[promotionDiscount]]; `OrderSummary` de [[orderSummary]]; `CommercialSnapshot` de `commercialTypes.ts`.

**Tests:** `whatsAppOrder.test.ts` (si existe) cubre este módulo — el formato exacto del mensaje es sensible a cambios accidentales (regresión visual en lo que recibe el negocio por WhatsApp).
