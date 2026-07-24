import type { DeliveryOptionId } from "./businessConfig";
import type { OrderType } from "./orderFlow";

export interface OrderWizardValidationInput {
  step: number;
  orderType: OrderType;
  hasSelectedBeer: boolean;
  hasCurrentSelection: boolean;
  customerName: string;
  date: string;
  today: string;
  delivery: DeliveryOptionId | null;
  address: string;
}

export function getOrderWizardValidationMessage({
  step,
  orderType,
  hasSelectedBeer,
  hasCurrentSelection,
  customerName,
  date,
  today,
  delivery,
  address,
}: OrderWizardValidationInput) {
  if (step === 1 && !orderType) return "Elegí qué querés pedir para continuar.";
  if (step === 2 && !hasSelectedBeer) return "Elegí un estilo de cerveza para continuar.";
  if (step === 3 && !hasCurrentSelection) return "Agregá una cantidad al pedido para continuar.";

  if (step === 4) {
    const missingFields = [
      !customerName.trim(),
      !date,
      Boolean(date && date < today),
      !delivery,
      delivery !== "fabrica" && !address.trim(),
    ].filter(Boolean).length;

    if (missingFields > 1) return "Completá los datos obligatorios para continuar.";
    if (!customerName.trim()) return "Completá tu nombre para continuar.";
    if (!date || date < today) return "Seleccioná una fecha válida.";
    if (!delivery) return "Elegí una modalidad de entrega.";
    if (delivery !== "fabrica" && !address.trim()) return "Completá la dirección de entrega.";
  }

  return null;
}
