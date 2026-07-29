# 13 - Tienda Mockup V1

## QA producción - corrección posterior

Problema detectado: en producción `/tienda` mostraba solo 8 productos, todos cervezas reales. Las categorías demo quedaban vacías porque `CommercialDataContext` reemplazaba el snapshot estático por el snapshot válido de Supabase, y `StorePage` construía el catálogo únicamente con `buildStoreCatalog(snapshot)`.

Causa raíz confirmada: Supabase devuelve los 8 productos reales de cerveza, pero no contiene los 25 productos demo locales. No se requirió migración ni cambios en Supabase.

Corrección aplicada:

- composición específica para tienda con snapshot real + catálogo demo local;
- prioridad para productos reales cuando el ID coincide;
- deduplicación de productos y presentaciones;
- demos conservan indicador `demo`;
- carrito y checkout siguen compartidos;
- carrito reconciliado contra snapshot combinado para que líneas demo persistidas sobrevivan al navegar fuera de `/tienda`;
- cotizador rápido y administrador siguen usando el snapshot activo normal.

Imágenes:

- `ProductVisual` muestra `product.image` válida con `alt`, `aspect-ratio` y `object-cover`;
- si falta, está vacía o falla carga, muestra fallback por categoría;
- el placeholder `https://example.com/lupulados-demo-placeholder` dejó de usarse como imagen cargable.

Selects:

- filtros de subcategoría y presentación migrados a Radix Select existente;
- selector de presentación por producto migrado a Radix Select;
- selects del checkout compartido de Tienda migrados a Radix Select;
- estilos oscuros, foco ámbar, menú oscuro y chevrón separado.

Presentaciones:

- opciones usan `value` técnico estable y etiqueta humana visible;
- ejemplos: `barril20L` -> `Barril 20 L`, `porron500ml` -> `Porrón 500 ml`, `750ml` -> `Botella 750 ml`.

Feedback al agregar:

- botón cambia temporalmente a `Agregado`;
- mensaje accesible con `role="status"` y `aria-live="polite"`;
- muestra producto, presentación y cantidad cuando corresponde;
- no abre el carrito automáticamente.

Armá tu pedido:

- Pack Degustación ya no se agrega silenciosamente ni salta a Datos;
- ahora muestra cantidad, contenido, precio y subtotal;
- requiere Agregar al pedido explícito;
- permite Agregar otro producto o Continuar con los datos;
- repetir el pack incrementa la línea existente;
- Pack Porrones y demás cards de tipo tienen fallback visual si la imagen falla.

Validación:

- `git diff --check`: OK;
- `pnpm.cmd run typecheck`: OK;
- `vitest run --configLoader runner`: 26 suites, 237 tests OK;
- `vite build --config vite.config.ts --configLoader runner`: OK;
- smoke HTTP preview: `/` 200, `/tienda` 200, recarga directa `/tienda` 200.

Commit/push: pendiente de registrar en la entrega final.

Prueba manual pendiente: revisar en producción/preview el flujo completo de Tienda y Armá tu pedido, incluyendo WhatsApp sin enviar.
