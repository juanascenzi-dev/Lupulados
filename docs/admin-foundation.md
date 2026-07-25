# Lupulados Admin Foundation

## 1. Fuente de datos actual

La fuente canónica estática es `artifacts/lupulados/src/domain/commercialData.ts`.

Ese archivo exporta `commercialSnapshot`, validado al cargar con Zod mediante `commercialSnapshotSchema`. La aplicación pública consume datos a través de selectores de `commercialSelectors.ts` o adaptadores de compatibilidad como `beerCatalog.ts` y `businessConfig.ts`.

## 2. Entidades y relaciones

- `BusinessProfile`: nombre comercial, dirección, horario, email nullable, estado de precios y disclaimer.
- `WhatsAppChannel`: canales públicos con número visible, número para enlaces, propósito, prioridad, actividad y orden.
- `Product`: productos con ID estable, slug, datos visibles, imagen, estado y orden.
- `ProductPresentation`: presentaciones asociadas a `Product` por `productId`, con tipo, volumen, precio, actividad y orden.
- `DeliveryOption`: modalidad de entrega/retiro, precio, si requiere dirección y orden.
- `ExtraOption`: extras cobrables del pedido.
- `Promotion`: promociones con código, tipo, valor, actividad y fechas opcionales.

## 3. IDs estables

Los productos mantienen los IDs usados por el carrito: `blonde-ale`, `apa`, `ipa`, `red-ale`, `stout`, `honey-wheat`, `session-ipa`, `scotch-ale`.

Las presentaciones conservan el tipo usado en los IDs del carrito: `barril20L`, `barril30L`, `barril50L`, `growler1L`, `growler2L`, `porron500ml`. Para el futuro CRUD, cada presentación tiene además un ID completo estable con formato `productId:presentationType`, por ejemplo `ipa:barril50L`.

Cambiar un nombre visible, por ejemplo `IPA` a `IPA Lupulados`, no debe cambiar el ID del producto ni invalidar carritos guardados.

## 4. Soft delete

El modelo no borra físicamente registros administrables:

- `Product.status`: `active` o `archived`.
- `ProductPresentation.active`: `true` o `false`.
- Canales, entrega, extras y promociones usan `active`.

Los selectores públicos excluyen productos archivados y presentaciones inactivas. En el ADMIN futuro el botón puede decir "Eliminar", pero la operación esperada es archivar.

## 5. Datos públicos

Datos confirmados cargados:

- Nombre: Lupulados.
- Dirección: Primera Junta 2614.
- Horario: Atención las 24 horas, todos los días.
- WhatsApp principal: 11 3397-1210, enlace `5491133971210`.
- WhatsApp alternativo: 11 6546-0294, enlace `5491165460294`.
- Email: `null`.

No hay email público ficticio.

## 6. Datos administrables

Quedan modelados como administrables:

- Perfil comercial.
- Canales de WhatsApp.
- Productos.
- Presentaciones.
- Opciones de entrega.
- Extras.
- Promociones.
- Estado de precios y disclaimer.
- Orden de visualización.
- Estado activo o archivado.

## 7. Contratos de repositorio

`artifacts/lupulados/src/domain/adminContracts.ts` define contratos TypeScript para:

- Productos: listar, obtener, crear, actualizar, archivar y restaurar.
- Presentaciones: crear, actualizar, archivar y restaurar.
- Perfil comercial: obtener y actualizar.
- WhatsApp: listar, crear, actualizar, archivar y definir principal.
- Entrega, extras y promociones: listar, crear, actualizar, archivar y restaurar.

En Sprint 5 no hay implementación mutable ni persistencia en localStorage.

## 8. Qué falta para Supabase

Sprint 6 debe crear o conectar el proyecto Supabase, definir tablas reales, revisar migraciones, cargar datos iniciales desde el snapshot estático e integrar el frontend público con la base.

## 9. Qué falta para el usuario ADMIN

Sprint 6 debe implementar Supabase Auth, usuario ADMIN, roles, login, ruta protegida y CRUD visual para productos, presentaciones, configuración comercial, canales, entrega, extras y promociones.

## 10. Seguridad esperada

La administración debe quedar protegida con Auth y RLS. No se deben exponer tokens, service role keys ni credenciales en frontend. Las operaciones administrativas deben ejecutarse con permisos mínimos y validaciones compartidas.

## 11. Migración futura

La migración esperada es:

1. Crear tablas equivalentes a las entidades del snapshot.
2. Insertar los datos actuales preservando IDs.
3. Implementar un repositorio Supabase que cumpla los contratos.
4. Mantener los selectores públicos como capa estable.
5. Reemplazar el proveedor estático sin cambiar componentes públicos.

## 12. Compatibilidad de carritos

Los carritos existentes usan IDs como `ipa:barril50L`. Por eso:

- No se cambian IDs de productos existentes.
- No se cambian tipos de presentación existentes.
- Los nombres visibles no son identidad.
- Si en el futuro se renombra un producto o presentación, debe conservarse el ID.
- Si alguna vez se necesita cambiar un ID, debe agregarse una migración de carrito explícita antes del deploy.

## Sprint 6 delimitado

No forma parte de Sprint 5 y queda para Sprint 6:

- creación o conexión de proyecto Supabase;
- tablas reales;
- migraciones revisadas;
- Supabase Auth;
- usuario ADMIN;
- roles;
- RLS;
- login;
- ruta protegida;
- CRUD de productos;
- CRUD de presentaciones;
- configuración comercial;
- auditoría;
- integración del frontend público con la base.
