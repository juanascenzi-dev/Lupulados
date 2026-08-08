# Política de seguridad

## Alcance

Esta política cubre `artifacts/lupulados` (la app en producción). `artifacts/mockup-sandbox` es un sandbox de mockups no productivo y queda fuera de alcance.

## Cómo reportar una vulnerabilidad

Enviá un email a **julianascenzim@gmail.com** con el detalle (pasos para reproducir, impacto estimado, versión/commit afectado). No abras un issue público en GitHub para vulnerabilidades no divulgadas todavía.

No hay un SLA formal de respuesta por ahora (proyecto de un solo mantenedor), pero los reportes se toman en serio y se confirma su recepción.

## Mitigaciones ya activas

Antes de reportar algo, puede ser útil saber qué ya está cubierto:

- **Supply-chain de dependencias**: `pnpm-workspace.yaml` fija `minimumReleaseAge: 1440` (cuarentena de 24h para versiones nuevas de paquetes) y tiene `overrides` documentados para pins de seguridad puntuales (ej. `esbuild` fijado a `0.28.1` por GHSA-g7r4-m6w7-qqqr).
- **Secrets del lado del cliente**: `src/lib/supabase/config.ts` valida en runtime y rechaza proactivamente keys de Supabase que parezcan privadas filtradas (`sb_secret_`, `service_role`) antes de usarlas en el cliente.
- **Headers HTTP**: `artifacts/lupulados/vercel.json` define CSP, `X-Frame-Options` y headers relacionados para el deploy en Vercel.
- **Auditoría de dependencias**: se corre `pnpm audit` manualmente (ver `docs/code-audit-checklist.md` como precedente) y es parte del checklist de code review en `CLAUDE.md`.

Ver [CLAUDE.md](CLAUDE.md) para las convenciones completas del repo, incluyendo manejo de secrets y gestión de dependencias.
