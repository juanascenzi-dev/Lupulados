---
tags: [domain, context-logic]
related: ["[[commercialRepository]]"]
---

# `adminDataLoader.ts`

**Propósito:** orquesta la carga inicial de todos los datos comerciales que necesita el panel admin, y coordina el flujo de "mutación admin → refrescar datos admin → refrescar snapshot público" evitando mutaciones concurrentes.

**Exports principales:**

- `AdminCommercialData` — shape agregado con products, presentations, deliveryOptions, extraOptions, promotions, whatsappChannels.
- `loadAdminCommercialData(repository)` — dispara las 6 llamadas de listado en paralelo (`Promise.all`) contra un `CommercialRepository` y arma el objeto agregado.
- `refreshAfterAdminMutation(repository, refreshPublicSnapshot)` — después de una mutación admin, vuelve a cargar `AdminCommercialData` y además invoca `refreshPublicSnapshot` (para que el storefront público vea los cambios sin recargar la página).
- `runSingleAdminMutation(lock, setBusy, action)` — helper genérico de mutex: si `lock.current` ya está en `true`, no ejecuta `action` y devuelve `{ ok: false }` (evita doble-submit); si no, marca `lock`/`setBusy`, corre `action`, y garantiza el release en `finally` incluso si `action` lanza.

**Reglas de negocio / edge cases:**

- `runSingleAdminMutation` no encola la segunda invocación: la descarta silenciosamente (`ok: false`) en vez de esperar a que termine la primera. El caller decide qué hacer con `ok: false` (típicamente, no hacer nada porque el botón ya estaba disabled por `setBusy`).
- El `lock` se pasa por referencia mutable (`{ current: boolean }`) en vez de useState, porque el chequeo debe ser síncrono (evitar carreras entre el check y el set que un `useState` no garantiza dentro del mismo tick).

**Dependencias clave:** `CommercialRepository` de [[commercialRepository]] (contrato de las funciones `list*`); tipos de `commercialTypes.ts`.

**Tests:** no existe `adminDataLoader.test.ts` en el momento de este doc.
