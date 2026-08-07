---
tags: [domain, repository]
related:
  [
    "[[adminContracts]]",
    "[[commercialData]]",
    "[[commercialRepositoryMappers]]",
    "[[supabaseRepositoryUtils]]",
  ]
---

# `commercialRepository.ts`

**Propósito:** define el contrato `CommercialRepository` (lectura pública del catálogo comercial) y sus dos implementaciones: `StaticCommercialRepository` (sirve el snapshot hardcodeado de [[commercialData]], usado como fallback/demo) y `SupabaseCommercialRepository` (persistencia real contra Supabase, implementa también `CommercialAdminRepository` de [[adminContracts]] para las mutaciones del panel admin).

**Exports principales:**

- `CommercialRepository` — interfaz de solo-lectura pública: `getCommercialSnapshot`, `getBusinessProfile`, `listWhatsAppChannels`, `listProducts`, `listProductPresentations`, `listDeliveryOptions`, `listExtraOptions`, `listPromotions`.
- `StaticCommercialRepository` — cada método devuelve un `structuredClone` del `commercialSnapshot` estático (clona para que el caller no pueda mutar el snapshot compartido por referencia).
- `SupabaseCommercialRepository` — implementación real: `getCommercialSnapshot` dispara las 7 queries de listado en paralelo y arma el snapshot con `snapshotFromRows`; el resto de los métodos de lectura son queries individuales; los métodos CRUD (`create*`/`update*`/`archive*`/`restore*` de cada entidad) usan `insertRow`/`updateRow` de [[supabaseRepositoryUtils]] junto a los mappers `*ToRow`/`*PatchToRow`/`*FromRow` de [[commercialRepositoryMappers]]; `listAuditLog(limit?)` consulta `admin_audit_log` ordenado por fecha descendente.
- Re-exporta tipos de fila (`*Row`) y funciones `*FromRow`/`snapshotFromRows` de [[commercialRepositoryMappers]] para que otros módulos no tengan que importar de ambos archivos.

**Reglas de negocio / edge cases:**

- `updateProduct` descarta explícitamente cualquier `id` que venga colado en el `input` (`const { id: _ignored, ...payload } = input`) antes de mapear a fila — evita que un update intente reescribir la PK.
- `archiveWhatsAppChannel` también fuerza `is_primary: false` — un canal archivado nunca puede quedar marcado como primario.
- `setPrimaryWhatsAppChannel` hace dos escrituras: primero desmarca `is_primary` en **todos los demás** canales (`neq("id", id)`), después marca `is_primary: true, active: true` en el elegido — no es atómico (dos queries separadas), así que en teoría hay una ventana de inconsistencia entre ambas si falla la segunda escritura.
- Todos los errores de Supabase que no pasan por `assertData` (usado solo en `listAuditLog`) se propagan como el error nativo del cliente Supabase — el catch/reporte a Sentry ocurre en las capas que llaman a este repository (hooks/contexts), no acá.

**Dependencias clave:** `snapshotFromRows` y demás mappers de [[commercialRepositoryMappers]]; `assertData`/`insertRow`/`selectRows`/`updateRow` de [[supabaseRepositoryUtils]]; `CommercialAdminRepository` y tipos `Create*Input`/`Update*Input` de [[adminContracts]]; `commercialSnapshot` de [[commercialData]] (solo para `StaticCommercialRepository`).

**Tests:** `commercialRepository.test.ts` (si existe) cubre este módulo.
