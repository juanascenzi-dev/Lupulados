# `cartLineFormatting.ts`

**Propósito:** deriva textos legibles para mostrar un ítem del carrito (título, "cerveza"/tipo, presentación, descripción compacta) a partir de los campos crudos de un `CartItemDraft`/`StoredCartItem`, con fallbacks para ítems legados que no tienen todos los campos nuevos poblados.

**Exports principales:**

- `getCartLineTitle(item)` — título principal: `productName` si existe (o `name` para packs), si no cae a `beerName`/`name`.
- `getCartLineBeer(item)` — subtítulo de "tipo de bebida": si es un `productCategory` no-cerveza conocido (`PRODUCT_CATEGORY_LABELS`), usa la etiqueta de esa categoría (o `variantLabel` si difiere del nombre de producto); si es un pack no muestra nada; si es cerveza, intenta `beerName`/`productName` y como último recurso parsea el prefijo de `name` antes del separador `—`.
- `getCartLinePresentation(item)` — la presentación (ej. "Barril 20L"): usa `presentationLabel` si existe, o parsea el sufijo de `name` después de `—`.
- `getCompactCartLineDescription(item)` — descripción de una línea para vistas compactas (resumen de checkout): trata especialmente los packs configurables (`pack.type === "configurable-beer-pack"`, cuenta porrones y estilos), el pack degustación fijo, y cae en cascada a `presentationLabel` → `variantLabel` → `getCartLinePresentation` → `category`.
- `getPresentationDetails(presentation)` — arma una lista de strings descriptivos de una `ProductPresentation` (descripción, volumen en litros si > 0, tipo de presentación si difiere del label), filtrando los `null`/falsy.

**Reglas de negocio / edge cases:**

- Todas las funciones están diseñadas para tolerar campos legados/faltantes (parsean `name` con el separador `" — "` como fallback) — reflejan que el carrito persiste ítems de distintas versiones del schema (ver `cartStorage.ts` y su manejo de mojibake/legacy).
- `getCartLineBeer` devuelve `null` explícitamente para packs (no tiene sentido mostrar "tipo de bebida" en un pack).

**Dependencias clave:** `PRODUCT_CATEGORY_LABELS` de [[productCatalog]]; `ProductPresentation` de `commercialTypes.ts`.

**Tests:** `cartLineFormatting.test.ts` (si existe) cubre este módulo.
