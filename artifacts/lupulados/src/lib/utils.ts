import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export { scrollToSection } from "./sectionNavigation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parsea un input numérico "en vivo" (mientras se tipea): devuelve `null` para
 * inputs vacíos o no numéricos en vez de forzar un 0, para no pisar lo que el
 * usuario está escribiendo. El clamping final (min/max, redondeo a pasos) queda
 * a cargo del caller, típicamente en el onBlur.
 */
export function parseNumericInput(raw: string): number | null {
  if (raw.trim() === "") return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
