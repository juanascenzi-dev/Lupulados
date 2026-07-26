# Operaciones Supabase

## Migraciones

Las migraciones viven en:

```txt
supabase/migrations/
```

Aplicar localmente:

```bash
supabase db reset
```

Aplicar remoto sólo si se verificó inequívocamente que el proyecto es Lupulados:

```bash
supabase projects list
supabase status
supabase migration list
supabase db push
```

No usar `db reset` contra remoto. No aplicar migraciones si el proyecto pertenece a Prode Mundial 2026 o contiene datos ajenos a Lupulados.

## Seed

El seed inicial está en:

```txt
supabase/seed.sql
```

Refleja el snapshot comercial actual: perfil, ambos WhatsApp, catálogo, presentaciones, precios, entrega, extras y promoción `PRIMERABIRRA`.

No crea usuarios ADMIN.

## Data API

La migración incluye `GRANT` explícitos para `anon` y `authenticated` porque proyectos nuevos de Supabase pueden no exponer tablas automáticamente a la Data API. RLS sigue siendo la autorización por filas.

## Rotación de claves

1. Rotar claves en Supabase Dashboard.
2. Actualizar `VITE_SUPABASE_PUBLISHABLE_KEY` en el entorno del frontend.
3. Redeploy normal por pipeline.
4. Confirmar que el sitio público carga; si falla, usa fallback estático.

Nunca publicar service role en variables `VITE_`.

## Rollback

No editar migraciones ya aplicadas. Para rollback, crear una nueva migración que revierta el cambio de forma aditiva y revisable.

## Fallback estático

Para recuperar operación pública sin Supabase:

1. Quitar o dejar vacías las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`.
2. El sitio usa `commercialSnapshot`.
3. `/admin` muestra configuración pendiente.

## Limitaciones actuales

- No hay gestión de pedidos persistentes.
- No hay upload a Supabase Storage.
- No hay realtime.
- El primer admin se agrega con SQL administrativo controlado.
- La validación local de SQL requiere Supabase CLI y Docker disponibles.
