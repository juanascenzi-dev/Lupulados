# Auditoría de proyecto — Lupulados (2026-08-02)

Alcance: monorepo pnpm, foco en `artifacts/lupulados` (app productiva). `artifacts/mockup-sandbox` es sandbox no productivo y se excluye del scoring salvo donde se indica.

Estado verificado en esta auditoría: `pnpm run lint` → 0 errores / 29 warnings (todos en `mockup-sandbox`, salvo 1 en `StorePage.tsx`); `pnpm --filter lupulados test` → 354/354 tests OK en 34 archivos.

## Resumen de puntajes

| Área                                    | Puntaje                          |
| --------------------------------------- | -------------------------------- |
| 1. Calidad de código (DRY/SOLID/naming) | 8/10                             |
| 2. Cobertura de testing                 | 6/10                             |
| 3. Documentación                        | ~~5/10~~ → 8/10 (2026-08-03)     |
| 4. CI/CD                                | ~~7.5/10~~ → 8/10 (2026-08-03)   |
| 5. Variables de entorno                 | 9/10                             |
| 6. Logging y monitoreo                  | ~~3/10~~ → resuelto (2026-08-02) |
| 7. Manejo de errores                    | ~~7/10~~ → 8/10 (2026-08-02)     |
| 8. Performance                          | 7/10                             |

---

## 1. Calidad de código — 8/10

**Bien:**

- Separación clara dominio/UI: lógica de negocio pura en `src/domain/*.ts` (cálculo de barriles, catálogo, checkout, etc.), separada de componentes React.
- Disciplina de refactor activa y documentada: el CHANGELOG registra extracciones concretas de duplicación (`QuantityStepper`, `BeerPresentationLineCard` reemplazando 8 implementaciones casi idénticas) y splits de los 6 archivos más largos del proyecto.
- Naming consistente y descriptivo (dominio en español, código en inglés — coherente en todo el repo).
- Sin comentarios ruido ni `TODO`/`FIXME`/`HACK` colgados en `src/`.

**Mejorable:**

- `ArmaTuPedido.tsx` volvió a crecer a 2041 líneas pese al refactor documentado (bajó a 1962, hoy está por encima de ese pico). Es el candidato más claro a seguir dividiendo.
- `StorePage.tsx` (584 líneas) y `AdminDashboard.tsx`/`ConfigurableBeerPackBuilder.tsx` siguen siendo componentes grandes con múltiples responsabilidades (fetch, filtros, presentación).
- Warning de lint activo en producción: `getProductMaxSavings` sin usar en `StorePage.tsx:50`.

**Acciones concretas:**

- [ ] Volver a partir `ArmaTuPedido.tsx` (2041 líneas): extraer paso a paso los sub-flujos (selección de tipo, resumen en vivo) como se hizo con el resto.
- [ ] Resolver el warning de `getProductMaxSavings` no usado en `StorePage.tsx:50` (eliminarlo o usarlo).
- [ ] Evaluar `max-lines` / `max-lines-per-function` en ESLint como guardrail para que archivos grandes no vuelvan a crecer sin que el CI lo marque.

---

## 2. Cobertura de testing — 6/10

**Bien:**

- 354 tests, 34 archivos, 100% passing. Cobertura fuerte y con casos de borde reales en la capa de dominio (`barrelCalculator`, `eventDuration`, `eventGuestCount`, `beverageMix`, `cartStorage`, `commercialRepository`, `orderWizardValidation`, etc.).
- Tests de configuración sensible: `supabase/config.test.ts` cubre detección de keys privadas filtradas.
- `pre-push` hook corre `typecheck + test` — evita que código roto llegue a CI.

**Mejorable:**

- La capa de componentes React está prácticamente sin testear: de ~90 archivos en `src/components/`, solo `Navbar.test.ts` tiene test asociado (y por el `.ts`, probablemente testea lógica extraída, no render). Componentes grandes y con lógica de estado real (`ArmaTuPedido`, `Calculadora`, `AdminDashboard`, `StorePage`) no tienen tests de integración/render.
- No hay `@testing-library/react` ni configuración de `jsdom`/`happy-dom` en `vitest.config.mjs` (`environment: "node"`), lo que sugiere que no se puede testear render de componentes con la config actual.
- Sin reporte de cobertura configurado (`vitest --coverage` no está en scripts, sin umbral mínimo en CI).
- Sin tests E2E (Playwright/Cypress) para flujos críticos completos (armar pedido → checkout WhatsApp, login admin → CRUD).

**Acciones concretas:**

- [ ] Agregar `@vitejs/plugin-react` + `jsdom`/`happy-dom` + `@testing-library/react` para poder testear render/interacción de componentes.
- [ ] Priorizar tests de integración para los 3 flujos de mayor riesgo de negocio: Calculadora → resultado, ArmaTuPedido → checkout WhatsApp, AdminDashboard → login y CRUD.
- [ ] Configurar `vitest --coverage` (v8 provider) y fijar un umbral mínimo razonable (ej. 70% en `src/domain`) que corra en CI.
- [ ] Evaluar Playwright para 1-2 smoke tests E2E de los flujos de conversión (calculadora y pedido).

---

## 3. Documentación — ~~5/10~~ → 8/10 (2026-08-03)

**Bien:**

- `CLAUDE.md` documenta estructura, comandos, convenciones de commits, flujo de branches, CI, deploy y política de logging — funciona como guía operativa interna sólida.
- `CHANGELOG.md` activo y detallado, siguiendo Keep a Changelog, con migración explícita del historial previo en `docs/*.md`.
- Naming autoexplicativo reduce la necesidad de comentarios (política deliberada, no negligencia).
- **Resuelto (2026-08-03):** `README.md` en la raíz (agregado en `c9c3ad3`, el día después de esta auditoría) y `README.md` en `artifacts/lupulados` (env vars requeridas, comportamiento real vs. fallback estático de Supabase). `docs/obsidian-pending/` tiene ahora un índice (`docs/obsidian-pending/README.md`) que documenta el estado real de cada nota: 5 resueltas/históricas, 1 (`18 - Packs de porrones configurables.md`) con un ítem de QA manual genuinamente pendiente.

**Mejorable:**

- Sin documentación de arquitectura de alto nivel (por qué Supabase directo desde el cliente y no un backend propio — decisión que sí quedó en el CHANGELOG pero no en un doc dedicado y fácil de encontrar).

**Acciones concretas:**

- [x] Crear `README.md` en la raíz — resuelto (2026-08-03, vía `c9c3ad3`).
- [x] Agregar un `README.md` corto en `artifacts/lupulados` con specifics de la app (variables de entorno requeridas, cómo correr contra Supabase real vs. fallback estático) — resuelto (2026-08-03).
- [x] Revisar `docs/obsidian-pending/` y documentar su estado — resuelto (2026-08-03) vía `docs/obsidian-pending/README.md`.

---

## 4. CI/CD — ~~7.5/10~~ → 8/10 (2026-08-03)

**Bien:**

- Pipeline claro y en el orden correcto: install (frozen lockfile) → typecheck → lint → test → build, en push/PR contra `main`.
- Husky + lint-staged en `pre-commit` (lint+format de staged) y `pre-push` (typecheck+test) espejan casi 1:1 lo que corre CI, así se detectan problemas antes de llegar al PR.
- `permissions: contents: read` explícito en el workflow (buena práctica de mínimo privilegio).
- pnpm con cache de `actions/setup-node` configurado.

**Mejorable:**

- Sin cobertura de tests reportada/gateada en CI (ver punto 2).
- Sin matriz de versiones de Node (solo Node 24) — razonable para una app frontend sin usuarios de librería externa, pero vale decidirlo explícitamente.
- Sin cache de resultados de build/typecheck entre jobs (todo corre secuencial en un único job; no es grave al tamaño actual del repo, pero crecerá el tiempo de CI con el monorepo).
- **Resuelto (2026-08-03):** el mecanismo de deploy (Vercel + integración nativa de Git, sin step en `ci.yml`) ya está documentado en `CLAUDE.md` (sección "Deploy").

**Acciones concretas:**

- [x] Documentar en `CLAUDE.md`/README cómo se despliega (Vercel + integración Git) — resuelto (2026-08-03), ver `CLAUDE.md` sección "Deploy".
- [ ] Sumar `--coverage` al step de test en CI una vez que el punto 2 esté resuelto, con un umbral que falle el build si baja.
- [ ] Si el monorepo sigue creciendo, considerar separar jobs por paquete (`lupulados`, `mockup-sandbox`, `scripts`) para paralelizar y evitar que un fallo en el sandbox bloquee la app productiva.

---

## 5. Manejo de variables de entorno — 9/10

**Bien:**

- `.env.example` presente y minimal, con comentario explícito de compatibilidad temporal (`VITE_SUPABASE_ANON_KEY`).
- Validación runtime robusta en `src/lib/supabase/config.ts`: chequea URL/key faltantes, valida que la URL sea https (o localhost en dev), y **detecta activamente si se filtró una key privada del lado del cliente** (`sb_secret_`, `service_role`, o decodificando el payload de un JWT legacy para ver si el rol es `service_role`). Esto es una protección real contra un error común y peligroso (exponer la service-role key en el bundle del cliente).
- Fallback explícito y testeado: si Supabase no está configurado o falla, la app cae a datos estáticos (`CommercialDataContext`) en lugar de romperse.
- CSP en `vercel.json` restringe `connect-src` a los dominios de Supabase esperados, coherente con el resto del hardening.

**Mejorable:**

- No hay validación de que **todas** las env vars usadas en el código (`import.meta.env.*`) estén reflejadas en `.env.example` — es manual mantenerlas sincronizadas.

**Acciones concretas:**

- [ ] (Opcional, bajo impacto) Agregar un test o script simple que grep-ee `import.meta.env.VITE_*` en `src/` y verifique que cada variable esté declarada en `.env.example`, para que no se desincronicen con el tiempo.

---

## 6. Logging y monitoreo — ~~3/10~~ → resuelto (ver actualización 2026-08-02)

**Estado original de la auditoría (corregido):**

- Solo 2 `console.*` en todo `src/`: un `console.error` en `ErrorBoundary` y un `console.warn` en `CommercialDataContext` al caer al fallback estático — **ambos** gateados por `import.meta.env.DEV` (la versión original de este documento decía que el segundo no estaba gateado; sí lo está, ver `CommercialDataContext.tsx:37-39`). O sea, ninguno de los dos loggeaba nada en producción.
- No había integración con ningún servicio de error tracking o monitoreo (Sentry, LogRocket, Datadog, etc.).
- No hay analytics de producto/negocio (ej. conversión de la calculadora, abandono del wizard de pedido) más allá de lo que Vercel pueda dar de infraestructura — esto sigue pendiente, ver acciones abajo.

**Impacto que se corrigió:** si un usuario real tenía un error de render en producción, el `ErrorBoundary` lo atrapaba y mostraba una UI de fallback — pero el equipo no se enteraba nunca, porque el log solo existía en DEV. Esto era especialmente relevante en un ecommerce/cotizador donde un error silencioso en la Calculadora o en el checkout de WhatsApp puede perder una venta sin que nadie lo note.

**Resuelto:** se integró Sentry (`@sentry/react`) vía `src/lib/monitoring/` (`config.ts` + `sentry.ts`), con el mismo patrón de degradación elegante que `lib/supabase/config.ts` (sin `VITE_SENTRY_DSN` o fuera de producción, `reportError()` es un no-op). Detalle en `CHANGELOG.md`.

- [x] Integrar un servicio de error tracking en producción y reportar desde `ErrorBoundary.componentDidCatch` sin el gate de `DEV`.
- [x] Reportar también errores no capturados por boundaries: fallos de `client.rpc`/queries de Supabase en `AdminAuthContext` y `CommercialDataContext`, y las mutaciones de `useAdminDashboardData`.
- [ ] Definir qué eventos de negocio vale la pena trackear (completar Calculadora, agregar al pedido, enviar WhatsApp, login admin) y con qué herramienta (Vercel Analytics, Plausible, o el mismo Sentry con breadcrumbs). **Sigue pendiente** — quedó fuera de alcance de la integración de Sentry.
- [x] Documentar en `CLAUDE.md` la política de logging — resuelto (2026-08-03), ver `CLAUDE.md` sección "Política de logging".
- [ ] Seguimiento pendiente para que Sentry reciba eventos reales: crear el proyecto en sentry.io, setear `VITE_SENTRY_DSN` en Vercel (env de producción), y confirmar/ajustar el host exacto de `connect-src` en `vercel.json` (hoy usa `https://*.ingest.us.sentry.io` como placeholder de la región US).
- [ ] (Opcional) Upload de source maps / release tracking con `@sentry/vite-plugin`, requiere `SENTRY_AUTH_TOKEN` como secret de CI.

---

## 7. Manejo de errores — 7/10 → 8/10 (ver actualización 2026-08-02)

**Bien:**

- `ErrorBoundary` envuelve cada ruta individualmente vía `LazyRoute` en `App.tsx`, con UI de recuperación (reintentar / volver al inicio) en vez de pantalla blanca.
- `CommercialDataContext` tiene fallback explícito y testeado ante fallos de Supabase (catch → dataset estático).
- `AdminAuthContext` maneja errores de `client.rpc("is_admin")` degradando a `unauthorized` en vez de dejar el estado indefinido, y `signIn` devuelve `{ok, message}` en vez de lanzar.
- `supabase/config.ts` usa resultados tipados (`configured: true/false` con `reason`) en lugar de excepciones para casos esperables — buen uso de tipos para modelar fallos previsibles.
- 25 bloques `try/catch` repartidos en el código, concentrados donde hay I/O real (Supabase, storage).
- **Resuelto:** los catches de `ErrorBoundary`, `CommercialDataContext`, `AdminAuthContext` y los tres de `useAdminDashboardData` ahora llaman a `reportError()` (Sentry) además de degradar/toastear — el patrón de "degradar silenciosamente" sigue para UX, pero ya no es invisible para el equipo. Ver punto 6.

**Mejorable:**

- No se ve manejo explícito de errores de red intermitentes (retry/backoff) en las llamadas a Supabase — un fallo transitorio de red probablemente cae directo al fallback estático en vez de reintentar.

**Acciones concretas:**

- [x] Conectar los `catch` existentes (`CommercialDataContext`, `AdminAuthContext`, `useAdminDashboardData`) al sistema de error tracking del punto 6.
- [ ] Evaluar retry simple (1-2 reintentos con backoff) antes de caer al fallback estático en las lecturas críticas de Supabase, para no penalizar UX ante fallos transitorios de red.

---

## 8. Performance — 7/10

**Bien:**

- Code-splitting a nivel de ruta (`lazyRoutes.ts` con `React.lazy` para Landing/Store/AdminLogin/AdminDashboard/AdminRouteShell/NotFound).
- `manualChunks` bien pensado en `vite.config.ts`: separa vendor chunks por librería pesada (`@supabase`, `framer-motion`, `@radix-ui`, `lucide-react`, `zod`, `@tanstack/react-query`, `react`/`react-dom`/`wouter`) — reduce el chunk principal y mejora cacheo entre deploys (vendor chunks cambian con menos frecuencia que el código de la app).
- PWA con manifest y service worker (`sw.js`), íconos maskable/apple — buen soporte de instalación y cacheo offline.
- `MotionConfig reducedMotion="user"` + `reducedMotion.ts` respeta preferencias de accesibilidad/performance percibida del usuario.
- `RouteFallback` + `Suspense` evita layout shift feo durante la carga lazy de rutas.

**Mejorable:**

- `ArmaTuPedido.tsx` (2041 líneas) no está lazy-loaded como componente propio dentro de su página — se bundlea entero con la página que lo usa.
- No hay presupuesto de performance ni auditoría automatizada (Lighthouse CI, `bundlesize`, etc.) en el pipeline de CI — el `manualChunks` bien pensado no tiene un guardrail que avise si un chunk crece de golpe.
- `calculateBarrelRecommendation` fue optimizado según el CHANGELOG (de O(n²) documentado), pero no hay test de performance/benchmark que impida una regresión futura del mismo tipo.

**Acciones concretas:**

- [ ] Agregar Lighthouse CI (o similar) como step no bloqueante en el workflow de GitHub Actions para trackear métricas de performance en el tiempo.
- [ ] Considerar un chequeo de tamaño de bundle (ej. `size-limit`) en CI para los chunks principales, dado que ya hay una estrategia de `manualChunks` deliberada que vale la pena proteger.
- [ ] Si `ArmaTuPedido.tsx` se vuelve a partir (punto 1), evaluar si alguna sección pesada (ej. selector de estilos con imágenes) amerita su propio `lazy()`.

---

## Checklist consolidado (copiar/pegar para tracking)

### Calidad de código

- [ ] Dividir `ArmaTuPedido.tsx` (2041 líneas) en sub-módulos
- [ ] Resolver warning de `getProductMaxSavings` sin usar en `StorePage.tsx:50`
- [ ] Evaluar regla ESLint `max-lines` como guardrail

### Testing

- [ ] Sumar `jsdom`/`happy-dom` + `@testing-library/react` a vitest
- [ ] Tests de integración para Calculadora, ArmaTuPedido→checkout WhatsApp, AdminDashboard login+CRUD
- [ ] Configurar `vitest --coverage` con umbral mínimo en CI
- [ ] Evaluar smoke tests E2E (Playwright) para flujos de conversión

### Documentación

- [x] Crear `README.md` en la raíz del repo
- [x] Crear `README.md` en `artifacts/lupulados` (env vars, cómo correr contra Supabase real vs. fallback)
- [x] Resolver estado de `docs/obsidian-pending/`

### CI/CD

- [x] Documentar mecanismo real de deploy (Vercel + integración Git)
- [ ] Gatear cobertura de tests en CI una vez configurada
- [ ] Evaluar separar jobs por paquete si el monorepo crece

### Variables de entorno

- [ ] (Opcional) Script/test que valide sincronía entre `import.meta.env.VITE_*` usadas y `.env.example`

### Logging y monitoreo

- [x] Integrar error tracking en producción (Sentry) desde `ErrorBoundary`
- [x] Reportar fallos de Supabase (`AdminAuthContext`, `CommercialDataContext`, `useAdminDashboardData`) al mismo sistema
- [ ] Crear el proyecto en sentry.io, setear `VITE_SENTRY_DSN` en Vercel y confirmar el host real de `connect-src` en `vercel.json`
- [ ] Definir y trackear eventos de negocio clave (calculadora completada, pedido agregado, WhatsApp enviado, login admin)
- [x] Documentar política de logging en `CLAUDE.md`
- [ ] (Opcional) Upload de source maps / release tracking con `@sentry/vite-plugin` (requiere `SENTRY_AUTH_TOKEN` en CI)

### Manejo de errores

- [x] Conectar `catch` existentes al sistema de error tracking (no solo fallback silencioso)
- [ ] Evaluar retry/backoff simple antes de caer a fallback estático en Supabase

### Performance

- [ ] Lighthouse CI como step no bloqueante
- [ ] Chequeo de tamaño de bundle (`size-limit` o similar) en CI
- [ ] Evaluar `lazy()` para secciones pesadas si `ArmaTuPedido.tsx` se vuelve a partir
