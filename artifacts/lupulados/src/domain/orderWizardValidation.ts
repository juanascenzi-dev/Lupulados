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
  if (step === 2 && !hasSelectedBeer) return "Eleg\u00ed un producto para continuar.";
  if (step === 3 && !hasCurrentSelection)
    return "Agreg\u00e1 una cantidad al pedido para continuar.";

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
    if (deliveryRequiresAddress && !address.trim())
      return "Complet\u00e1 la direcci\u00f3n de entrega.";
  }

  return null;
}

export interface OrderWizardCanProceedInput {
  hasCatalogProducts: boolean;
  isBeerCategory: boolean;
  step: number;
  orderType: OrderType;
  hasSelectedBeer: boolean;
  hasCurrentSelection: boolean;
  hasSelectedProduct: boolean;
  hasSelectedPresentation: boolean;
  hasCartItems: boolean;
  customerName: string;
  date: string;
  today: string;
  deliveryRequiresAddress: boolean;
  address: string;
}

/**
 * Kept intentionally separate from `getOrderWizardValidationMessage`: the two are not 1:1
 * derivable today (e.g. step-1 non-beer looks at `hasSelectedProduct` here but the message
 * function's step-1 branch only looks at `orderType`; step-4 here never checks delivery
 * presence, the message function does). Don't merge without confirming those are desired
 * behavior changes.
 */
export function getOrderWizardCanProceed({
  hasCatalogProducts,
  isBeerCategory,
  step,
  orderType,
  hasSelectedBeer,
  hasCurrentSelection,
  hasSelectedProduct,
  hasSelectedPresentation,
  hasCartItems,
  customerName,
  date,
  today,
  deliveryRequiresAddress,
  address,
}: OrderWizardCanProceedInput): boolean {
  if (!hasCatalogProducts) return false;

  if (isBeerCategory) {
    if (step === 1) return orderType !== null;
    if (step === 2) return hasSelectedBeer;
    if (step === 3) return orderType === "paquete" ? hasCurrentSelection : hasCartItems;
  } else {
    if (step === 1) return hasSelectedProduct;
    if (step === 2) return hasSelectedPresentation;
    if (step === 3) return hasCartItems;
  }

  if (step === 4) {
    return (
      hasCartItems &&
      !!customerName.trim() &&
      !!date &&
      date >= today &&
      (!deliveryRequiresAddress || !!address.trim())
    );
  }

  return true;
}
