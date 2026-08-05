# `adminDashboardHelpers.ts`

**Propósito:** helpers de UI-adjacent (filtrado, formateo, confirmación) usados por el dashboard del panel admin (`AdminDashboard.tsx`), separados del componente para poder testearlos sin renderizar React.

**Exports principales:**

- `AdminTab` — union de las pestañas del dashboard (`summary`, `products`, `presentations`, `business`, `whatsapp`, `delivery`, `extras`, `promotions`, `activity`).
- `StatusFilter` — `"all" | "active" | "archived"`.
- `emptyAdminData` — `AdminCommercialData` vacío, usado como estado inicial antes de la primera carga.
- `tabs` — lista ordenada `{ id: AdminTab; label: string }` para renderizar el menú de pestañas.
- `matchesProductSearch(product, search)` — filtro case-insensitive por nombre o ID; string vacío matchea todo.
- `matchesStatus(active, filter)` — filtro de estado activo/archivado según `StatusFilter`.
- `confirmArchive(label)` — wrapper de `window.confirm` para confirmar archivar/desactivar una entidad (deja el diálogo nativo mockeable en tests).
- `formatArgentinaDate(value)` — formatea un ISO date string a fecha/hora corta en zona horaria `America/Argentina/Buenos_Aires`.

**Reglas de negocio / edge cases:**

- `matchesProductSearch` compara contra `product.name` y `product.id`, no otros campos (ej. `slug`, `description`).
- `confirmArchive` depende de `window.confirm`, por lo que solo tiene sentido en contexto de browser/jsdom (se mockea en tests de componentes).

**Dependencias clave:** `AdminCommercialData` de [[adminDataLoader]], `Product` de `commercialTypes.ts`.

**Tests:** no existe `adminDashboardHelpers.test.ts` en el momento de este doc (se ejercita indirectamente vía tests de `AdminDashboard.tsx`).
