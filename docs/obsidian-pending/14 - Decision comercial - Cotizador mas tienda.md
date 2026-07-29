# Decision comercial - Cotizador mas tienda

## Actualizacion sprint comercial - 2026-07-29

Decision complementaria aceptada para mockup: la tienda deja de comportarse solo como catalogo tecnico y suma argumentos de venta en la card.

Regla aprobada para comparacion:

- comparar solo presentaciones con `comparisonGroup` compartido;
- ordenar por `comparisonQuantity`;
- usar la presentacion mas chica del grupo como base;
- calcular precio efectivo sin redondeo interno;
- mostrar ahorro solo cuando sea positivo;
- permitir que la mejor presentacion por unidad sea chica o grande segun datos reales;
- usar `compareAtPrice` solo para promociones explicitas.

Los campos nuevos son opcionales para mantener compatibilidad con snapshots viejos de Supabase.

