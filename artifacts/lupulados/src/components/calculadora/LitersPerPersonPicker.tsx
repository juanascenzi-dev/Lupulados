import { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { NumericStepperField } from "@/components/ui/numeric-stepper-field";

interface LitersPerPersonPickerProps {
  standardLitersPerPerson: number;
  effectiveLitersPerPerson: number;
  eventTypeLabel: string;
  min: number;
  max: number;
  onChange: (next: number) => void;
  onInputChange: (raw: string) => void;
  onOpen: () => void;
  onReset: () => void;
}

const COMPACT_BUTTON_CLASS =
  "shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white transition-colors hover:border-primary";

export function LitersPerPersonPicker({
  standardLitersPerPerson,
  effectiveLitersPerPerson,
  eventTypeLabel,
  min,
  max,
  onChange,
  onInputChange,
  onOpen,
  onReset,
}: LitersPerPersonPickerProps) {
  const [open, setOpen] = useState(false);

  const openModal = () => {
    onOpen();
    setOpen(true);
  };

  const handleReset = () => {
    onReset();
    setOpen(false);
  };

  return (
    <div className="calculator-card calculator-summary-card rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white">
            <SlidersHorizontal className="h-4 w-4 text-primary" aria-hidden="true" /> Litros por
            persona
          </span>
          <p className="mt-1 text-xs text-muted-foreground">
            Estandar de {eventTypeLabel}: {standardLitersPerPerson.toFixed(1)} L.
          </p>
        </div>
        <span className="font-mono text-sm font-semibold text-primary">
          {effectiveLitersPerPerson.toFixed(1)} L
        </span>
      </div>
      <button type="button" onClick={openModal} className={`${COMPACT_BUTTON_CLASS} mt-3`}>
        Personalizar
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md border-white/10 bg-[#15110d] text-white">
          <DialogHeader>
            <DialogTitle>Personalizar litros por persona</DialogTitle>
            <DialogDescription>
              Ajusta el consumo base sin cambiar el estilo de fiesta seleccionado.
            </DialogDescription>
          </DialogHeader>
          <NumericStepperField
            id="calculator-liters-per-person"
            value={effectiveLitersPerPerson}
            step={0.1}
            inputStep={0.1}
            min={min}
            max={max}
            onChange={onChange}
            onInputChange={onInputChange}
            inputMode="decimal"
            wrapperClassName="flex items-center gap-2"
            buttonClassName="h-10 w-10 shrink-0 rounded-lg border border-white/10 bg-white/5 font-bold text-white transition-colors hover:border-primary"
            inputClassName="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 text-center font-bold text-primary transition-colors focus:border-primary focus:outline-none"
            decreaseAriaLabel="Restar 0.1 litros por persona"
            increaseAriaLabel="Sumar 0.1 litros por persona"
          />
          <DialogFooter className="gap-2 sm:space-x-0">
            <button
              type="button"
              onClick={handleReset}
              className="min-h-11 rounded-xl border border-white/10 px-4 font-bold text-white/70 hover:text-white"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 rounded-xl bg-primary px-5 font-bold text-black"
            >
              Aplicar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
