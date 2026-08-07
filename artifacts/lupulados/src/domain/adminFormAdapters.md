---
tags: [domain, adapter]
related: ["[[adminContracts]]"]
---

# `adminFormAdapters.ts`

**Propósito:** capa de validación y (de/)serialización entre los `<form>` HTML del panel admin y los tipos de dominio/`adminContracts.ts`. Define los schemas Zod de cada entidad editable y las funciones `parse*Form` / `parse*UpdateForm` / `*ToFormValues` que la UI usa para ir de `FormData` a input tipado y viceversa.

**Exports principales:**

- `admin*FormSchema` (product, presentation, delivery, extra, promotion, whatsApp) — schemas Zod con mensajes de error en español, cada uno con sus propias reglas de coerción (`nonNegativeNumber`, `positiveNumber`, `sortOrder`, `dateOrNull`, etc.).
- `parse*Form(input)` / `parse*UpdateForm(input)` — parsean `FormData | Record<string, unknown>` contra el schema correspondiente y devuelven el input tipado (`Create*Input`/`Update*Input` de [[adminContracts]]); lanzan `ZodError` si la validación falla.
- `*ToFormValues(entity)` — el camino inverso: de la entidad de dominio a los valores planos que precargan el formulario de edición.
- `getFirstZodError(error, fallback)` — extrae el primer mensaje de un `ZodError` (o `error.message`, o `fallback`) para mostrarlo en la UI.

**Reglas de negocio / edge cases:**

- `code` de promoción se normaliza a mayúsculas (`.transform(value => value.toUpperCase())`) en el schema, no en el caller — cualquier código que entra por este path ya llega uppercased.
- `adminPromotionFormSchema`/`adminPromotionUpdateFormSchema` validan con `superRefine` que: si `type === "percentage"`, `value` esté en `[0, 1]` (fracción, no 0-100); y que `startDate <= endDate` si ambas están presentes.
- `parseRequiredNumber`/`parseOptionalNumber` tratan `""` (string vacío) como `NaN`/`null` respectivamente antes de la validación Zod, para que un campo numérico vacío dé un mensaje de "obligatorio" en vez de "no es un número".
- `parseBoolean` acepta `true`, `"true"` y `"on"` (el valor que manda un `<input type="checkbox">` nativo dentro de `FormData`).
- `assertProductExists` lanza si `parsePresentationForm`/`parsePresentationUpdateForm` referencian un `productId` que no está en la lista de productos pasada — evita crear presentaciones huérfanas desde un form desincronizado.
- `CreateDeliveryOptionInput`/`CreateExtraOptionInput` no llevan `id` explícito en su tipo (ver [[adminContracts]]), pero sus schemas sí piden `id` — la coherencia depende del caller.

**Dependencias clave:** tipos de [[adminContracts]] y `commercialTypes.ts`; `zod` para todo el parsing/validación.

**Tests:** no existe `adminFormAdapters.test.ts` en el momento de este doc.
