---
tags: [domain, catalog]
related: ["[[commercialSchemas]]", "[[demoStoreCatalog]]"]
---

# `commercialData.ts`

**Propósito:** fuente de datos comerciales **estática** (hardcodeada) usada como catálogo demo/fallback cuando no hay conexión a Supabase o durante desarrollo/tests. Define el `commercialSnapshot` completo: perfil de negocio, canales de WhatsApp, productos, presentaciones, entregas, extras y una promoción de ejemplo.

**Exports principales:**

- `commercialSnapshot` — un `CommercialSnapshot` completo y validado (`validateCommercialSnapshot` de [[commercialSchemas]]), construido a partir de 8 productos de cerveza hardcodeados (`productsWithPrices`, con precios por las 6 presentaciones estándar) más los productos demo de [[demoStoreCatalog]], entregas fijas (fábrica gratis, Zona Norte, CABA/Zona Sur) y extras fijos (chopera, hielo, vasos).

**Reglas de negocio / edge cases:**

- Es el **fallback de último recurso**: `CommercialDataContext` usa este snapshot cuando Supabase no está disponible o falla la carga (ver política de logging del proyecto, scope `"commercial-data-fallback"`). Cambiar precios/productos acá no afecta producción si Supabase está configurado — solo afecta el modo demo/offline/tests.
- `getBeerPresentationCommercialFields` asigna metadata de comparación de precios (`comparisonGroup`/`comparisonQuantity`/`comparisonUnit`) distinta según el prefijo del `presentationType` (`barril*`, `growler*`, `porron500ml`) — usada en otra parte de la UI para mostrar "precio por litro" comparable entre presentaciones.
- El objeto final se valida con Zod (`validateCommercialSnapshot`) al momento del import — si el shape hardcodeado está mal formado, **falla al cargar la app**, no en runtime tardío.
- La promoción de ejemplo (`PRIMERABIRRA`, 10% descuento) vive acá, no en Supabase, cuando se usa este snapshot estático.

**Dependencias clave:** `validateCommercialSnapshot` de [[commercialSchemas]]; `demoStorePresentations`/`demoStoreProducts` de [[demoStoreCatalog]]; tipos de `commercialTypes.ts`.

**Tests:** `commercialData.test.ts` (si existe) cubre este módulo.
