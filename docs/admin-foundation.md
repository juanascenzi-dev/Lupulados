# Lupulados Admin Foundation

## Arquitectura

Sprint 6 agrega Supabase como fuente persistente para datos comerciales y mantiene `artifacts/lupulados/src/domain/commercialData.ts` como fallback estático seguro.

Capas principales:

- `src/lib/supabase/config.ts`: parsea `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` y compatibilidad temporal con `VITE_SUPABASE_ANON_KEY`.
- `src/lib/supabase/client.ts`: inicializa un único cliente Supabase nullable, sin service role.
- `src/domain/commercialRepository.ts`: `StaticCommercialRepository`, `SupabaseCommercialRepository`, filas Supabase y mappers puros.
- `src/context/CommercialDataContext.tsx`: carga snapshot desde Supabase y cae a estático si no hay configuración, error, datos vacíos o datos inválidos.
- `src/context/AdminAuthContext.tsx`: sesión Supabase Auth y autorización vía `public.is_admin()`.
- `/admin/login`: login administrativo con `signInWithPassword`.
- `/admin`: panel protegido con módulos comerciales.

## Entidades persistentes

La migración `supabase/migrations/20260725120000_commercial_admin_foundation.sql` crea:

- `public.business_profiles`
- `public.whatsapp_channels`
- `public.products`
- `public.product_presentations`
- `public.delivery_options`
- `public.extra_options`
- `public.promotions`
- `public.admin_users`
- `public.admin_audit_log`

## Seguridad

Todas las tablas públicas del sprint tienen RLS habilitado.

Lectura pública:

- perfiles activos;
- WhatsApp activos;
- productos `status = 'active'`;
- presentaciones `status = 'active'`;
- entregas activas;
- extras activos;
- promociones activas y vigentes.

Escritura administrativa:

- depende de `public.is_admin()`;
- usa la sesión del usuario autenticado;
- no usa service role en frontend;
- no permite administrar `admin_users` desde el panel;
- no borra productos ni presentaciones físicamente, sólo archiva.

## Auditoría

La función `public.write_admin_audit_log()` registra INSERT/UPDATE/DELETE de:

- `business_profiles`;
- `whatsapp_channels`;
- `products`;
- `product_presentations`;
- `delivery_options`;
- `extra_options`;
- `promotions`.

Registra actor `auth.uid()`, tabla, registro, operación, `old_data`, `new_data` y fecha.

## Fallback público

Prioridad de datos:

1. Supabase configurado y snapshot válido: usa Supabase.
2. Supabase sin configurar: usa snapshot estático.
3. Supabase inaccesible: usa snapshot estático.
4. Supabase con datos inválidos o vacíos: usa snapshot estático.

En desarrollo se emite un warning controlado cuando se usa fallback por error técnico. El visitante no ve errores de infraestructura.

## Compatibilidad de carrito

Se conservan IDs de productos y presentaciones:

- productos: `blonde-ale`, `apa`, `ipa`, `red-ale`, `stout`, `honey-wheat`, `session-ipa`, `scotch-ale`;
- presentaciones: `barril20L`, `barril30L`, `barril50L`, `growler1L`, `growler2L`, `porron500ml`.

Los carritos guardados siguen leyendo `CartItem` desde localStorage sin recalcular ni renombrar items existentes.

## Sprint 7

Pedidos persistentes quedan fuera de Sprint 6. Próximo paso recomendado:

- tabla de pedidos;
- tabla de líneas de pedido;
- estados operativos;
- auditoría de cambios de pedido;
- vista ADMIN específica para gestión de pedidos.
