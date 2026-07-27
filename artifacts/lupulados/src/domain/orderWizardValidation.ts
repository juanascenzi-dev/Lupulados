import type { DeliveryOptionId } from "./commercialTypes";
import type { OrderType } from "./orderFlow";

export interface OrderWizardValidationInput {
  step: number;
  orderType: OrderType;
  hasSelectedBeer: boolean;
  hasCurrentSelection: boolean;
  hasCartItems: boolean;
  customerName: string;
  date: string;
  today: string;
  delivery: DeliveryOptionId | null;
  deliveryRequiresAddress: boolean;
  address: string;
}

export function getOrderWizardValidationMessage({
  step,
  orderType,
  hasSelectedBeer,
  hasCurrentSelection,
  hasCartItems,
  customerName,
  date,
  today,
  delivery,
  deliveryRequiresAddress,
  address,
}: OrderWizardValidationInput) {
  if (step === 1 && !orderType) return "Eleg\u00ed qu\u00e9 quer\u00e9s pedir para continuar.";
  if (step === 2 && !hasSelectedBeer) return "Eleg\u00ed un estilo de cerveza para continuar.";
  if (step === 3 && !hasCurrentSelection) return "Agreg\u00e1 una cantidad al pedido para continuar.";

  if (step === 4) {
    if (!hasCartItems) return "Agreg\u00e1 al menos un producto al pedido para continuar.";

    const missingFields = [
      !customerName.trim(),
      !date,
      Boolean(date && date < today),
      !delivery,
      deliveryRequiresAddress && !address.trim(),
    ].filter(Boolean).length;

    if (missingFields > 1) return "Complet\u00e1 los datos obligatorios para continuar.";
    if (!customerName.trim()) return "Complet\u00e1 tu nombre para continuar.";
    if (!date || date < today) return "Seleccion\u00e1 una fecha v\u00e1lida.";
    if (!delivery) return "Eleg\u00ed una modalidad de entrega.";
    if (deliveryRequiresAddress && !address.trim()) return "Complet\u00e1 la direcci\u00f3n de entrega.";
  }

  return null;
}
