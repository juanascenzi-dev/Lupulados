# `format.ts`

**Propósito:** único helper de formateo de precios de todo el dominio: `formatPrice`, usado por prácticamente todos los módulos que muestran montos en pesos argentinos.

**Exports principales:**

- `formatPrice(price)` — `"$" + price.toLocaleString("es-AR")` (separador de miles con punto, sin decimales por defecto según configuración regional `es-AR`).

**Reglas de negocio / edge cases:**

- No maneja `null`/`undefined`/`NaN` explícitamente — un valor no numérico se comporta según lo que haga `Number.prototype.toLocaleString` nativo (ej. `NaN.toLocaleString("es-AR")` → `"NaN"`, produciendo `"$NaN"`). Los callers son responsables de pasar un número válido.
- No incluye centavos/decimales por defecto (`toLocaleString` sin opciones usa el default de la locale, que para ARS típicamente no fuerza dos decimales) — si un precio tiene centavos, el redondeo de presentación queda a criterio de `toLocaleString`, no de este módulo.

**Dependencias clave:** ninguna (módulo puro, un solo export).

**Tests:** `format.test.ts` (si existe) cubre este módulo.
