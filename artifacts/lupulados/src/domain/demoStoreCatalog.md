# `demoStoreCatalog.ts`

**Propósito:** transforma los datos crudos de [[demoStoreCatalogData]] en `Product[]`/`ProductPresentation[]` con la forma final que espera `commercialSnapshot` (genera `id` de presentación, asigna `active: true`, resuelve la imagen, y agrega metadata de comparación de precios por producto/presentación).

**Exports principales:**

- `demoStoreProducts` — `demoProductsInput` mapeado a `Product[]`: quita el campo `presentations` embebido, agrega `image` (de `demoProductImages`, o `""` si falta) y `status: "active"`.
- `demoStorePresentations` — todas las presentaciones de todos los productos demo, aplanadas (`flatMap`) a `ProductPresentation[]`: `id` = `${productId}:${presentationType}`, `productId`, `active: true`, más los campos de `getDemoPresentationCommercialFields`.

**Reglas de negocio / edge cases:**

- `getDemoPresentationCommercialFields` (no exportada) tiene una cascada de casos especiales **hardcodeados por `productId`** (vino Malbec, cola, tónica, y los 4 combos) que asignan `comparisonGroup`/`compareAtPrice`/`promotional`/`promotionLabel` a mano — no es una regla genérica, es contenido curado producto por producto. Para productos sin caso especial, cae a reglas genéricas por `presentationType` (`750ml` → botella; `1l`/`1-5l`/`2l` → por litro; cualquier otro → `unidad`).
- Los combos (`demo-combo-*`) tienen `compareAtPrice` fijo (precio "tachado" de referencia) y `promotional: true` hardcodeados — simulan una oferta, no se derivan de ningún cálculo real de descuento.
- Este archivo solo se consume en [[commercialData]] (para completar el snapshot estático con productos demo además de los de cerveza reales) — no participa en el flujo de Supabase.

**Dependencias clave:** `demoProductImages`, `demoProductsInput` de [[demoStoreCatalogData]]; tipos de `commercialTypes.ts`.

**Tests:** `demoStoreCatalog.test.ts` (si existe) cubre este módulo.
