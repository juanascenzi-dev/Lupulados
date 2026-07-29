# 13 - Tienda Mockup V1

## Actualizacion sprint comercial - 2026-07-29

Se agrego una capa comercial a `/tienda` sin reemplazar carrito, checkout ni WhatsApp:

- 25 productos demo ahora referencian imagen local en `public/store`.
- Los cuatro combos demo tienen imagen propia.
- `ProductVisual` conserva fallback tecnico ante error de carga.
- Las cards muestran precio total, precio efectivo por unidad/litro, referencia y ahorro cuando aplica.
- Las promociones explicitas usan badge `Promo demo`, precio anterior/valor separado y ahorro.
- Se agregaron filtros de promociones, ahorro por volumen y rango por `priceFrom`.
- Se agrego ordenamiento por recomendados, precio, ahorro y nombre.
- El carrito conserva el `unitPrice` actual como precio cobrado y solo agrega badge promocional opcional.

No hubo cambios en Supabase, migraciones ni dependencias.
