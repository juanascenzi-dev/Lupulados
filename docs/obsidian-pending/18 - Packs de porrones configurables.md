# 18 - Packs de porrones configurables

Fecha: 2026-07-29.
Estado: implementado en workspace, pendiente de prueba manual final.

## Objetivo

Pack Porrones pasa a representar un pack configurable de 6 porrones. El usuario puede definir varios packs en una sola pantalla, configurar composiciones distintas, y agregarlos todos al carrito compartido en una sola operacion.

## Logica funcional

- Flujo Armá tu pedido: seleccionar Pack Porrones abre directamente el configurador, sin elegir un unico estilo.
- Flujo tienda: la card Pack de porrones x6 usa el mismo componente y el boton dice Personalizar pack.
- Cada pack tiene capacidad fija de 6 porrones.
- Cantidad de packs: minimo 1, maximo 12. Se eligio 12 para mantener el mockup usable en desktop y mobile sin listas excesivas.
- Al aumentar packs se conservan los existentes y se agregan vacios.
- Al reducir, si se descartan packs con seleccion, se pide confirmacion accesible.
- Acciones secundarias: copiar composicion anterior, usar composicion actual en todos, vaciar pack.

## Estructura de datos

Modulo: `artifacts/lupulados/src/domain/configurableBeerPack.ts`.

Conceptos:

- `PackSelection`: `productId`, `quantity`, `name` opcional para render/WhatsApp.
- `PackDraft`: estado editable por pack.
- `ConfigurablePackComposition`: tipo, version, capacidad y selecciones.
- `PackLineMetadata`: metadata persistida en carrito.

La composicion se guarda estructurada; no se guarda solo texto concatenado.

## Identidad de lineas

La clave canonica:

- incluye tipo `configurable-beer-pack`;
- incluye version;
- incluye capacidad;
- ordena por `productId`;
- ignora cantidades cero;
- no usa indices;
- no usa fecha/hora;
- no depende del texto visible;
- no incluye precio.

Packs identicos se agrupan en una linea con `qty` igual a cantidad de packs. Packs distintos crean lineas distintas.

## Precio

El precio unitario del pack es la suma de los precios activos de los 6 porrones 500 ml elegidos. No se invento precio fijo ni descuento automatico. El total general suma los precios unitarios por cantidad de packs agrupados.

## Carrito

La cantidad de la linea representa packs, no botellas. Se muestra composicion, precio por pack, subtotal y total de porrones derivado como `qty * 6`. Las acciones existentes de sumar, restar, editar cantidad, eliminar y vaciar siguen usando el carrito compartido.

Limitacion: no se implemento editar composicion de una linea ya agregada. La opcion minima es eliminar la linea y volver a configurar.

## Persistencia

`cartStorage` conserva `version: 3` y agrega campos opcionales. Carts viejos siguen cargando. Una linea de pack configurable invalida se descarta sin romper el resto del carrito. La reconciliacion reconstruye precio/nombre/composicion desde el snapshot activo y descarta estilos sin porron activo o precio valido.

## WhatsApp

El mensaje resume por linea de pack:

- cantidad de packs;
- composicion por pack;
- total de porrones;
- precio por pack;
- subtotal.

No expone `productId`, `presentationId`, claves canonicas, JSON, `undefined`, `null`, `NaN` ni metadata tecnica.

## Accesibilidad

- Botones reales para sumar/restar.
- `aria-label` con pack y estilo.
- `role=status` para progreso.
- `role=alert` para errores.
- Dialogo accesible Radix para confirmar descartes/sobrescrituras.
- Escape cierra dialogs de tienda y checkout.
- Foco restaurado al cerrar desde tienda.
- Controles tactiles y layout responsive.

## Tests

Se agrego `configurableBeerPack.test.ts` y casos en `cartStorage.test.ts`, `whatsAppOrder.test.ts` y `storeCatalog.test.ts`.

Cobertura principal:

- capacidad 6;
- normalizacion;
- no superar 6;
- no negativos;
- clave canonica estable;
- copia independiente;
- resize con confirmacion;
- precios mixtos;
- exclusion de estilos sin porron activo;
- agrupacion de packs identicos;
- persistencia;
- reconciliacion;
- WhatsApp;
- integracion estructural con Armá tu pedido y tienda.

## Limitaciones

- No hay edicion in-place de composicion desde el carrito.
- El draft del configurador no persiste antes de agregar al carrito.
- La validacion visual mobile queda pendiente de prueba manual en preview.

## Commit y push

Commit funcional:

- `0135d52465a24d7c3801dc267db2f13a83e5764a` - `feat: add configurable multi-pack beer builder`

Push:

- `main` fue empujada a `origin/main`.
- Verificacion posterior: `main` y `origin/main` quedaron sincronizados en `0135d52465a24d7c3801dc267db2f13a83e5764a`.

## Prueba manual pendiente

En preview:

1. Abrir Armá tu pedido.
2. Seleccionar Pack Porrones.
3. Configurar 3 packs.
4. Completar Pack 1 mixto.
5. Completar Pack 2 de un solo estilo.
6. Copiar Pack 2 a Pack 3 y modificarlo.
7. Agregar los tres.
8. Verificar agrupacion.
9. Recargar.
10. Verificar persistencia.
11. Abrir checkout.
12. Preparar WhatsApp sin enviar.
