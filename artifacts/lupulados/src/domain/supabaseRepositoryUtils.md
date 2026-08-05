# `supabaseRepositoryUtils.ts`

**Propósito:** helpers genéricos y mínimos para hablar con Supabase desde `SupabaseCommercialRepository` de [[commercialRepository]]: aserción de respuesta sin error, y wrappers de select/insert/update por tabla con ordenamiento/manejo de errores consistente.

**Exports principales:**

- `SupabaseResponse<T>` — `{ data: T | null; error: { message: string } | null }`, shape mínimo que necesitan estos helpers del cliente de Supabase.
- `assertData(response, action)` — lanza `Error("${action}: ${error.message}")` si `response.error` está presente, o `Error("${action}: respuesta vacia")` si `data` es `null`; si no, devuelve `data` ya no-nulo.
- `selectRows<T>(client, table, order)` — `SELECT * FROM table ORDER BY order ASC`, devuelve `T[]` vía `assertData`.
- `insertRow<T>(client, table, payload)` — `INSERT ... RETURNING *` con `.single()` (una sola fila esperada).
- `updateRow<T>(client, table, id, payload)` — `UPDATE ... WHERE id = $id RETURNING *` con `.single()`.

**Reglas de negocio / edge cases:**

- Los mensajes de error de `assertData` están en español y siguen el patrón `"<acción>: <detalle>"` (ej. `"leer products: ..."`, `"crear promotions: ..."`) — cualquier nuevo call site debería seguir el mismo estilo de `action` para mantener consistencia en los logs/errores.
- `insertRow`/`updateRow` asumen que la tabla tiene una columna `id` para el `WHERE`/filtro de retorno y que la operación afecta exactamente una fila (`.single()` falla si la query devuelve 0 o más de 1 filas).
- Este archivo no reporta a Sentry directamente (`reportError`) — los errores que lanza se propagan hacia arriba y es responsabilidad del caller (hooks del panel admin, `useAdminDashboardData`) capturarlos y reportarlos según la política de logging del proyecto.

**Dependencias clave:** `SupabaseClient` de `@supabase/supabase-js`.

**Tests:** `supabaseRepositoryUtils.test.ts` (si existe) cubre este módulo.
