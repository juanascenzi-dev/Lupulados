---
tags: [domain, adapter]
related:
  [
    "[[adminContracts]]",
    "[[adminFormAdapters]]",
    "[[commercialData]]",
    "[[commercialRepositoryRows]]",
    "[[commercialSchemas]]",
  ]
---

# `commercialRepositoryMappers.ts`

**Propósito:** capa de mapeo bidireccional entre las filas crudas de Supabase (`snake_case`, tipos de [[commercialRepositoryRows]]) y los tipos de dominio (`camelCase`, `commercialTypes.ts`). Aísla el resto de la app del shape exacto de las tablas de Supabase.

**Exports principales:**

- `productFromRow`, `presentationFromRow`, `businessProfileFromRow`, `whatsappFromRow`, `deliveryFromRow`, `extraFromRow`, `promotionFromRow` — fila de Supabase → entidad de dominio, con defaults para columnas nullable (`description ?? ""`, `unit ?? "unidad"`, etc.).
- `snapshotFromRows(rows)` — arma un `CommercialSnapshot` completo a partir de todas las tablas: filtra productos/presentaciones/entregas/extras solo `active`, ordena por `sortOrder`, y filtra presentaciones cuyo producto padre no esté activo (evita presentaciones huérfanas). El perfil de negocio elegido es el primero con `active: true`, o el primero de la lista si ninguno lo está. Valida el resultado con `validateCommercialSnapshot`.
- `bySortOrder(a, b)` — comparador reusable por `sortOrder`.
- `productToRow`, `presentationToRow`, `businessProfilePatchToRow`, `whatsappToRow`, `deliveryToRow`, `extraToRow`, `promotionToRow` — entidad completa (para creación) → fila de Supabase.
- `*PatchToRow` (product/presentation/business/whatsapp/delivery/extra/promotion) — versión "parcial" para updates: usa `compact()` para omitir claves `undefined` (así un PATCH a Supabase no pisa columnas que el form no tocó).
- `compact(input)` — filtra las entradas de un objeto cuyo valor es `undefined`.

**Reglas de negocio / edge cases:**

- `promotionToRow`/`promotionPatchToRow` normalizan `code` a mayúsculas y sin espacios al borde (`trim().toUpperCase()`) antes de escribir a Supabase — mismo criterio de normalización que `adminPromotionFormSchema` en [[adminFormAdapters]] (ver el fix reciente de matcheo de código promocional).
- `presentationPatchToRow` traduce `active` (boolean de dominio) a `status: "active"|"archived"` (string de Supabase) solo si `active !== undefined`, para no pisar el status con `undefined` en un patch parcial.
- `snapshotFromRows` reutiliza `commercialSnapshot.pricingRules` (del snapshot estático de [[commercialData]]) — las reglas de pricing (ej. `freeGlassesThreshold`) **no vienen de Supabase**, siempre salen del snapshot hardcodeado.

**Dependencias clave:** `commercialSnapshot` de [[commercialData]] (para `pricingRules`); `validateCommercialSnapshot` de [[commercialSchemas]]; tipos de [[commercialRepositoryRows]] y `commercialTypes.ts`; tipos `Update*Input` de [[adminContracts]].

**Tests:** `commercialRepositoryMappers.test.ts` (si existe) cubre este módulo.
