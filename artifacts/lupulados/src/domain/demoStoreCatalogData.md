---
tags: [domain, catalog]
related: ["[[configurableBeerPack]]", "[[demoStoreCatalog]]"]
---

# `demoStoreCatalogData.ts`

**Propósito:** datos crudos (hardcodeados) de los productos "demo" del storefront — vinos, fernet, whiskies, gaseosas, accesorios y combos que existen solo para mostrar la variedad de categorías que soporta el catálogo, marcados explícitamente como `demo: true`. Es el input que [[demoStoreCatalog]] transforma en `Product[]`/`ProductPresentation[]` reales.

**Exports principales:**

- `DemoProductInput` — `Product` sin `image`/`status`, más `presentations` embebidas (sin `id`/`productId`/`active`, que se generan al transformar).
- `demoProductImages` — mapa `productId → ruta de imagen` en `/store/...` (assets estáticos servidos desde `public/`).
- `demoProductsInput` — array de ~24 productos demo (vinos, fernet, vermut, whiskies, bourbon, gin, vodka, ron, tequila, licor, gaseosas, tónica, agua, soda, jugo, energizante, hielo, accesorios de alquiler, y 4 combos cerrados), cada uno con su(s) presentación(es) y precio(s).

**Reglas de negocio / edge cases:**

- Todos los productos tienen `demo: true` y casi todos `demoNote` con una aclaración visible en UI (ej. "Precio ilustrativo, sin stock real confirmado.") — esto es contenido de marketing/legal, no solo dato técnico; cambiarlo tiene implicancia de cara al usuario.
- Los combos (`demo-combo-*`) tienen `components` (array de strings descriptivos) y `demoNote` aclarando que "no descuenta stock por componente" — son líneas cerradas, no packs configurables como los de [[configurableBeerPack]].
- `demoProductImages` es un mapa separado de `demoProductsInput` (no embebido en cada producto) — si se agrega un producto demo nuevo sin agregar su entrada acá, [[demoStoreCatalog]] le asigna `image: ""` (`?? ""`) silenciosamente.

**Dependencias clave:** tipos `Product`/`ProductPresentation` de `commercialTypes.ts`.

**Tests:** no aplica en la práctica (son datos estáticos); si existe `demoStoreCatalogData.test.ts`, valida shape/consistencia de estos datos.
