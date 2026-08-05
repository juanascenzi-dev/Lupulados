# `contact.ts`

**Propósito:** schema de validación del formulario de contacto (no del checkout de pedido).

**Exports principales:**

- `contactSchema` — Zod object: `name` (mín. 2 caracteres), `email` (formato válido), `message` (mín. 10 caracteres), con mensajes de error en español.
- `ContactInput` — tipo inferido de `contactSchema`.

**Reglas de negocio / edge cases:**

- Es el único schema de contacto del dominio; no está relacionado con `checkout.ts` (que valida el formulario de pedido, con campos distintos como `eventDate`/`delivery`).

**Dependencias clave:** `zod`.

**Tests:** `contact.test.ts` (si existe) cubre este módulo.
