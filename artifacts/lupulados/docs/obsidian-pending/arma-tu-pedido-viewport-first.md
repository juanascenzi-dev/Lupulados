# Arma tu pedido viewport-first

Esta nota tambien cubre la Calculadora porque ambos son modulos interactivos abiertos desde la navbar. La regla estricta aplica a experiencias donde el usuario completa una tarea; no obliga a que landings informativas como Inicio, Eventos, FAQ o Contacto entren artificialmente en una sola pantalla si su contenido es editorial o secuencial.

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

## Estandar aprobado para Calculadora

Este patron queda aprobado como referencia para la Calculadora y para futuros modulos interactivos similares:

- Los modulos interactivos clave deben ser viewport-first: la estructura principal se piensa primero contra el alto y ancho disponibles.
- Las tarjetas de configuracion mantienen una estructura visual estable; ninguna interaccion interna debe hacer que la tarjeta crezca, se achique o cambie su composicion base.
- Las acciones secundarias abren `Dialog`, pop-up, drawer o un paso mobile; no expanden tarjetas ni empujan el resto del layout.
- No debe existir scroll horizontal en la Calculadora ni en sus modales.
- En desktop, la Calculadora se resuelve en una sola vista principal de dos columnas: evento a la izquierda, recomendacion y configuraciones compactas a la derecha.
- En mobile, la Calculadora puede resolverse por pasos internos, conservando estado al avanzar, volver y abrir/cerrar modales.
- Los resumenes breves viven dentro de tarjetas compactas; los detalles extensos viven en modales con scroll interno.
- La informacion principal no se oculta detras de modos inventados. En invitados, total, hombres y mujeres deben permanecer visibles a la vez.
- Litros por persona, preferencias de cerveza y mezcla de bebidas se editan o consultan mediante modales, nunca con contenido inline expansivo.
- Antes de cambiar estos patrones, revisar esta documentacion, las referencias visuales aprobadas y los tests de dominio relacionados.

## Calculadora viewport-first

Estructura esperada:

- Desktop: `viewport-task-section` + `viewport-task-container`, dos columnas y paneles internos con `min-height: 0`. La columna izquierda concentra invitados, duracion, estilo, litros/persona y preferencias. La columna derecha mantiene recomendacion, verano y mezcla en tarjetas de ancho completo.
- Mobile: flujo por pasos internos. El estado debe conservarse al avanzar, volver, abrir/cerrar modales y cambiar breakpoint.
- Acciones principales: no deben quedar tapadas por navbar, carrito, WhatsApp ni safe areas.
- No usar `100vh` para el modulo; usar `100dvh` y `--site-sticky-offset`.

Reglas de compactacion horizontal desktop:

- Aprovechar ancho antes de agregar altura: cuando dos contenidos entren razonablemente lado a lado, no deben ocupar dos filas completas.
- Combinar datos relacionados en filas horizontales antes de recortar contenido principal.
- Las tarjetas no cambian de tamano por interaccion; los detalles y ediciones secundarias se muestran en modales.
- En desktop se debe evitar el apilamiento innecesario de tarjetas compactas.
- `Es verano?` ocupa el ancho completo debajo de la recomendacion y explica claramente el ajuste +25%.
- `Litros por persona` y `Preferencias` comparten una fila en la columna izquierda y deben tener altura similar.
- `Mezcla de bebidas` ocupa el ancho inferior de la columna derecha, debajo de `Es verano?`; es la unica tarjeta de resumen/configuracion de proporciones.
- Dentro de `Recomendacion`, `Sugerencia de formatos` y `Mezcla actual` comparten una fila de dos bloques.
- Dentro de `Recomendacion`, `Estimado desde` y el precio comparten una fila compacta.
- En viewports bajos de desktop, se compactan paddings, gaps y textos secundarios antes de ocultar tarjetas o crear scroll horizontal.

Reglas de shell mobile para Calculadora:

- La seccion `#calculadora` debe comportarse como un shell cerrado en mobile: alto basado en `100dvh - --site-sticky-offset`, sin que el documento cargue el scroll del paso.
- El panel interno usa flex column con cabecera, tabs, contenido central y footer de acciones como zonas separadas.
- Cabecera, tabs y footer se mantienen fuera del area scrolleable del paso y deben quedar visibles durante todo el flujo.
- Solo `.calculator-mobile-step` puede hacer scroll vertical interno; debe tener `min-height: 0`, `overflow-y: auto`, `overflow-x: hidden`, `scrollbar-gutter: stable` y `overscroll-behavior: contain`.
- Al cambiar de paso, resetear solo `calculator-mobile-step.scrollTop`; no usar `window.scrollTo` ni mover el documento.
- El footer mobile vive dentro del shell (`.calculator-mobile-actions`), con borde superior, fondo propio y padding de `safe-area-inset-bottom`.
- `Arma tu pedido` no debe asomar al usar la Calculadora en mobile; si una resolucion baja necesita aire extra, ajustar el shell y no empujar con margenes globales.
- Los flotantes deben reconocer Calculadora mobile como flujo activo: carrito oculto y WhatsApp elevado por encima del footer.
- Los cambios de step por tabs, Volver, Continuar o tarjetas resumen deben conservar `window.scrollY` estable.
- Las pruebas responsive deben incluir 360x800, 390x844, 393x852, 412x915, 430x932 y 490x830, ademas de desktop 1366x768, 1440x900, 1600x900 y 1920x1080.

Reglas finales de espaciado desktop para Calculadora:

- Aprovechar el espacio libre del contenedor mediante gaps, padding y filas estiradas de forma controlada; no dejar bloques vacios al pie del panel.
- No comprimir titulo, descripcion, acciones y toggles de una tarjeta en una unica linea cuando el ancho es limitado.
- Acciones, badges y toggles usan `flex-shrink: 0`; los textos flexibles usan `min-width: 0` y truncado cuando corresponde.
- Los controles nunca pueden superponerse con titulos o descripciones.
- Tarjetas equivalentes deben compartir altura, estructura base y ritmo visual mediante una clase comun.
- Los bordes inferiores de tarjetas correspondientes deben alinearse; en la Calculadora, `Litros por persona`, `Preferencias` y `Mezcla de bebidas` deben cerrar en la misma linea visual.
- Los gaps responden a una jerarquia comun: gap principal entre columnas, gap vertical entre bloques, gap interno entre tarjetas y gap compacto entre controles.
- El espaciado puede aumentar en viewports altos y compactarse en viewports bajos, pero 1366x768 no puede desbordar.
- El layout desktop aprobado se preserva: izquierda evento/configuracion, derecha recomendacion/preferencias/mezcla.
- Las interacciones no deben cambiar el tamano exterior de las tarjetas.
- Mobile y desktop tienen reglas independientes; un ajuste desktop debe validarse rapido en mobile para confirmar que no rompe el shell cerrado.

Regla final de organizacion de la Calculadora:

- La tarjeta independiente `Desglose de bebidas` fue eliminada porque duplicaba informacion de `Mezcla de bebidas` y de `Mezcla actual` dentro de la recomendacion.
- `Mezcla de bebidas` es la unica tarjeta de resumen y configuracion de proporciones; el detalle completo vive en su modal.
- `Preferencias` comparte la fila inferior izquierda con `Litros por persona`.
- En `Preferencias`, la accion `Elegir estilos` queda debajo del resumen para evitar solapes con titulo o texto dinamico.
- `Es verano?` ocupa todo el ancho de la columna derecha debajo de la recomendacion.
- `Mezcla de bebidas` ocupa todo el ancho de la columna derecha debajo de `Es verano?`.
- Las tarjetas equivalentes mantienen altura y bordes inferiores alineados.
- Nuevas funciones deben incorporarse mediante pasos, paginacion interna o modales; no deben comprimir controles ni hacer crecer indefinidamente la pagina.
- Las referencias visuales externas usadas para layout son estructurales, no cambios de identidad visual.
- Los estilos actuales de Lupulados se preservan: colores, tipografias, radios, fondos, botones e iconografia.
- El contenido dinamico nunca debe cambiar el tamano exterior de una tarjeta principal.
  Reglas de contenido dinamico:

- No renderizar listas completas de estilos, bebidas, litros personalizados o desglose dentro del panel principal.
- Mostrar resumen compacto y botones claros como "Personalizar", "Elegir estilos" o "Configurar".
- El detalle completo va en `Dialog`/drawer con scroll interno; no usar acordeones ni dropdowns inline para informacion secundaria.
- Los modales deben tener titulo accesible, cierre visible, Escape, foco atrapado, retorno de foco y bloqueo de scroll de fondo.

Reglas de negocio:

- La duracion se guarda como minutos totales y se formatea en dias, horas y minutos. No volver a limitarla a 12 o 24 horas.
- Duracion cero no calcula: debe mostrar validacion clara.
- "Es verano" es un control de ancho completo en desktop y mantiene el ajuste real vigente de +25% definido en `beerConsumptionEstimate.ts`.
- Estilos de cerveza son preferencia multiple. No volver a seleccion unica ni hacer que modifiquen litros.
- La mezcla de bebidas se edita en modal transaccional; cancelar conserva el estado anterior.
- No asumir cerveza igual a 100% obligatorio. Cerveza es el remanente implicito cuando el usuario no asigna otras bebidas.
- La Calculadora estima litros, formatos y precio sujeto a confirmacion; "Arma tu pedido" resuelve seleccion exacta de productos, formatos y estilos.

Archivos que revisar antes de tocar la Calculadora:

- `src/components/Calculadora.tsx`
- `src/hooks/useCalculadoraState.ts`
- `src/components/calculadora/ResultPanel.tsx`
- `src/components/calculadora/BeerStylePicker.tsx`
- `src/components/calculadora/BeverageMixPicker.tsx`
- `src/components/ui/dialog.tsx`
- `src/domain/eventDuration.ts`
- `src/domain/beverageMix.ts`
- `src/domain/beerStylePreference.ts`
- `src/domain/barrelCalculator.ts`
- `src/domain/beerConsumptionEstimate.ts`
- `src/index.css`
- `src/pages/Landing.tsx`
- `src/components/ArmaTuPedido.tsx`

Advertencias para futuros cambios:

- No convertir nuevamente la calculadora en una pagina vertical interminable.
- No renderizar listas dinamicas completas dentro del panel principal.
- No volver a imponer seleccion unica de estilos ni tratar estilos como reserva exacta de sabores.
- No limitar la duracion a 12 o 24 horas.
- No asumir cerveza igual a 100% de la mezcla inicial cuando el usuario configuro bebidas extra; cerveza sigue siendo el remanente implicito.
- No modificar formulas, porcentajes o reglas comerciales sin revisar documentacion y tests.
- No agregar controles flotantes sin probar solapamientos responsive.

QA responsive requerido antes de aprobar cambios:

- Desktop: 1366x768, 1440x900 y 1920x1080.
- Mobile: 360x800, 390x844 y 412x915.
- Verificar que no exista scroll horizontal.
- Verificar que el flujo principal no dependa de un scroll vertical largo del documento.
- Verificar que botones principales esten visibles y utilizables.
- Verificar que modales no generen scroll de fondo.
- Verificar que contenido dinamico no expanda la pagina principal.
- Si se incorpora Playwright/Cypress, automatizar estas resoluciones. Hoy el proyecto no tiene binario e2e local instalado; la proteccion automatizada disponible queda en Vitest para reglas de duracion, estilos, mezcla, porcentajes y recomendacion.
