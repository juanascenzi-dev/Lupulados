# 16 - Logica comercial de precios y promociones

Fecha: 2026-07-29.
Estado: implementada para mockup.

## Modelo

Campos opcionales agregados a presentaciones:

- `comparisonGroup`
- `comparisonQuantity`
- `comparisonUnit`
- `unitsPerPresentation`
- `compareAtPrice`
- `promotional`
- `promotionLabel`

Son opcionales para que snapshots de Supabase sin estos campos sigan validando.

## Regla base

Dentro de cada `comparisonGroup`:

- se ordena por `comparisonQuantity`;
- la menor cantidad es la base;
- `precioEfectivo = unitPrice / comparisonQuantity`;
- `costoReferencia = precioEfectivoBase * comparisonQuantityActual`;
- `ahorro = costoReferencia - unitPriceActual`;
- `porcentaje = ahorro / costoReferencia`.

Solo se muestra ahorro si es positivo. `compareAtPrice` se usa solo cuando `promotional` es true.

## Alcance

La logica vive en `src/domain/storePricing.ts` y se consume desde `storeCatalog` y `StorePage`. No se modificaron precios reales de cerveza; solo se agregaron metadatos comparativos a sus presentaciones.

