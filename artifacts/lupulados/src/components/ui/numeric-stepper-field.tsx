interface NumericStepperFieldRangeSlider {
  ariaLabel?: string;
  className: string;
  /** Step of the range input; independent from the field's button/native step. */
  step: number;
}

interface NumericStepperFieldProps {
  id?: string;
  value: number;
  /** Delta applied by the − / + buttons. */
  step: number;
  /** Native `step` attribute of the number input. Omit to leave it unset (browser default). */
  inputStep?: number;
  min: number;
  max?: number;
  /** Commits a value: used by the − / + buttons, the range slider (if any) and onBlur. */
  onChange: (next: number) => void;
  /** Fired on every keystroke while typing; callers typically parse loosely and clamp only the ceiling here. */
  onInputChange: (raw: string) => void;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  inputAriaDescribedBy?: string;
  required?: boolean;
  inputMode?: "numeric" | "decimal";
  wrapperClassName: string;
  buttonClassName: string;
  inputClassName: string;
  /** Renders an inline `<input type="range">` right after the + button, reusing `min`/`max`. */
  rangeSlider?: NumericStepperFieldRangeSlider;
}

/**
 * Generalizes the − / [number input] / + pattern used across the barrel calculator
 * (guests, men, women, hours, minutes, liters-per-person). Unlike `QuantityStepper`
 * (integer-only, no range slider), this variant supports decimal steps and an
 * optional inline range slider — needed by the liters-per-person override.
 */
export function NumericStepperField({
  id,
  value,
  step,
  inputStep,
  min,
  max,
  onChange,
  onInputChange,
  decreaseAriaLabel,
  increaseAriaLabel,
  inputAriaDescribedBy,
  required,
  inputMode,
  wrapperClassName,
  buttonClassName,
  inputClassName,
  rangeSlider,
}: NumericStepperFieldProps) {
  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        aria-label={decreaseAriaLabel}
        onClick={() => onChange(value - step)}
        className={buttonClassName}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
        onBlur={() => onChange(value)}
        className={inputClassName}
        min={min}
        max={max}
        step={inputStep}
        required={required}
        inputMode={inputMode}
        aria-describedby={inputAriaDescribedBy}
      />
      <button
        type="button"
        aria-label={increaseAriaLabel}
        onClick={() => onChange(value + step)}
        className={buttonClassName}
      >
        +
      </button>
      {rangeSlider && max !== undefined && (
        <input
          aria-label={rangeSlider.ariaLabel}
          type="range"
          min={min}
          max={max}
          step={rangeSlider.step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className={rangeSlider.className}
        />
      )}
    </div>
  );
}
