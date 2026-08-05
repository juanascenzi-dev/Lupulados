# `orderWizardConstants.ts`

**Propósito:** constantes de configuración y navegación del wizard de pedido (pasos, categorías de acceso rápido, guard de activación de WhatsApp, decoración visual de burbujas), más la lógica de qué paso sigue/precede saltando el paso 2 para ciertos tipos de orden.

**Exports principales:**

- `Step` — `1 | 2 | 3 | 4 | 5`.
- `PHASE_LABELS` — `["Productos", "Datos", "Confirmacion"]`, las 3 fases visibles del wizard (agrupan los 5 steps internos).
- `WHATSAPP_ACTIVATION_GUARD_MS` (1500) — cooldown para el botón de enviar por WhatsApp, consumido junto con [[activationGuard]].
- `QUICK_ORDER_CATEGORIES` — categorías que aparecen como acceso rápido en el selector (no incluye todas las `ProductCategory`, ej. excluye `aperitif`, `liqueur`, `water`, `ice`).
- `CONFIGURABLE_PACK_ORDER_TYPE` — `"porrón"`, el `OrderType` que dispara el flujo de pack configurable.
- `BUBBLES` — array de 12 elementos con propiedades aleatorias (`size`, `left`, `delay`, `duration`) para la animación decorativa de burbujas del fondo.
- `getNextWizardStep(step, isBeerCategory, orderType)` / `getPrevWizardStep(step, isBeerCategory, orderType)` — avanzan/retroceden el step, saltando el paso 2 (selección de cerveza puntual) cuando `orderType` es `"paquete"` o `"porrón"` (`SKIP_STEP_TWO_ORDER_TYPES`) y estamos en categoría cerveza.

**Reglas de negocio / edge cases:**

- `BUBBLES` se genera **una sola vez al importar el módulo** (`Math.random()` en top-level) — todas las instancias/renders de la animación comparten el mismo set de burbujas hasta que se recargue la página; no es un valor que se regenere en cada render.
- El salto de paso 2 solo aplica `isBeerCategory` — para categorías no-cerveza el wizard siempre pasa por los 3 pasos secuenciales sin saltos.
- `getNextWizardStep`/`getPrevWizardStep` clampan el resultado a `[1, 5]` con `Math.min`/`Math.max`, así que nunca hace falta que el caller valide el rango por separado.

**Dependencias clave:** `OrderType` de [[orderFlow]]; `ProductCategory` de `commercialTypes.ts`.

**Tests:** `orderWizardConstants.test.ts` (si existe) cubre `getNextWizardStep`/`getPrevWizardStep`.
