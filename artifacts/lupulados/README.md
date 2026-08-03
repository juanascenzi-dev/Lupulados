# `artifacts/lupulados`

App principal de Lupulados (calculadora de barriles, storefront, wizard de pedido, panel admin). Ver el [README raíz](../../README.md) para la vista general del monorepo y [CLAUDE.md](../../CLAUDE.md) para convenciones de commits, branches y CI.

## Variables de entorno

Copiá `.env.example` a `.env` en este directorio y completá:

| Variable                        | Requerida | Descripción                                                                                |
| ------------------------------- | --------- | ------------------------------------------------------------------------------------------ |
| `VITE_SUPABASE_URL`             | Sí\*      | URL del proyecto Supabase. Debe ser `https://` (o `localhost`/`127.0.0.1` en dev).         |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sí\*      | Publishable key de Supabase.                                                               |
| `VITE_SUPABASE_ANON_KEY`        | No        | Compatibilidad temporal: se usa como fallback si falta `VITE_SUPABASE_PUBLISHABLE_KEY`.    |
| `VITE_SENTRY_DSN`               | No        | DSN de Sentry para error tracking en producción. Sin esto, el reporte de errores es no-op. |

\* Sin estas dos (o su equivalente `VITE_SUPABASE_ANON_KEY`), la app no se cae: cae al fallback estático (ver abajo).

## Supabase real vs. fallback estático

`src/lib/supabase/config.ts` valida la configuración en runtime y devuelve `{configured: false, reason}` si:

- Falta `VITE_SUPABASE_URL` o la key (`missing_url` / `missing_key`).
- La URL no es `https://` (ni `localhost`/`127.0.0.1` en dev) (`invalid_url`).
- La key parece una key privada filtrada del lado del cliente (`sb_secret_`, `service_role`, o un JWT legacy con rol `service_role`) (`private_supabase_key`) — protección activa contra exponer la service-role key en el bundle.

Cuando `configured` es `false`, o cuando el fetch a Supabase falla, `CommercialDataContext` cae a un catálogo estático (`domain/demoStoreCatalogData.ts`) en vez de romper la UI. En dev, esto loggea un `console.warn` gateado a `import.meta.env.DEV`; en cualquier entorno con Sentry configurado, además se reporta con `reportError()` (ver [política de logging en CLAUDE.md](../../CLAUDE.md#política-de-logging)).

Para desarrollar contra Supabase real, completá las tres variables con los valores de tu proyecto. Para trabajar sin Supabase (UI/lógica de dominio que no depende de datos reales), simplemente dejá `.env` sin esas variables y la app usa el catálogo estático.

## Comandos

Desde este directorio (o con `pnpm --filter lupulados <script>` desde la raíz):

```bash
pnpm dev      # dev server
pnpm test     # tests (vitest)
pnpm build    # build de producción
pnpm serve    # preview del build
```

## Deploy

Ver [sección Deploy en CLAUDE.md](../../CLAUDE.md#deploy).
