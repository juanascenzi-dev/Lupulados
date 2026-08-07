---
tags: [domain, schema]
related: []
---

# `adminContracts.ts`

**Propósito:** define los tipos de input (create/update) y las interfaces de repositorio que debe implementar cualquier fuente de datos del panel admin (hoy: Supabase, ver `commercialRepository.ts`). Es el contrato entre la UI admin y la capa de persistencia, sin acoplarse a Supabase.

**Exports principales:**

- `Create*Input` / `Update*Input` por entidad (`Product`, `Presentation`, `BusinessProfile`, `WhatsAppChannel`, `DeliveryOption`, `ExtraOption`, `Promotion`) — derivan con `Omit`/`Partial` de los tipos de dominio en `commercialTypes.ts`, ajustando qué campos son obligatorios al crear vs. opcionales al actualizar.
- `ProductAdminRepository`, `PresentationAdminRepository`, `BusinessProfileAdminRepository`, `WhatsAppAdminRepository`, `DeliveryAdminRepository`, `ExtraAdminRepository`, `PromotionAdminRepository` — interfaces CRUD por entidad (list/get/create/update/archive/restore, con variantes como `setPrimaryWhatsAppChannel`).
- `CommercialAdminRepository` — unión de todas las interfaces anteriores; es lo que implementa `commercialRepository.ts` y lo que consumen los hooks/páginas admin.

**Reglas de negocio / edge cases:**

- Los `Create*Input` fuerzan `id` como string obligatorio (los IDs se generan/asignan en el form, no en la base) salvo `CreateDeliveryOptionInput`/`CreateExtraOptionInput`, que no incluyen `id` en el `Omit` (se infiere de otra forma en su flujo de creación).
- `UpdateProductInput` sobreescribe `abv`/`ibu`/`badge` para aceptar explícitamente `null` (borrar el valor) además de `number`/`string`/`undefined`.
- Es un archivo de solo tipos/interfaces: no tiene lógica runtime, por lo que no aplica el gate de cobertura de tests aunque viva en `src/domain`.

**Dependencias clave:** tipos de `commercialTypes.ts` (fuente de verdad de las entidades de dominio).

**Tests:** no aplica (sin lógica ejecutable).
