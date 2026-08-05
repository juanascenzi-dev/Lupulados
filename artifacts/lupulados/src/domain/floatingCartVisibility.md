# `floatingCartVisibility.ts`

**Propósito:** decide si mostrar el botón flotante de carrito, en base a la ruta actual, el hash de la URL y si el wizard de pedido está activo — evita mostrarlo donde estorbaría o sería redundante.

**Exports principales:**

- `FloatingCartVisibilityInput` — `{ totalItems, pathname, hash, orderFlowActive }`.
- `shouldShowFloatingCart(input)` — `false` si el carrito está vacío, si no estamos en la home (`pathname !== "/"`), si el hash apunta a la sección `#arma-tu-pedido` (el wizard ya tiene su propio flujo de carrito visible ahí), o si `orderFlowActive` es `true`; `true` en cualquier otro caso.

**Reglas de negocio / edge cases:**

- Las 4 condiciones son excluyentes en cascada (`if...return false`) — cualquiera de ellas alcanza para ocultar el botón, no hace falta que se cumplan todas.
- El hash `"#arma-tu-pedido"` está hardcodeado como string literal — si esa sección se renombra en la UI, hay que actualizar este archivo a mano (no hay una constante compartida).

**Dependencias clave:** ninguna (módulo puro).

**Tests:** `floatingCartVisibility.test.ts` (si existe) cubre este módulo.
