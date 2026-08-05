# Lupulados — guía del proyecto

## Estructura

Monorepo pnpm (workspaces en `pnpm-workspace.yaml`):

- `artifacts/lupulados` — app principal (React 19 + Vite + Tailwind, calculadora de barriles, storefront, PWA).
- `artifacts/mockup-sandbox` — sandbox de mockups (Vite), no productivo.
- `scripts` — utilidades sueltas (tsx).
- `docs/` — notas históricas de features/fixes puntuales (pre-CHANGELOG, ver abajo).
- `supabase/` — config/migraciones de Supabase.

## Comandos

Desde la raíz:

- `pnpm install` — instala todo el workspace.
- `pnpm run typecheck` — corre `tsc --build` en libs y typecheck por paquete en `artifacts/*` y `scripts`.
- `pnpm run lint` — ESLint sobre todo el repo.
- `pnpm run build` — typecheck + build recursivo (`--if-present`) de cada paquete.
- `pnpm --filter lupulados test` — corre los tests (vitest) de la app principal.
- `pnpm --filter lupulados test:coverage` — igual, con reporte de cobertura (gate del 70% en `src/domain`, ver política de testing).
- `pnpm --filter lupulados dev` — levanta el dev server de la app principal.

## Convenciones

### Commits (Conventional Commits)

Formato `tipo: descripción breve en imperativo`. Tipos usados en este repo: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`. Ejemplos reales: `fix: calibra multiplicadores de consumo con benchmarks reales de asados/fiestas`, `feat: precio real por estilo de cerveza en la calculadora de barriles`.

### CHANGELOG en vez de doc por cambio

Antes cada cambio no trivial generaba un archivo nuevo en `docs/*.md`. A partir de ahora, todo cambio no trivial agrega una entrada a `CHANGELOG.md` (formato Keep a Changelog) bajo `## [Unreleased]`, en la sección que corresponda (`Added`/`Changed`/`Fixed`). Los `docs/*.md` existentes quedan como referencia histórica pero no se crean nuevos.

### Documentación de lógica por archivo (`src/domain`)

Todo archivo de `artifacts/lupulados/src/domain/` (excepto `*.test.ts`) tiene un `.md` compañero colocado en la misma carpeta, mismo nombre base (`archivo.ts` → `archivo.md`), que explica su lógica. Es una convención distinta de la anterior (esa es sobre docs por _cambio_; esta es documentación viva por _archivo_, que describe el estado actual del código, no su historia).

- Al crear un archivo nuevo en `src/domain`, se crea su `.md` en el mismo cambio.
- Al modificar la lógica de un archivo existente en `src/domain` (no aplica a cambios triviales de formato/typo), se actualiza su `.md` para que siga reflejando el comportamiento real.
- Formato del `.md`: propósito (1-2 frases), exports principales (qué hace cada uno, inputs/outputs relevantes), reglas de negocio/edge cases no obvios desde la firma de tipos, dependencias clave de otros módulos, y referencia al `.test.ts` si existe.
- Esta regla aplica hoy solo a `src/domain`; no se extiende automáticamente a otros directorios de `src/` salvo que se decida explícitamente ampliarla.

### Flujo de branches y PRs

- Nada se commitea directo a `main`. Se trabaja en ramas `feature/*` o `fix/*`.
- Antes de abrir PR: `pnpm run typecheck`, `pnpm run lint` y `pnpm --filter lupulados test:coverage` deben pasar en local.
- El PR debe incluir su entrada correspondiente en `CHANGELOG.md`.
- Merge a `main` solo cuando CI está en verde y el PR fue revisado (squash merge).

### Lint / formato / hooks

- ESLint (`eslint.config.js`) + Prettier configurados en la raíz.
- Husky + lint-staged corren automáticamente en `pre-commit` (lint + format de archivos staged) y en `pre-push` (`typecheck` + `test:coverage`). No usar `--no-verify` salvo indicación explícita del usuario.

### CI

`.github/workflows/ci.yml` corre en push/PR contra `main`: install → typecheck → lint → test (con coverage) → build. Un PR no se mergea si CI falla.

### Testing de componentes

- `artifacts/lupulados/vitest.config.mjs` define dos `test.projects`: `node` (specs de `src/domain`, sin DOM) y `jsdom` (`*.test.tsx`, con `@testing-library/react`/`jest-dom`/`user-event`, `setupFiles: src/test/setupTests.ts`).
- Helpers compartidos en `artifacts/lupulados/src/test/`: `renderWithCommercialData`/`renderWithCart`/`renderAdmin` (`renderWithProviders.tsx`) arman el árbol de providers real de `App.tsx` para cada flujo; `supabaseAdminMock.ts` mockea `@/lib/supabase/client` + `@/lib/supabase/config` para testear login/CRUD del panel admin sin pegarle a Supabase.
- `pnpm --filter lupulados test:coverage` mide cobertura solo sobre `src/domain` (`coverage.include`), con umbral de 70% (statements/branches/functions/lines) — es el comando que corre en CI y en `pre-push`.

## Deploy

`artifacts/lupulados` se despliega en Vercel vía su integración nativa con GitHub (no hay step de deploy en `ci.yml`; CI y deploy son pipelines separados):

- Push/merge a `main` → deploy de producción automático.
- PRs abiertos → preview deployments automáticos.
- Config relevante: `artifacts/lupulados/vercel.json` (headers de seguridad — CSP, `X-Frame-Options`, etc. — y rewrite SPA a `index.html`).

## Política de logging

- `console.*` en `src/` solo va gateado a `import.meta.env.DEV` (ver `ErrorBoundary.tsx` y `CommercialDataContext.tsx` como referencia). No debe haber `console.*` sin gate — en producción es invisible para el equipo y no aporta nada.
- Los errores reales (render errors, fallos de I/O contra Supabase, mutaciones del panel admin) se reportan con `reportError(error, context)` de `src/lib/monitoring/sentry.ts`. Es no-op si no hay `VITE_SENTRY_DSN` configurado o fuera de producción — mismo patrón de degradación elegante que `lib/supabase/config.ts`.
- Call sites actuales, como referencia del patrón esperado: `ErrorBoundary.componentDidCatch`, `AdminAuthContext` (fallo del rpc `is_admin`), `CommercialDataContext` (fallback a catálogo estático), `useAdminDashboardData` (carga inicial, mutaciones, auditoría).
- Para código nuevo: todo `catch` de I/O real (Supabase, storage) que hoy no reporta a Sentry debería agregar `reportError(error, { scope: "..." })`, con un `scope` descriptivo del punto de falla (mismo estilo que los existentes: `"admin-rpc-is-admin"`, `"commercial-data-fallback"`, `"admin-load-data"`, etc.).
