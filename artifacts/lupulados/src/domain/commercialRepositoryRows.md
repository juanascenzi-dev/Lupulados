# `commercialRepositoryRows.ts`

**Propósito:** define los tipos TypeScript de las filas crudas tal como las devuelve Supabase (`snake_case`, nullable donde la columna lo permite) para cada tabla comercial. Es el "contrato de columnas" que consumen los mappers de [[commercialRepositoryMappers]].

**Exports principales:**

- `ProductRow`, `PresentationRow`, `BusinessProfileRow`, `WhatsAppRow`, `DeliveryRow`, `ExtraRow`, `PromotionRow` — un tipo por tabla (`products`, `product_presentations`, `business_profiles`, `whatsapp_channels`, `delivery_options`, `extra_options`, `promotions`).
- `AdminAuditLogEntry` — fila de `admin_audit_log` ya en camelCase (no tiene un "Row" separado porque no pasa por un mapper propio; se mapea inline en `SupabaseCommercialRepository.listAuditLog`).

**Reglas de negocio / edge cases:**

- Puramente tipos, sin lógica: sirve como single source of truth de qué columnas espera cada tabla, para que un cambio de schema en Supabase se detecte en compile-time (typecheck) en los mappers/repository, no en runtime.
- `PromotionRow` usa `promotion_type` como nombre de columna (no `type`) — evita colisión con la palabra reservada `type` en SQL/algunos ORMs; el mapeo a `Promotion.type` en dominio ocurre en `promotionFromRow`.

**Dependencias clave:** tipos de `commercialTypes.ts` (para los campos que son unions/enums compartidos, ej. `presentation_type`, `purpose`, `pricing_status`).

**Tests:** no aplica (sin lógica ejecutable).
