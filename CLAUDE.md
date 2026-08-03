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
- `pnpm --filter lupulados dev` — levanta el dev server de la app principal.

## Convenciones

### Commits (Conventional Commits)

Formato `tipo: descripción breve en imperativo`. Tipos usados en este repo: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`. Ejemplos reales: `fix: calibra multiplicadores de consumo con benchmarks reales de asados/fiestas`, `feat: precio real por estilo de cerveza en la calculadora de barriles`.

### CHANGELOG en vez de doc por cambio

Antes cada cambio no trivial generaba un archivo nuevo en `docs/*.md`. A partir de ahora, todo cambio no trivial agrega una entrada a `CHANGELOG.md` (formato Keep a Changelog) bajo `## [Unreleased]`, en la sección que corresponda (`Added`/`Changed`/`Fixed`). Los `docs/*.md` existentes quedan como referencia histórica pero no se crean nuevos.

### Flujo de branches y PRs

- Nada se commitea directo a `main`. Se trabaja en ramas `feature/*` o `fix/*`.
- Antes de abrir PR: `pnpm run typecheck`, `pnpm run lint` y `pnpm --filter lupulados test` deben pasar en local.
- El PR debe incluir su entrada correspondiente en `CHANGELOG.md`.
- Merge a `main` solo cuando CI está en verde y el PR fue revisado (squash merge).

### Lint / formato / hooks

- ESLint (`eslint.config.js`) + Prettier configurados en la raíz.
- Husky + lint-staged corren automáticamente en `pre-commit` (lint + format de archivos staged) y en `pre-push` (`typecheck` + `test`). No usar `--no-verify` salvo indicación explícita del usuario.

### CI

`.github/workflows/ci.yml` corre en push/PR contra `main`: install → typecheck → lint → test → build. Un PR no se mergea si CI falla.

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
