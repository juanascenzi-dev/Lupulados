# `commercialTypes.ts`

**Propósito:** fuente de verdad de los tipos de dominio del catálogo comercial (productos, presentaciones, entregas, extras, promociones, canales de WhatsApp, perfil de negocio, snapshot agregado). Todo el resto de `src/domain` y buena parte de `src/` importa de acá.

**Exports principales:**

- Type aliases: `PricingStatus`, `ProductStatus`, `ProductCategory` (union cerrada de 16 categorías, incluye `beer`/`pack` y las bebidas de [[beverageMix]]), `PresentationType` (union de los 6 tipos estándar + `string & {}` para permitir extensiones sin perder autocompletado), `DeliveryOptionId`, `ExtraOptionId`, `PromotionType`.
- Interfaces de entidad: `BusinessProfile`, `WhatsAppChannel`, `Product`, `ProductPresentation`, `DeliveryOption`, `ExtraOption`, `Promotion`.
- `CommercialSnapshot` — el agregado completo que persiste/circula por la app: todas las entidades + `pricingRules.freeGlassesThreshold`.

**Reglas de negocio / edge cases:**

- `PresentationType` usa el patrón `X | (string & {})` para que TypeScript siga sugiriendo los 6 valores conocidos en autocompletado pero acepte cualquier otro string (necesario porque los productos demo de [[demoStoreCatalogData]] usan tipos de presentación custom como `"750ml"`, `"caja6"`, `"pack6"`).
- `Product.category` es una union cerrada (no soporta strings arbitrarios) — a diferencia de `PresentationType`, agregar una categoría nueva de producto requiere tocar este archivo y `commercialSchemas.ts` en conjunto.
- `Promotion.startDate`/`endDate` son `string | null | undefined` (fecha `YYYY-MM-DD` o ausente) — la ausencia de límite se modela como "sin restricción" en `commercialSelectors.ts`, no como error.
- Es un archivo de solo tipos, sin lógica ejecutable ni tests propios (el gate de cobertura de `src/domain` no aplica acá).

**Dependencias clave:** ninguna (es la base de la que dependen casi todos los demás módulos de `domain`).

**Tests:** no aplica (sin lógica ejecutable).
