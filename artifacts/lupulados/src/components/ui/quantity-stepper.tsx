import type { Ref } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type QuantityStepperSize = "cart" | "sm" | "md";

interface SizePreset {
  wrapperClassName: string;
  buttonClassName: string;
  iconClassName: string;
  valueClassName: string;
}

const SIZE_PRESETS: Record<QuantityStepperSize, SizePreset> = {
  cart: {
    wrapperClassName: "flex items-center gap-1.5",
    buttonClassName:
      "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-primary hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    iconClassName: "w-3 h-3",
    valueClassName:
      "h-10 w-11 rounded-lg bg-transparent text-center text-sm font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary",
  },
  sm: {
    wrapperClassName: "flex items-center bg-white/10 rounded-xl p-1",
    buttonClassName: "w-9 h-9 flex items-center justify-center hover:bg-white/10 rounded-lg",
    iconClassName: "w-4 h-4 text-white",
    valueClassName:
      "w-12 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg",
  },
  md: {
    wrapperClassName: "flex items-center bg-white/10 rounded-xl p-1",
    buttonClassName: "w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg",
    iconClassName: "w-4 h-4 text-white",
    valueClassName:
      "h-10 w-14 bg-transparent text-center font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary rounded-lg",
  },
};

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  valueAriaLabel?: string;
  min?: number;
  max?: number;
  /** false renders the value as a read-only <span> instead of a number input (e.g. an already-in-cart line). */
  editable?: boolean;
  /** Disables the +/- buttons when value hits min/max. Can be overridden per-button for external constraints (e.g. a shared capacity across steppers). */
  disableAtBounds?: boolean;
  disableDecrease?: boolean;
  disableIncrease?: boolean;
  size?: QuantityStepperSize;
  wrapperClassName?: string;
  buttonClassName?: string;
  valueClassName?: string;
  decreaseButtonRef?: Ref<HTMLButtonElement>;
}

export function QuantityStepper({
  value,
  onChange,
  decreaseAriaLabel,
  increaseAriaLabel,
  valueAriaLabel,
  min = 1,
  max = 999,
  editable = true,
  disableAtBounds = false,
  disableDecrease,
  disableIncrease,
  size = "md",
  wrapperClassName,
  buttonClassName,
  valueClassName,
  decreaseButtonRef,
}: QuantityStepperProps) {
  const preset = SIZE_PRESETS[size];
  const isDecreaseDisabled = disableDecrease ?? (disableAtBounds && value <= min);
  const isIncreaseDisabled = disableIncrease ?? (disableAtBounds && value >= max);

  return (
    <div className={cn(preset.wrapperClassName, wrapperClassName)}>
      <button
        ref={decreaseButtonRef}
        type="button"
        aria-label={decreaseAriaLabel}
        disabled={isDecreaseDisabled}
        onClick={() => onChange(value - 1)}
        className={cn(preset.buttonClassName, "disabled:opacity-35", buttonClassName)}
      >
        <Minus className={preset.iconClassName} aria-hidden="true" />
      </button>
      {editable ? (
        <input
          aria-label={valueAriaLabel}
          type="number"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={cn(preset.valueClassName, valueClassName)}
        />
      ) : (
        <span aria-label={valueAriaLabel} className={cn(preset.valueClassName, valueClassName)}>
          {value}
        </span>
      )}
      <button
        type="button"
        aria-label={increaseAriaLabel}
        disabled={isIncreaseDisabled}
        onClick={() => onChange(value + 1)}
        className={cn(preset.buttonClassName, "disabled:opacity-35", buttonClassName)}
      >
        <Plus className={preset.iconClassName} aria-hidden="true" />
      </button>
    </div>
  );
}
