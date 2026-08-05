# `commercialSchemas.ts`

**Propósito:** define los schemas Zod que validan el shape completo de un `CommercialSnapshot` (sea el estático de [[commercialData]] o el reconstruido desde Supabase en [[commercialRepositoryMappers]]). Es la "puerta de entrada" que garantiza que cualquier snapshot que circula por la app cumple las invariantes de negocio, no solo los tipos TS.

**Exports principales:**

- Schemas por entidad: `businessProfileSchema`, `whatsAppChannelSchema`, `productSchema`, `productPresentationSchema`, `deliveryOptionSchema`, `extraOptionSchema`, `promotionSchema` — reflejan 1:1 las interfaces de `commercialTypes.ts`, con validaciones adicionales (regex de teléfono E.164 `54911XXXXXXXX`, fechas `YYYY-MM-DD`, `image` como URL absoluta o ruta que arranca con `/`).
- `commercialSnapshotSchema` — el snapshot completo, con `.superRefine` que valida invariantes cross-entidad (ver abajo).
- `validateCommercialSnapshot(input)` — `commercialSnapshotSchema.parse(input)`; lanza `ZodError` si el snapshot no es válido.

**Reglas de negocio / edge cases:**

- `promotionSchema` valida (vía `superRefine`) que si `type === "percentage"`, `value` esté en `[0, 1]` (fracción, no porcentaje 0-100) — la misma regla que en [[adminFormAdapters]], duplicada acá porque valida el snapshot completo, no solo el form de un promo individual.
- `commercialSnapshotSchema.superRefine` valida: IDs únicos de products/presentations/deliveryOptions/extraOptions/promotions, slugs únicos de products, que toda `productPresentation.productId` referencie un producto existente, y que a lo sumo **un** canal de WhatsApp activo tenga `isPrimary: true`.
- Los arrays `whatsappChannels`, `products`, `productPresentations`, `deliveryOptions`, `extraOptions` requieren `.min(1)` — un snapshot sin al menos un producto/canal/opción de entrega es inválido (falla al parsear), a diferencia de `promotions` que sí puede ser un array vacío.
- Cualquier snapshot inválido hace que `validateCommercialSnapshot` lance en vez de devolver un objeto parcial — el caller (típicamente carga inicial en `CommercialDataContext`) debe capturar el error y hacer fallback (ver política de logging, scope `"commercial-data-fallback"`).

**Dependencias clave:** `zod`. No importa de `commercialTypes.ts` (los schemas son la fuente de validación independiente, aunque deben mantenerse en sync manualmente con esos tipos).

**Tests:** `commercialSchemas.test.ts` (si existe) cubre este módulo.
