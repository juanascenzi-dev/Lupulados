# Lupulados

Calculadora de barriles de cerveza para eventos (asados, fiestas), storefront con catálogo configurable, flujo de pedidos con handoff a WhatsApp y panel de administración. React 19 + Vite + Tailwind + Supabase.

## Estructura del monorepo

Monorepo gestionado con pnpm workspaces (`pnpm-workspace.yaml`):

| Paquete                    | Descripción                                                                            |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `artifacts/lupulados`      | App principal (React 19 + Vite + Tailwind, calculadora, storefront, panel admin, PWA). |
| `artifacts/mockup-sandbox` | Sandbox de mockups, no productivo.                                                     |
| `scripts`                  | Utilidades sueltas (tsx).                                                              |
| `supabase`                 | Migraciones y seed de la base de datos.                                                |
| `docs`                     | Notas históricas de features/fixes puntuales (pre-CHANGELOG).                          |

## Stack técnico

- React 19 + Vite 7 + Tailwind CSS 4
- TanStack Query, `wouter` (routing)
- Radix UI / componentes estilo shadcn
- `react-hook-form` + `zod`
- Supabase (`@supabase/supabase-js`)
- Vitest, ESLint + Prettier, Husky + lint-staged

## Funcionalidad principal

- **Calculadora de barriles**: estima litros por persona según género, mezcla de bebidas, duración e intensidad del evento.
- **Storefront**: catálogo configurable de presentaciones (growlers, porrones, etc.).
- **Wizard de pedido**: carrito, resumen de orden y envío del pedido por WhatsApp.
- **Panel admin**: gestión respaldada por Supabase, con fallback a datos estáticos.

## Requisitos previos

- Node 24 (versión usada en CI)
- pnpm (gestor obligatorio del repo — `scripts/preinstall.cjs` bloquea instalaciones con npm/yarn)

## Instalación y configuración

```bash
pnpm install
```

Copiá `artifacts/lupulados/.env.example` a `.env` y completá las variables:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=

# Compatibilidad temporal con proyectos que todavía usen anon key.
VITE_SUPABASE_ANON_KEY=
```

## Comandos

Desde la raíz del repo:

```bash
pnpm install              # instala todo el workspace
pnpm run typecheck        # tsc --build (libs) + typecheck por paquete
pnpm run lint             # ESLint sobre todo el repo
pnpm run format           # Prettier (write)
pnpm run format:check     # Prettier (check)
pnpm run build            # typecheck + build recursivo de cada paquete
```

Para la app principal:

```bash
pnpm --filter lupulados dev     # levanta el dev server
pnpm --filter lupulados test    # corre los tests (vitest)
pnpm --filter lupulados serve   # preview del build
```

## Contribución

- Nada se commitea directo a `main`: se trabaja en ramas `feature/*` o `fix/*`.
- Todo cambio no trivial agrega una entrada a `CHANGELOG.md` bajo `[Unreleased]`.
- Antes de abrir PR deben pasar en local: `pnpm run typecheck`, `pnpm run lint` y `pnpm --filter lupulados test`.
- Husky corre lint-staged en `pre-commit` y typecheck + test en `pre-push`.
- Merge a `main` solo con CI en verde (squash merge).

Ver [CLAUDE.md](CLAUDE.md) para el detalle completo de convenciones.

## CI

`.github/workflows/ci.yml` corre en push/PR contra `main`: install → typecheck → lint → test → build.

## Supabase

`supabase/migrations` y `supabase/seed.sql` contienen el esquema y los datos iniciales. Ver [docs/supabase-operations.md](docs/supabase-operations.md) para las convenciones de operación (incluye advertencias sobre no correr `db reset` contra el proyecto remoto equivocado).

## Licencia

MIT
