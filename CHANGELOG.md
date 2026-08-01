# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Cada PR agrega su entrada bajo `[Unreleased]`; no se crean archivos nuevos en `docs/` para cambios puntuales (ver `CLAUDE.md`).

## [Unreleased]

### Added

- Opción para editar manualmente la cantidad de litros de cerveza por persona en la calculadora de barriles.

### Fixed

- En "Armá tu pedido", el banner de recomendación calculada ahora es más compacto y se oculta al llegar al paso de agregar productos al carrito, y se corrigió el grid del wizard (filas implícitas sin alto acotado) que causaba saltos de layout al ir sumando ítems.

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
