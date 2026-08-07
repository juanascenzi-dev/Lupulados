---
tags: [domain, guard]
related: ["[[orderFlow]]"]
---

# `orderWizardValidation.ts`

**Propósito:** dos funciones de validación del wizard de pedido que **intencionalmente no están unificadas**: `getOrderWizardValidationMessage` (mensaje de error en español para mostrar al usuario) y `getOrderWizardCanProceed` (booleano usado para habilitar/deshabilitar el botón "Siguiente"). El código documenta explícitamente que no son 1:1 derivables entre sí.

**Exports principales:**

- `OrderWizardValidationInput`, `getOrderWizardValidationMessage(input)` — según el `step` actual, devuelve el primer mensaje de error aplicable (o `null` si todo OK): paso 1 sin `orderType`, paso 2 sin cerveza elegida, paso 3 sin selección actual, paso 4 con validación de datos de checkout (nombre, fecha, entrega, dirección) — si hay más de un campo faltante a la vez, muestra un mensaje genérico ("Completá los datos obligatorios") en vez de listar cada uno.
- `OrderWizardCanProceedInput`, `getOrderWizardCanProceed(input)` — booleano de si se puede avanzar, con lógica **separada por rama** `isBeerCategory` (usa `orderType`/`hasSelectedBeer`/`hasCurrentSelection`/`hasCartItems`) vs. no-cerveza (usa `hasSelectedProduct`/`hasSelectedPresentation`/`hasCartItems`); en el paso 4, valida nombre+fecha+entrega+dirección igual que el mensaje, pero sin desglosar por campo.

**Reglas de negocio / edge cases:**

- El comentario JSDoc en el código es explícito: **no fusionar ambas funciones** sin confirmar que los comportamientos distintos son intencionales. Ejemplos concretos de la divergencia: el paso 1 de `getOrderWizardCanProceed` (no-cerveza) mira `hasSelectedProduct`, mientras que `getOrderWizardValidationMessage` en su paso 1 solo mira `orderType` (no tiene noción de "no-cerveza" separada); el paso 4 de `getOrderWizardCanProceed` nunca chequea explícitamente la ausencia de `delivery` como causa aislada, `getOrderWizardValidationMessage` sí.
- `getOrderWizardValidationMessage` paso 4 cuenta cuántos campos faltan (`missingFields`) antes de decidir el mensaje: si falta más de uno, es un mensaje genérico; si falta exactamente uno, es específico — UX pensada para no abrumar con una lista de errores.
- Cualquier cambio a una de las dos funciones debería revisarse contra la otra para ver si el desalineamiento documentado sigue siendo el comportamiento deseado.

**Dependencias clave:** `DeliveryOptionId` de `commercialTypes.ts`; `OrderType` de [[orderFlow]].

**Tests:** `orderWizardValidation.test.ts` (si existe) cubre este módulo — dada la complejidad de branches, es buen candidato a cobertura alta.
