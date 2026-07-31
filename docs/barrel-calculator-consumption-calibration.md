# Calibración de consumo en la Calculadora de Barriles

Rama `feature/mejora-calculadora-barriles`. Tercera pasada sobre la calculadora, después de la de solidez técnica (`docs/barrel-calculator-hardening.md`) y la de precisión de precio (`docs/barrel-calculator-price-accuracy.md`). Este cambio ataca el realismo de los litros/persona que la calculadora asume para cada tipo de evento, sin tocar el algoritmo de recomendación de barriles ni los precios.

## El problema

`EVENT_INTENSITY_MULTIPLIERS` (litros por persona según intensidad del evento, para un evento de referencia de 4hs) y el factor de verano venían de una estimación inicial sin contrastar contra datos de consumo reales:

```
tranqui: 0.6, normal: 1.0, intensa: 1.4, festival: 1.8
verano: ×1.2 (+20%)
```

Se investigaron fuentes de referencia para calcular bebida en fiestas/asados (mercado argentino, que es el que atiende la app):

- Guía de cálculo de bebida para asados/fiestas en Argentina: reunión tranquila 0.5 L/persona, fiesta normal/asado típico 0.75 L/persona, fiesta intensa/asado largo (5-6hs) 1.0 L/persona o más, verano +30%, invierno −20%.
- Calculadora de bebidas por tipo de evento (tasas por hora, con 15% de margen de seguridad ya incluido): cumpleaños 0.35 L/h, casamiento 0.23 L/h, asado 0.29 L/h, fiesta de gente joven 0.46 L/h (≈1.84 L en 4hs), verano ×1.25.

Contra esos benchmarks, `tranqui` y `festival` ya estaban bien calibrados, pero `normal` e `intensa` quedaban por encima de lo que consume en promedio una persona en un asado/fiesta típica, y el factor de verano (+20%) quedaba algo por debajo de lo que reportan ambas fuentes (+25% a +30%).

## Cambios

### `src/domain/beerConsumptionEstimate.ts`

Recalibración de `EVENT_INTENSITY_MULTIPLIERS` y del factor de verano:

| Intensidad | Antes | Después |
|---|---|---|
| tranqui | 0.6 | 0.5 |
| normal | 1.0 | 0.8 |
| intensa | 1.4 | 1.3 |
| festival | 1.8 | 1.8 (sin cambio) |

Verano: `1.2` → `1.25` (+25%, punto medio entre las fuentes consultadas).

El ajuste por duración (±15% por hora de diferencia respecto al pivote de 4hs) no se tocó: ninguna fuente daba un dato lo bastante sólido como para recalibrarlo con confianza, y el rango que produce dentro del clamp de horas de la UI (1-12hs) sigue siendo razonable.

### `src/components/Calculadora.tsx`

El copy "La gente toma más con calor (+20%)" pasa a "+25%" para que coincida con el nuevo factor de verano.

### `src/domain/beerConsumptionEstimate.test.ts`

Se recalcularon los valores esperados de todos los casos (multiplicador por intensidad, ajuste por duración, factor de verano, redondeo y el caso combinado) contra las nuevas constantes.

## Archivos tocados

- `src/domain/beerConsumptionEstimate.ts` — nuevas constantes
- `src/components/Calculadora.tsx` — copy de verano actualizado
- `src/domain/beerConsumptionEstimate.test.ts` — expectativas recalculadas
