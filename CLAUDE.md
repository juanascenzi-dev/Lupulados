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

Estas notas son notas de Obsidian (el repo tiene `.obsidian/` en la raíz): usan wikilinks `[[archivo]]` para referenciar otros módulos del dominio y frontmatter YAML para tags/relaciones, así se aprovechan el grafo y el panel de propiedades de Obsidian.

- Al crear un archivo nuevo en `src/domain`, se crea su `.md` en el mismo cambio, con frontmatter.
- Al modificar la lógica de un archivo existente en `src/domain` (no aplica a cambios triviales de formato/typo), se actualiza su `.md` para que siga reflejando el comportamiento real — tanto el cuerpo como `tags`/`related` si cambiaron las relaciones con otros módulos.
- Formato del `.md`:
  - Frontmatter al inicio del archivo:
    ```yaml
    ---
    tags: [domain, <categoría>]
    related: ["[[otroModulo]]", "[[otroModulo2]]"]
    ---
    ```
    `tags` siempre incluye `domain` más una categoría corta de esta taxonomía fija (se elige la que mejor calce, no se inventan nuevas): `schema`, `calculator`, `repository`, `guard`, `catalog`, `formatting`, `constants`, `adapter`, `context-logic`, `util`. `related` lista los wikilinks que ya aparecen en el cuerpo de la nota (`related: []` si no referencia otros módulos) — no se agrega campo de fecha/"última actualización", eso ya lo cubre git.
  - Cuerpo: propósito (1-2 frases), exports principales (qué hace cada uno, inputs/outputs relevantes), reglas de negocio/edge cases no obvios desde la firma de tipos, dependencias clave de otros módulos (con wikilinks `[[archivo]]` cuando son módulos de `src/domain`), y referencia al `.test.ts` si existe.
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

### Versión de Node

`package.json` (raíz y `artifacts/lupulados`) fija `engines.node: "24.x"`, y `.npmrc` tiene `engine-strict=true`. En la práctica, con pnpm 11.18.0 esto produce un `WARN` en `pnpm install` si la versión local no matchea (`[WARN] Unsupported engine`), no un hard-fail — sigue siendo señal visible de que el entorno local está desalineado de lo que corre `ci.yml` (`node-version: 24`), aunque no bloquee. Si tu Node local no es 24.x, verás ese warning; usar `nvm`/`fnm` para alinear localmente evita sorpresas de comportamiento entre dev y CI.

### Versionado

Este repo no usa SemVer ni releases/tags de Git: `artifacts/lupulados` es una app de deploy continuo a Vercel (ver [Deploy](#deploy)), no un paquete que alguien instala con una versión pineada. `package.json` queda en `0.0.0` a propósito. El historial de cambios vive en `CHANGELOG.md` bajo `[Unreleased]`, y "lo que está en producción" es simplemente lo último mergeado en `main`.

### Manejo de secrets / variables de entorno

- Nunca se commitea `.env`/`.env.local` (`.gitignore` ya los excluye; solo `.env.example` va versionado).
- Toda variable de cliente nueva va prefijada `VITE_` (Vite solo expone al bundle las que tienen ese prefijo) y se documenta en la tabla de [`artifacts/lupulados/README.md`](artifacts/lupulados/README.md#variables-de-entorno). `.env.example` es la fuente de verdad de qué variables existen.
- Nunca poner un secret de servidor (service-role key, API key privada) en una var `VITE_*`: termina literal en el bundle del cliente, visible para cualquiera. `src/lib/supabase/config.ts` ya valida esto en runtime y rechaza proactivamente keys `sb_secret_`/`service_role` filtradas del lado del cliente — es el patrón a replicar si se agrega otro provider con distinción de keys pública/privada.

### Gestión de dependencias

`pnpm-workspace.yaml` centraliza la política de dependencias del monorepo:

- `catalog:` fija la versión de toda dependencia compartida entre `artifacts/lupulados` y `artifacts/mockup-sandbox` (React, Vite, Tailwind, TanStack Query, etc.) en un solo lugar en vez de repetirla por paquete. Una dependencia usada por ambos paquetes va al catálogo, no fijada individualmente en cada `package.json`.
- `overrides` se usa solo para pins de seguridad justificados con un comentario que explique el motivo — ver el pin de `esbuild` a `0.28.1` en el archivo (blindaje contra GHSA-g7r4-m6w7-qqqr).
- `minimumReleaseAge: 1440` (24h) pone en cuarentena cualquier versión de dependencia recién publicada antes de que `pnpm install` la resuelva — mitiga ataques de supply-chain vía paquetes maliciosos recién subidos a npm.
- No hay `pnpm audit` automatizado en CI todavía; se corre manualmente (ver `docs/code-audit-checklist.md` como precedente). Es parte del checklist de code review (abajo) y de `SECURITY.md`.

### Accesibilidad (a11y)

Convención manual, sin lint ni test automatizado hoy (evaluado y descartado por ahora: agregar `eslint-plugin-jsx-a11y` con el gate `--max-warnings=0` actual requeriría auditar y arreglar el código existente en el mismo cambio; queda anotado como mejora futura, no como pendiente olvidado). Al escribir o tocar UI:

- HTML semántico antes que `div`/`span` genéricos con `role` (`<button>`, `<nav>`, `<label>`, etc.).
- `alt` obligatorio en toda imagen no decorativa; `alt=""` explícito en las decorativas.
- Todo control de formulario con `<label htmlFor>` o `aria-label`/`aria-labelledby`.
- Foco visible y navegación por teclado en componentes interactivos custom (los primitivos de Radix UI ya lo dan gratis en la mayoría de los casos usados en este repo — preferirlos a un `<div onClick>` hecho a mano).

### Code review

Más allá de "CI en verde", antes de aprobar un PR revisar:

- ¿La lógica de negocio nueva o tocada tiene test? (`src/domain` tiene gate de cobertura del 70%, pero eso no cubre lógica fuera de `src/domain`).
- ¿Hay `console.*` nuevo sin gate a `import.meta.env.DEV`? (ver [Política de logging](#política-de-logging)).
- ¿Hay un `catch` de I/O real (Supabase, storage) sin `reportError(error, { scope })`?
- ¿Alguna dependencia nueva tiene una vulnerabilidad conocida (`pnpm audit`)?
- Si se tocó `src/domain`, ¿el `.md` compañero del archivo sigue reflejando el comportamiento real?

Ver también [`SECURITY.md`](SECURITY.md) (cómo reportar una vulnerabilidad) y [`CODEOWNERS`](CODEOWNERS) (quién revisa por defecto).

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
