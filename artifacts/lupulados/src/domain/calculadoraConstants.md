# `calculadoraConstants.ts`

**Propósito:** constantes de UI/configuración para la calculadora de barriles — tipos de bebidas no-cerveza disponibles, tipos de evento (con emoji/label/desc) y chips de duración predefinidos.

**Exports principales:**

- `NON_BEER_TYPES` — lista fija de `NonBeerBeverageType` (fernet, whisky, wine, gin, vodka, rum, tequila) en el orden que se muestran como opciones seleccionables.
- `EventTypeDef`, `EVENT_TYPES` — las 4 tarjetas de intensidad de evento (tranqui/normal/intensa/festival) con emoji, label y descripción, alineadas 1:1 con `EventIntensity` de [[beerConsumptionEstimate]].
- `DurationChipDef`, `DURATION_CHIPS` — chips de duración rápida (2hs a 6hs, con medias horas) para que el usuario no tenga que tipear la duración manualmente.

**Reglas de negocio / edge cases:**

- Es un archivo puramente declarativo (sin funciones): cualquier cambio en los tipos de bebida disponibles o intensidades de evento en la UI empieza acá, pero debe mantenerse en sync manualmente con los tipos de [[beerConsumptionEstimate]]/[[beverageMix]] (no hay validación en tiempo de compilación que fuerce que `EVENT_TYPES` cubra todos los valores de `EventIntensity`, aunque el tipo `id: EventIntensity` sí obliga a usar valores válidos).

**Dependencias clave:** tipos `EventIntensity` de [[beerConsumptionEstimate]], `NonBeerBeverageType` de [[beverageMix]].

**Tests:** no aplica (sin lógica ejecutable, solo constantes).
