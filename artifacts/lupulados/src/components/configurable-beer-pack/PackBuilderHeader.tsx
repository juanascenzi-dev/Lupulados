import type { Ref } from "react";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { CONFIGURABLE_BEER_PACK_MAX_PACKS } from "@/domain/configurableBeerPack";

export function PackBuilderHeader({
  packCount,
  onPackCountChange,
  decreaseButtonRef,
}: {
  packCount: number;
  onPackCountChange: (nextCount: number) => void;
  decreaseButtonRef: Ref<HTMLButtonElement>;
}) {
  return (
    <header className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">Pack de porrones</p>
        <h3 className="mt-0.5 text-lg font-black text-white md:mt-1 md:text-2xl">
          Pack configurable x6
        </h3>
        <p className="mt-1 hidden text-sm leading-relaxed text-white/60 sm:block">
          Cada pack contiene 6 porrones. Elegi los estilos y completa cada combinacion.
        </p>
      </div>
      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/25 p-2.5 sm:min-w-[260px] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/55">
            Cantidad de packs
          </p>
          <p className="text-xs text-white/40">
            Maximo {CONFIGURABLE_BEER_PACK_MAX_PACKS} packs por configuracion.
          </p>
        </div>
        <QuantityStepper
          value={packCount}
          onChange={onPackCountChange}
          min={1}
          max={CONFIGURABLE_BEER_PACK_MAX_PACKS}
          disableAtBounds
          decreaseAriaLabel="Restar cantidad de packs"
          increaseAriaLabel="Sumar cantidad de packs"
          valueAriaLabel="Cantidad de packs"
          decreaseButtonRef={decreaseButtonRef}
        />
      </div>
    </header>
  );
}
