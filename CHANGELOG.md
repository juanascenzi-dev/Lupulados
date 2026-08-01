# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada PR agrega su entrada bajo `[Unreleased]`; no se crean archivos nuevos en `docs/` para cambios puntuales (ver `CLAUDE.md`).

## [Unreleased]

### Added

- Opción para editar manualmente la cantidad de litros de cerveza por persona en la calculadora de barriles.
- `lib/db/src/schema` ahora define en Drizzle las 9 tablas del esquema comercial/admin (antes vacío), espejando `supabase/migrations/20260725120000_commercial_admin_foundation.sql` (columnas, checks, únicos, FK). No se tocaron endpoints de `api-server`; el frontend sigue consultando Supabase directamente.
- Se agregó infraestructura de tests (vitest) a `lib/db` y `artifacts/api-server`, antes sin ningún test: sanity checks del esquema recién portado y de sus `insertXSchema` (drizzle-zod), y un test del endpoint `GET /api/healthz` con `supertest`.

### Changed

- Se recalibraron los litros/persona de la mezcla de bebidas espirituosas (`BEVERAGE_LITERS_PER_PERSON`), que hasta ahora eran un placeholder sin contrastar contra ninguna referencia, y ahora también escalan con la intensidad del evento (tranqui/normal/intensa/festival), igual que la cerveza.
- Se extrajo un componente `QuantityStepper` reutilizable (botón − / cantidad / botón +) y se unificaron los bloques de barril y growler en "Armá tu pedido" en un único `BeerPresentationLineCard`, reemplazando ocho implementaciones inline casi idénticas repartidas entre el wizard y el pack configurable de porrones.
- `BeerPresentationLineCard` se movió de `ArmaTuPedido.tsx` a su propio archivo (`components/BeerPresentationLineCard.tsx`), como componente exportado y reutilizable, reduciendo el tamaño del wizard. (La fila de producto del pack configurable de porrones no se unificó con este componente porque tiene semántica distinta: ahí la cantidad edita directamente la composición del pack, sin botón "Agregar al pedido" separado.)
- Se refactorizaron los seis archivos más largos del proyecto (sin cambios de comportamiento), moviendo componentes presentacionales, constantes, helpers puros y orquestación de estado a módulos propios en `components/`, `domain/` y el nuevo `hooks/`: `ArmaTuPedido.tsx` (2383→1962 líneas; se extrajeron a `components/order-wizard/` los selectores de categoría/producto/presentación y los visuales del wizard, y a `domain/` los helpers de formateo de línea de carrito y las constantes del wizard — `LiveOrderSummary` quedó inline porque `storeCatalog.test.ts` verifica literales de su código fuente en ese archivo), `AdminDashboard.tsx` (1353→498; nuevas `components/admin/` y `components/admin/forms/` para las primitivas y los siete formularios por entidad, y `hooks/useAdminDashboardData.ts` para el estado y las mutaciones), `Calculadora.tsx` (971→397; nuevo `components/ui/numeric-stepper-field.tsx` que generaliza el patrón −/input/+ con slider y paso decimal, bloques presentacionales en `components/calculadora/` y `hooks/useCalculadoraState.ts` para el estado y los cálculos derivados), `commercialRepository.ts` (664→324; tipos de fila, mappers row↔dominio y helpers genéricos de Supabase separados en `domain/commercialRepositoryRows.ts`, `commercialRepositoryMappers.ts` y `supabaseRepositoryUtils.ts`), `demoStoreCatalog.ts` (522→80; datos semilla movidos a `domain/demoStoreCatalogData.ts`) y `StorePage.tsx` (604→465; filtro extraído a `components/store/StoreFilterBar.tsx`, constantes y formateo a `domain/storePageConstants.ts`/`storePageFormatting.ts`, y `hooks/useEscapeToClose.ts` reemplaza dos efectos duplicados — `ProductVisual`/`ProductCard`/`ConfigurablePackStoreCard` quedaron inline por la misma razón que `LiveOrderSummary`).

### Fixed

- En "Armá tu pedido", el banner de recomendación calculada ahora es más compacto y se oculta al llegar al paso de agregar productos al carrito, y se corrigió el grid del wizard (filas implícitas sin alto acotado) que causaba saltos de layout al ir sumando ítems.
- En "Armá tu pedido" (desktop), la grilla de estilos y el panel "Tu pedido" ya no quedan acotados a la altura de un viewport con scroll interno propio: ahora la sección crece con el contenido y es la página la que scrollea, sin necesidad de scrollear dentro de esas cajas para ver todo.
- En "Armá tu pedido" (mobile), el contador de pasos ya no salta de "Paso 1 de 5" a "Paso 3 de 5" al elegir pack degustación o porrón configurable: ahora muestra la fase real ("Paso X de 3"), igual que la versión desktop.
- En "Armá tu pedido", el botón "Agregar otro producto" para barril y growler ya no resetea el tipo de pedido elegido: vuelve directo a la selección de estilo, sin obligar a re-elegir "Barril"/"Growler" para pedidos con varios estilos.
- `storeCatalog.test.ts` quedó desactualizado tras el refactor de `BeerPresentationLineCard`: seguía esperando la clase `lg:h-[var(--wizard-viewport-height)]` (removida al pasar el grid a `auto_auto_auto`) y `overflow-hidden` en vez del `overflow-x-hidden` actual. Se actualizaron las aserciones para reflejar el layout vigente.

### Removed

- Se eliminó el scaffold de backend propio que quedó sin usar desde el commit inicial (`artifacts/api-server`, `lib/db`, `lib/api-zod`, `lib/api-client-react`, `lib/api-spec`), ya que el proyecto persiste datos vía Supabase directamente desde el cliente y ese backend nunca llegó a tener rutas de negocio. También se quitó `replit.md`, que documentaba exclusivamente esa arquitectura descartada.

## Historial previo (migrado desde `docs/*.md`)

Estas entradas resumen cambios ya hechos antes de adoptar este changelog. El detalle completo queda en los `docs/*.md` referenciados.

- **Solidez técnica de la calculadora de barriles** — fórmula de litros movida al dominio, fix de inputs numéricos que rompían con `NaN`, optimización del algoritmo de recomendación de barriles, tamaño mínimo de barril del catálogo ajustado. Ver `docs/barrel-calculator-hardening.md`.
- **Precisión de precio por estilo de cerveza** — precio real por estilo en la calculadora en vez de un valor genérico. Ver `docs/barrel-calculator-price-accuracy.md`.
- **Catálogo reactivo y fixes de UX/copy** — corrige bug de arquitectura del catálogo no reactivo y dos fixes de copy/UX. Ver `docs/barrel-calculator-reactive-pricing-ux-fixes.md`.
- **Calibración de consumo** — multiplicadores de litros/persona recalibrados con benchmarks reales de asados/fiestas. Ver `docs/barrel-calculator-consumption-calibration.md`.
- **Litros por persona personalizables** — permite pisar manualmente la calibración de consumo para casos puntuales. Ver `docs/barrel-calculator-custom-liters-per-person.md`.
- **Desglose por género y mezcla de bebidas** — segmentación opcional adicional del consumo estimado. Ver `docs/barrel-calculator-gender-and-beverage-mix.md`.
- **Fundación de administración** — Supabase como fuente persistente de datos comerciales, con fallback estático. Ver `docs/admin-foundation.md` y `docs/admin-setup.md`.
- **Operaciones de Supabase** — convenciones de migraciones. Ver `docs/supabase-operations.md`.
