# Arma tu pedido viewport-first

Los pasos de Armá tu pedido deben diseñarse mobile-first y viewport-first. Las acciones primarias, el total del carrito y el estado del paso deben permanecer accesibles. Las listas extensas deben desplazarse dentro de áreas controladas y no convertir el wizard en una página indefinidamente larga.

Principios de mantenimiento:

- La estructura principal del wizard debe separar cabecera, zona central flexible y barra de acciones.
- Usar `100dvh` con fallback razonable y restar el offset del header cuando corresponda.
- Aplicar `min-height: 0` en contenedores flex/grid que alojan scroll interno.
- Mantener el carrito como panel de altura controlada: encabezado visible, lista desplazable y total visible.
- En mobile, priorizar el contenido del paso y mostrar el carrito como resumen colapsable.
- No resolver problemas de alto reduciendo excesivamente tipografías o áreas táctiles.
- Mantener controles táctiles cercanos a 44 px.
- Evitar `position: fixed` global para acciones del wizard; deben quedar dentro del ciclo de vida de Armá tu pedido.

Reglas para secciones compactas:

- Cuando una sección compacta es destino directo desde la navbar, debe ocupar correctamente el viewport disponible.
- No debe aparecer accidentalmente el inicio de la sección siguiente al aterrizar en desktop normal.
- Usar `min-height` basada en `100dvh` y `--site-sticky-offset` cuando corresponda.
- No usar alturas fijas que puedan cortar contenido; si el contenido crece, debe conservar scroll natural.
- El `data-section-entry` de una sección compacta puede ser un sentinel superior cuando centrar el bloque de contenido haría perder alto útil al navegar.

Reglas para animaciones:

- El contenido esencial no puede requerir un mini scroll para activarse.
- La entrada directa a una sección debe mostrar el contenido prioritario sin esperar un cruce mínimo de `IntersectionObserver`.
- Ajustar `viewport`, `amount` o `rootMargin` cuando una animación deje contenido principal invisible al aterrizar.
- Respetar `prefers-reduced-motion` y evitar saltos de layout o reanimaciones innecesarias.

Regla permanente de codificación:

- Todos los archivos textuales deben mantenerse en UTF-8.
- Evitar secuencias mojibake como los caracteres Unicode `U+00C3`, `U+00C2` o `U+00E2` en textos fuente, catálogos, fallbacks, tests y documentación funcional.
- Cualquier cambio de textos debe pasar la validación automatizada de mojibake.
- No confundir UTF-8 con la política LF/CRLF: los warnings de finales de línea son un problema distinto.

## Navegacion por secciones y offset de encabezados sticky

Regla permanente del proyecto: todo destino accesible desde la navbar, CTA o enlace interno debe quedar completamente visible debajo del banner promocional y la navbar. La navegacion debe centralizar el offset del header visible, funcionar con el banner abierto o cerrado y evitar numeros magicos independientes por seccion.

Causa raiz corregida: la navegacion ya usaba `scrollToSection`, `data-section-entry` y variables CSS, pero el offset dependia de una variable que podia quedar desfasada respecto del header realmente visible. En flujos con mucho scroll, banner abierto/cerrado, hash directo o secciones lazy, el calculo podia dejar el titulo de `servicios` o `arma-tu-pedido` debajo de la navbar/banner.

Estrategia elegida:

- `src/lib/sectionNavigation.ts` sigue siendo la unica utilidad de navegacion entre secciones.
- El offset visible se publica como `--site-sticky-offset` y se mantiene tambien `--site-header-offset` como alias compatible.
- `Navbar` marca el header con `data-site-navbar`; la utilidad mide `getBoundingClientRect().bottom` cuando existe y usa la variable CSS como fallback.
- `scrollToSection(id, { updateHash: true })` desplaza manualmente, respeta `prefers-reduced-motion`, actualiza hash con `history.pushState` y evita el salto nativo de anchors.
- `Landing` restaura hash directo, recarga con hash, atras/adelante y resize mediante `getSectionIdFromHash` y la misma utilidad central.
- Los fallbacks lazy usan `site-section` y `data-section-entry` para conservar el offset mientras carga una seccion.

Secciones auditadas:

- Inicio: destino de logo/navbar, seccion hero de pantalla completa.
- Servicios: seccion compacta con sentinel superior y `min-height: calc(100dvh - var(--site-sticky-offset))`; titulo y cuatro tarjetas principales quedan visibles en desktop cuando la altura lo permite sin mostrar Cervezas accidentalmente.
- Cervezas: encabezado, filtros y comienzo de grilla usan `data-section-entry`; la informacion adicional queda como contenido secundario.
- Calculadora: panel interno es el entry para que el titulo y controles iniciales no queden tapados.
- Arma tu pedido: el entry es `wizardTopRef`; mantiene titulo, descripcion, aviso, stepper e inicio del paso debajo del header.
- Eventos: entry superior conserva imagen local y CTA de eventos.
- Como funciona: sentinel superior, compactacion moderada y animaciones con margen de entrada anticipado mantienen titulo y cinco pasos visibles en desktop cuando la altura lo permite.
- FAQ: entry superior mantiene titulo y primeras preguntas visibles.
- Contacto: entry superior mantiene titulo, texto y comienzo del formulario/info.
- Tienda: en navbar es una ruta (`/tienda`), no un anchor de la home; conserva su propio skip link interno.

Comportamiento esperado:

- Desktop/tablet: el header completo de cada seccion queda visible con un margen pequeno definido por `--section-entry-gap`; las secciones compactas revisadas aprovechan `100dvh - --site-sticky-offset`.
- Mobile: el titulo y el comienzo del contenido quedan visibles; no se fuerza que secciones largas entren completas.
- Banner abierto/cerrado: la siguiente navegacion mide el navbar real y recalcula el offset; no queda reservado el alto de un banner cerrado.
- Hash e historial: hash directo, recarga con hash, atras/adelante y resize vuelven a usar `scrollToSection` sin salto nativo doble.
- Reduced motion: `getMotionAwareScrollBehavior()` devuelve `auto` si el usuario prefiere menos movimiento.

Hover de tarjetas de producto:

- Las tarjetas iniciales de Arma tu pedido (Barril, Growler, Pack Porrones, Pack Degustacion) ya no usan `scale` en hover.
- El hover usa una elevacion leve y sombra sin desplazar layout, invadir tarjetas vecinas ni recortar el borde seleccionado.
- `focus-visible` queda explicito con ring y offset; en dispositivos tactiles no queda un zoom pegado.

Archivos modificados en esta pasada:

- `src/lib/sectionNavigation.ts`
- `src/lib/sectionNavigation.test.ts`
- `src/index.css`
- `src/pages/Landing.tsx`
- `src/pages/Landing.test.ts`
- `src/components/Navbar.tsx`
- `src/components/Navbar.test.ts`
- `src/components/PromoBanner.tsx`
- `src/components/RouteFallback.tsx`
- `src/components/Services.tsx`
- `src/components/Hero.tsx`
- `src/components/Footer.tsx`
- `src/components/CartFloating.tsx`
- `src/components/ArmaTuPedido.tsx`
- `src/domain/storeCatalog.test.ts`

Pruebas requeridas para cerrar la tarea:

- `git diff --check`
- `pnpm.cmd run typecheck`
- `pnpm.cmd run test`
- `pnpm.cmd run build`
- `pnpm.cmd dev`
