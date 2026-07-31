# Precisión de precio en la Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Segunda pasada de mejoras sobre la calculadora, después de la de solidez técnica (`docs/barrel-calculator-hardening.md`). Este cambio ataca la precisión del precio mostrado al usuario, sin tocar copy general ni features nuevas fuera de lo estrictamente necesario para lograrlo.

## El problema

`calculateBarrelRecommendation` calculaba el precio de cada tamaño de barril como el **mínimo global del catálogo** (`Math.min` entre las 8 cervezas). Los precios reales de barril de 20L/30L/50L varían ~26-29% entre la cerveza más barata (Blonde Ale) y la más cara (Scotch Ale). El usuario veía "Estimado desde $38.000" en la calculadora sin saber que, si terminaba eligiendo otra cerveza, podía pagar hasta ~29% más — con cero relación entre el número que veía y lo que realmente iba a pagar.

## Cambios

### 1. `src/domain/barrelCalculator.ts` — precio real por cerveza (opcional)

`calculateBarrelRecommendation(requiredLiters, beer?)` acepta ahora un segundo parámetro opcional. Si se pasa una cerveza, el precio de cada parte de la recomendación usa `beer.precios[presentationId]` en vez del mínimo global; sin cerveza, el comportamiento es exactamente el mismo que antes (precio mínimo). Como los ratios de precio entre 20L/30L/50L difieren levemente por cerveza, la combinación óptima elegida también puede variar según la cerveza — es correcto: sigue siendo la de menor excedente y menor precio real para esa cerveza puntual.

`BarrelRecommendation` suma el campo `beerId: string | null`, para que la elección viaje junto con el resto de la recomendación por el mismo canal que ya conectaba Calculadora → Landing → Arma tu Pedido.

### 2. `src/domain/barrelCalculator.test.ts`

Se agregaron casos que verifican: `beerId` es `null` por defecto y `beer.id` cuando se pasa una cerveza (incluso en recomendaciones vacías), que el precio usado es el real de la cerveza elegida (comparado contra un brute-force de referencia igual al ya existente, generalizado para aceptar precio por cerveza), y que una cerveza más cara nunca cotiza por debajo del mínimo genérico para el mismo litraje.

### 3. `src/components/Calculadora.tsx` — selector de estilo opcional

Nueva sección "¿Ya sabés qué estilo? (opcional)" con pills de estilo, mismo lenguaje visual que los chips de duración ya existentes: "Cualquiera" (default, mantiene el precio mínimo genérico) + una pill por cerveza del catálogo (`useCommercialDerivedData().beerCatalog`, reactivo a Supabase). Al elegir una, el label del precio cambia de "Estimado desde" a "Precio para {cerveza}" — deja de ser un piso genérico para ser el precio real de esa combinación.

### 4. `src/components/ArmaTuPedido.tsx` — la elección viaja al wizard

El `useEffect` que reacciona a `pendingRecommendation` ahora también preselecciona `selectedBeer` si `pendingRecommendation.beerId` está presente. Así, si el usuario eligió un estilo en la calculadora, llega al wizard con esa misma cerveza ya marcada — el precio que confirma en el paso 3 es exactamente el que vio en la calculadora, sin tener que volver a elegir.

`src/domain/orderFlow.ts` (`buildRecommendedBarrelItems`) no se tocó: ya usaba el precio real de la cerveza seleccionada al construir los ítems del carrito, independientemente de lo que mostrara la calculadora.

## Archivos tocados

- `src/domain/barrelCalculator.ts` — precio por cerveza + `beerId`
- `src/domain/barrelCalculator.test.ts` — cobertura nueva
- `src/components/Calculadora.tsx` — selector de estilo + label de precio
- `src/components/ArmaTuPedido.tsx` — preselección de cerveza desde `beerId`
