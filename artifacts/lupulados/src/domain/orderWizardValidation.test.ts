import { describe, expect, it } from "vitest";
import { getOrderWizardValidationMessage } from "./orderWizardValidation";

const baseInput = {
  step: 4,
  orderType: "barril" as const,
  hasSelectedBeer: true,
  hasCurrentSelection: true,
  hasCartItems: true,
  customerName: "Juan",
  date: "2026-08-01",
  today: "2026-07-24",
  delivery: "fabrica",
  deliveryRequiresAddress: false,
  address: "",
};

describe("orderWizardValidation", () => {
  it("explains the missing selection for the first wizard steps", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 1, orderType: null })).toBe(
      "Eleg\u00ed qu\u00e9 quer\u00e9s pedir para continuar.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 2, hasSelectedBeer: false })).toBe(
      "Eleg\u00ed un estilo de cerveza para continuar.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 3, hasCurrentSelection: false })).toBe(
      "Agreg\u00e1 una cantidad al pedido para continuar.",
    );
  });

  it("does not say delivery is missing when the selected delivery is valid", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, customerName: "" })).toBe(
      "Complet\u00e1 tu nombre para continuar.",
    );
  });

  it("blocks customer data step when the cart is empty", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, hasCartItems: false })).toBe(
      "Agreg\u00e1 al menos un producto al pedido para continuar.",
    );
  });

  it("uses a general message when several required fields are missing", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, customerName: "", date: "" })).toBe(
      "Complet\u00e1 los datos obligatorios para continuar.",
    );
  });

  it("requires address only for delivery options configured that way", () => {
    expect(
      getOrderWizardValidationMessage({
        ...baseInput,
        delivery: "caba",
        deliveryRequiresAddress: true,
        address: "",
      }),
    ).toBe("Complet\u00e1 la direcci\u00f3n de entrega.");

    expect(
      getOrderWizardValidationMessage({
        ...baseInput,
        delivery: "caba",
        deliveryRequiresAddress: true,
        address: "Av. Corrientes 1234",
      }),
    ).toBeNull();

    expect(getOrderWizardValidationMessage({ ...baseInput, delivery: "retiro-local", address: "" })).toBeNull();
  });

  it("rejects empty or past dates with the same concrete message", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "" })).toBe("Seleccion\u00e1 una fecha v\u00e1lida.");
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "2026-07-23" })).toBe(
      "Seleccion\u00e1 una fecha v\u00e1lida.",
    );
  });
});
