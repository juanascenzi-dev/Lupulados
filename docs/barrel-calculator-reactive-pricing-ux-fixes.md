# Catalogo reactivo y fixes de UX/copy en la Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Tercera pasada de mejoras sobre la calculadora, despues de la de solidez tecnica (`docs/barrel-calculator-hardening.md`) y la de precision de precio (`docs/barrel-calculator-price-accuracy.md`). Este cambio cierra un bug de arquitectura que quedo a mitad de camino en el commit anterior, mas dos fixes chicos de UX/copy detectados en una revision del flujo completo.

## Los problemas

1. **El precio "sin estilo elegido" no era reactivo a Supabase.** `beerCatalog.ts` exporta `export const beerCatalog: Beer[] = buildBeerCatalog();`, evaluado una sola vez al importar el modulo, siempre con el snapshot **estatico** (`commercialData.ts`). `barrelCalculator.ts` calculaba `barrelOptions`/`minimumBarrelSize`/precios minimos a nivel de modulo, a partir de ese catalogo congelado. El commit anterior (precio real por estilo) arreglo el camino "cerveza especifica elegida" (que si recibia el catalogo reactivo como argumento), pero dejo el camino por defecto ("Cualquiera") mostrando siempre los precios del snapshot estatico, aunque el negocio actualizara precios desde el `AdminDashboard` via Supabase.
2. **Clamp agresivo al tipear.** Los inputs de Invitados, Horas y Minutos aplicaban el clamp completo (minimo, y en minutos el redondeo a pasos de 15) en cada `onChange`. Como el minimo de invitados es 10, escribir "15" digito por digito saltaba a "10" apenas se tipeaba el primer "1", rompiendo la edicion. Mismo patron en minutos: tipear "30" podia resetearse a "0" a mitad de camino.
3. **Copy inconsistente "Estimado desde".** El banner de resumen en `ArmaTuPedido.tsx` mostraba siempre "Estimado desde", incluso cuando el usuario ya habia elegido un estilo especifico en la Calculadora y el precio mostrado era, de hecho, el precio real de esa cerveza (`Calculadora.tsx` ya resolvia este mismo label correctamente).

## Cambios

### 1. `src/domain/barrelCalculator.ts` -- catalogo inyectable

`calculateBarrelRecommendation(requiredLiters, beer?, catalog = beerCatalog)` acepta ahora un tercer parametro opcional con el catalogo a usar. El calculo de `barrelOptions`, `smallestBarrelIndex`, `minimumBarrelSize` y `otherBarrelIndexes` (antes a nivel de modulo, calculado una sola vez contra el catalogo estatico) se movio a la funcion `buildBarrelOptions(catalog)`, invocada dentro de `calculateBarrelRecommendation` en cada llamada. El valor por defecto del parametro (`beerCatalog`, el catalogo estatico) mantiene compatibilidad con todos los call sites existentes que no pasan catalogo (tests, `orderFlow.ts`).

### 2. `src/components/Calculadora.tsx` -- pasa el catalogo reactivo

La llamada a `calculateBarrelRecommendation` ahora pasa explicitamente el `beerCatalog` que el componente ya obtenia de `useCommercialDerivedData()` (reactivo a Supabase, con fallback estatico). Asi, tanto el camino "con estilo elegido" como el "sin estilo" reflejan siempre el mismo catalogo vigente.

### 3. `src/components/Calculadora.tsx` -- clamp solo al salir del campo

Los handlers `onChange` de Invitados/Horas/Minutos dejaron de aplicar el clamp completo en cada tecla: ahora solo acotan el techo (500/12/59) para evitar valores absurdos mientras se tipea, sin forzar el piso ni el redondeo a pasos de 15. El clamp completo (`handleGuestsChange`/`handleHoursChange`/`handleMinutesChange`, sin cambios en su logica) se aplica recien en `onBlur`, normalizando el valor final. Los botones `+`/`-` y el slider de invitados siguen aplicando el clamp completo de inmediato (no tienen el problema de tipeo letra por letra); de paso, el slider paso a usar `handleGuestsChange` en vez de escribir el estado directo, para no tener dos rutas de escritura del mismo valor.

### 4. `src/components/ArmaTuPedido.tsx` -- copy consistente en el banner

El label fijo "Estimado desde" del banner de recomendacion ahora usa la misma condicion que ya existia en `Calculadora.tsx`: si `pendingRecommendation.beerId` esta presente y hay un `selectedBeer` resuelto (ya se preseleccionaba desde el `beerId` en el `useEffect` existente), muestra "Precio para {cerveza}"; si no, "Estimado desde".

### 5. `src/domain/barrelCalculator.test.ts`

Se agregaron dos casos: uno que pasa un catalogo custom con precios distintos al estatico y verifica que el precio de la recomendacion "sin estilo" refleja ese catalogo (no el estatico congelado), y otro que confirma que omitir el tercer argumento sigue usando el catalogo estatico por defecto (compatibilidad hacia atras).

## Archivos tocados

- `src/domain/barrelCalculator.ts` -- catalogo inyectable con default
- `src/domain/barrelCalculator.test.ts` -- cobertura del catalogo inyectado
- `src/components/Calculadora.tsx` -- catalogo reactivo + clamp solo en blur
- `src/components/ArmaTuPedido.tsx` -- copy consistente del banner
