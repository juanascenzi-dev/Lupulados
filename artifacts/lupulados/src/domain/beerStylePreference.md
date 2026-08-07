---
tags: [domain, context-logic]
related: ["[[beerCatalog]]"]
---

# `beerStylePreference.ts`

**Propósito:** maneja la selección de estilos de cerveza preferidos del usuario en el wizard de pedido (multi-select), garantizando que la selección quede siempre sincronizada con el catálogo vigente.

**Exports principales:**

- `normalizeBeerStyleSelection(selectedIds, catalog)` — filtra `selectedIds` para quedarse solo con IDs que existen en `catalog` y sin duplicados, preservando el orden de aparición.
- `toggleBeerStyleSelection(selectedIds, beerId, catalog)` — normaliza primero, y luego agrega o quita `beerId` (toggle); si `beerId` no está en `catalog`, no hace nada (devuelve la lista normalizada sin cambios).
- `summarizeBeerStyleSelection(selectedIds, catalog)` — texto para UI: `"Cualquiera"` si no hay selección, el nombre de la cerveza si hay una sola, o `"N estilos seleccionados"` si hay más de una.

**Reglas de negocio / edge cases:**

- La normalización es defensiva: si el catálogo cambió (ej. un producto se archivó) y `selectedIds` quedó con un ID viejo, se descarta silenciosamente en vez de romper la UI.
- `toggleBeerStyleSelection` sobre un `beerId` inexistente en el catálogo es un no-op explícito (protección contra clicks en catálogo stale).

**Dependencias clave:** `Beer` de [[beerCatalog]].

**Tests:** `beerStylePreference.test.ts` (si existe) cubre este módulo.
