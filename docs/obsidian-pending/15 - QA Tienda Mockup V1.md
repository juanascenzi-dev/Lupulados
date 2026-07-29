# 15 - QA Tienda Mockup V1

## Hallazgos producción

Resultado observado antes de la corrección:

- Todo: 8 resultados;
- Cervezas: 8 resultados;
- Bebidas alcohólicas: 0;
- Bebidas sin alcohol: 0;
- Combos y ofertas: 0;
- Accesorios y alquileres: 0.

`Ctrl + Shift + R` no modificaba el resultado.

## Causa raíz

`CommercialDataContext` tomaba el snapshot de Supabase cuando respondía con productos válidos. Como Supabase tenía solo 8 cervezas reales, `/tienda` perdía los 25 productos demo locales al usar `buildStoreCatalog(snapshot)`.

No requirió migración. No se modificó Supabase.

## Correcciones verificadas por tests

- catálogo combinado específico de tienda: 8 cervezas reales + 25 demos;
- categorías esperadas: alcohol 11, sin alcohol 7, combos 4, accesorios 3;
- sin duplicados de IDs;
- producto real tiene prioridad ante mismo ID;
- presentaciones sin duplicados;
- snapshot original no se muta;
- cotizador rápido no recibe categorías demo por el helper de tienda;
- etiquetas humanas de presentación;
- filtro conserva value técnico;
- imágenes válidas se cargan y fallbacks cubren ausencia/error;
- placeholder `example.com` no se usa como imagen válida;
- agregar incrementa cantidad y líneas equivalentes;
- otra presentación crea línea separada;
- feedback accesible al agregar;
- Radix Select reemplaza selects nativos de Tienda/checkout alcanzado.

## Armá tu pedido

- Pack Degustación permanece en Productos;
- muestra selector de cantidad;
- Agregar crea/incrementa línea;
- permite Agregar otro producto;
- conserva productos previos;
- Continuar avanza a Datos;
- resumen y WhatsApp incluyen cantidad, nombre y subtotal;
- no pide seleccionar estilo;
- Pack Porrones usa imagen si carga y fallback si falla.

## Validación ejecutada

- `git diff --check`: OK;
- `pnpm.cmd run typecheck`: OK;
- `.\node_modules\.bin\vitest.CMD run --configLoader runner`: 26 suites, 237 tests OK;
- `.\node_modules\.bin\vite.CMD build --config vite.config.ts --configLoader runner`: OK;
- preview temporal: `/` 200, `/tienda` 200, recarga directa `/tienda` 200;
- bundle inspeccionado con productos/categorías demo presentes.

## Pendiente manual

Probar en preview/producción:

1. entrar a Armá tu pedido;
2. seleccionar Pack Degustación;
3. presionar Siguiente;
4. elegir cantidad 2;
5. agregar;
6. confirmar mensaje visible;
7. presionar Agregar otro producto;
8. agregar Pack Porrones de otro estilo;
9. confirmar ambas líneas en carrito;
10. continuar con Datos;
11. revisar Ticket;
12. abrir WhatsApp sin enviar;
13. verificar imagen de Pack Porrones;
14. simular error de imagen y confirmar fallback.

Commit/push: pendiente de registrar en la entrega final.
