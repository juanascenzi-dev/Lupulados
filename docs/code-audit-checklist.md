# Checklist de auditoría — Lupulados

Auditoría integral (seguridad, lógica de negocio, cobertura de tests, arquitectura, salud operativa) hecha el 2026-08-04 contra `main` (working tree limpio). Reporte completo con contexto y severidades: ver el artifact publicado en esa conversación; este archivo es el checklist de trabajo para ir tachando a medida que se resuelve cada punto.

Método: 2 revisiones especializadas en paralelo (seguridad; arquitectura y calidad) + ejecución en vivo de `typecheck`, `lint`, `test:coverage`, `build` y `pnpm audit` + verificación manual línea por línea de los hallazgos marcados ✅.

## Alto

- [ ] **Código promocional: falta `.trim()` en un flujo pero no en el otro.** ✅ verificado. `src/hooks/useOrderWizardState.ts:407` compara `promoInput.toUpperCase() === promotionConfig.code` (sin trim); `src/components/commercial/SharedCheckoutPanel.tsx:76` compara `promoInput.trim().toUpperCase() === code` (con trim). Un código con un espacio incidental se acepta en un flujo y se rechaza en el otro. Arreglo sugerido: extraer `matchPromoCode(input, code)` en `domain/` y que ambos flujos lo importen.
- [ ] **Promoción tipo "monto fijo" aplica pero descuenta $0.** ✅ verificado. `domain/businessConfig.ts:61`, `domain/commercialAdapters.ts:161` y `SharedCheckoutPanel.tsx:76` calculan la tasa de descuento con `type === "percentage" ? value : 0` en las tres — un `type: "fixed"` (opción que `components/admin/forms/PromotionForm.tsx:53` ofrece sin advertencia) siempre da 0. `domain/orderSummary.ts:117-118` además calcula `discountAmount = subtotal * discountRate`, asumiendo porcentaje en toda la arquitectura. Arreglo: implementar `discountAmount` para `"fixed"`, o sacar esa opción de `PromotionForm.tsx` hasta implementarlo; centralizar el cálculo en una sola función.
- [ ] **`SharedCheckoutPanel.tsx`, `StorePage.tsx`, `ConfigurableBeerPackBuilder.tsx` y `useEscapeToClose.ts` no tienen ningún test.** El flujo de compra de la tienda (storefront + checkout compartido) quedó sin cobertura mientras "Armá tu pedido" y la Calculadora sí recibieron tests de integración tras incidentes pasados. La divergencia del `.trim()` de arriba vive justo en uno de estos archivos. Siguiente paso natural: `SharedCheckoutPanel.test.tsx` siguiendo el patrón de `ArmaTuPedido.test.tsx`.

## Medio

- [ ] **18 dependencias con CVEs conocidos (`pnpm audit`: 2 low, 8 moderate, 8 high), todas en la cadena de build-tooling** (vite ≤7.3.4, postcss ≤8.5.17/8.5.22, picomatch, lodash vía `recharts`, @babel/core). Ninguna alcanzable en runtime de producción (SPA estática, sin dev-server expuesto). `esbuild` además está fijado a `0.27.3` por `override` en `pnpm-workspace.yaml` (versión con CVE conocido, bajo). Arreglo: `pnpm update`; revisar el override de esbuild.
- [ ] **Gate de cobertura agregado, no por archivo — esconde `commercialRepository.ts`.** `vitest.config.mjs:22-27` no tiene `perFile: true`. `commercialRepository.ts` (capa de I/O real contra Supabase) está en 54.61% statements / 42.55% functions; `adminContracts.ts`, `commercialRepositoryRows.ts`, `commercialTypes.ts`, `storePageConstants.ts`, `storePageFormatting.ts`, `contact.ts` están en 0%. El 70% pasa en CI igual porque el resto de `src/domain` compensa el promedio.
- [ ] **6 de 7 formularios admin sin test de su propio wiring.** `AdminDashboard.test.tsx` solo monta y envía `ProductForm`. La validación Zod de los 7 sí está testeada a nivel dominio (`adminFormAdapters.test.ts`), pero el wiring del componente (ej. el fix de `event.currentTarget` documentado en el CHANGELOG) solo se verifica end-to-end para uno de siete.
- [ ] **`components/ui/sidebar.tsx` (727 líneas, el archivo más grande de `src/`) es código muerto.** ✅ verificado sin consumidores fuera de sí mismo. Candidato a borrar (junto con `use-mobile.tsx` si no tiene otro consumidor).
- [ ] **`ConfigurableBeerPackBuilder.tsx` (477 líneas) quedó afuera del patrón hook + subcomponentes** aplicado a `ArmaTuPedido`, `AdminDashboard` y `Calculadora`. Feature posterior a la ronda grande de refactor. ~10 handlers inline + 3 `useState` en un solo archivo, sin tests.
- [ ] **Clamping de cantidad triplicado, techo hardcodeado en 2 de 3 sitios.** `domain/cartStorage.ts:14` (`MAX_CART_ITEM_QTY = 999`), `domain/productCatalog.ts:247-250` (`999` literal), `hooks/useOrderWizardState.ts:425` reimplementa a mano la misma fórmula de `normalizeCatalogQuantity`, que ese archivo ya importa y usa en la línea 436. Arreglo de una línea: usar el import existente.
- [ ] **`mockup-sandbox` participa de `typecheck`/`build` de CI** pese a describirse en CLAUDE.md como "no productivo" — un error ahí puede bloquear un PR que no toca la app principal. Evaluar excluirlo de los filtros en `package.json` raíz.

## Bajo

- [ ] Las tablas de catálogo dependen 100% de RLS sin segunda barrera (`grant insert, update` amplio a `authenticated` en `supabase/migrations/20260725120000_commercial_admin_foundation.sql:221`, restringido solo por la policy `is_admin()`). No explotable hoy; mitigado por el test de regresión `domain/supabaseMigration.test.ts`. Mantenerlo como gate obligatorio y sumarle cualquier tabla de catálogo nueva.
- [ ] `BusinessForm.tsx` es el único formulario admin sin validación Zod (`components/admin/forms/BusinessForm.tsx:28-41`).
- [ ] `attached_assets/` está trackeado y huérfano — el alias `@assets` (`vite.config.ts:48`, `vitest.config.mjs:13`) no se usa en ningún lado de `src/`. Candidato a borrar junto con el alias.
- [ ] `.replit` / `.replitignore` trackeados, vestigio del scaffold original en Replit sin evidencia de uso actual.
- [ ] `lib/*` y `lib/integrations/*` son globs muertos en `pnpm-workspace.yaml:2-4` (el directorio quedó vacío al eliminarse el backend).
- [ ] Regla ESLint `no-explicit-any` es `"warn"`, no `"error"` (`eslint.config.js:27`); `lint` corre sin `--max-warnings=0`.
- [ ] Los números de líneas que cita `CHANGELOG.md` para el refactor grande no coinciden con el git history real (ej. StorePage "604→465" vs. 584 real, `commercialRepository.ts` "664→324" vs. 388 real).
- [ ] La convención de commits (`tipo: descripción`) no se sigue en los últimos ~6 commits en `main` (ej. "arrglo", "Corrigo tests", "Limpieza de docs antiguos"). El proceso de fondo sí se respeta — esos commits actualizan `CHANGELOG.md` correctamente — es solo el formato del mensaje el que se relajó.

## Verificado, sin acción necesaria

Cosas que se revisaron con la misma profundidad que los hallazgos de arriba y están bien:

- `is_admin()` con `security definer` + `search_path` fijo — patrón correcto de Supabase.
- `lib/supabase/config.ts` rechaza proactivamente una service_role key pegada por error (`looksLikePrivateSupabaseKey`).
- `resolveAdminAccessState` falla cerrado ante error o `null`.
- Sentry con `sendDefaultPii: false`; los 7 call sites de `reportError()` no mandan PII.
- Los 2 únicos `console.*` de `src/` están gateados a `DEV` + `reportError()` — cumple la política de logging de `CLAUDE.md`.
- `whatsAppOrder.ts`: host fijo, teléfono validado por regex, `encodeURIComponent`, `rel="noopener noreferrer"`.
- Sin inyección SQL/PostgREST (query builder tipado en todos lados), sin secretos hardcodeados.
- `admin_users` / `admin_audit_log` sin grant de insert/update para `authenticated` — no hay auto-promoción a admin ni sabotaje del audit log posible vía cliente.
- Sin grant de `delete` en ninguna tabla (soft-delete only).
- Cero `any` explícito, `@ts-ignore`/`@ts-expect-error`, `eslint-disable` o `TODO`/`FIXME` reales en todo `src/`.
- CI (`.github/workflows/ci.yml`) y hooks de husky coinciden exactamente con lo documentado en `CLAUDE.md`.
- `mockup-sandbox` sin acoplamiento cruzado con la app principal.
- `typecheck`, `lint` (0 errores, 25 warnings menores), 389 tests (92.12% cobertura agregada en `src/domain`) y `build` de producción, todos en verde al momento de la auditoría.
