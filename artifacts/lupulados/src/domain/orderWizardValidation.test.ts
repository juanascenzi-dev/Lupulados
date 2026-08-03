import { describe, expect, it } from "vitest";
import { getOrderWizardCanProceed, getOrderWizardValidationMessage } from "./orderWizardValidation";

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
      "Eleg\u00ed un producto para continuar.",
    );
    expect(
      getOrderWizardValidationMessage({ ...baseInput, step: 3, hasCurrentSelection: false }),
    ).toBe("Agreg\u00e1 una cantidad al pedido para continuar.");
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

    expect(
      getOrderWizardValidationMessage({ ...baseInput, delivery: "retiro-local", address: "" }),
    ).toBeNull();
  });

  it("rejects empty or past dates with the same concrete message", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "" })).toBe(
      "Seleccion\u00e1 una fecha v\u00e1lida.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "2026-07-23" })).toBe(
      "Seleccion\u00e1 una fecha v\u00e1lida.",
    );
  });
});

describe("getOrderWizardCanProceed", () => {
  const baseInput = {
    hasCatalogProducts: true,
    isBeerCategory: true,
    step: 4,
    orderType: "barril" as const,
    hasSelectedBeer: true,
    hasCurrentSelection: true,
    hasSelectedProduct: true,
    hasSelectedPresentation: true,
    hasCartItems: true,
    customerName: "Juan",
    date: "2026-08-01",
    today: "2026-07-24",
    deliveryRequiresAddress: false,
    address: "",
  };

  it("is false whenever there's no catalog products, regardless of step", () => {
    expect(getOrderWizardCanProceed({ ...baseInput, hasCatalogProducts: false, step: 1 })).toBe(
      false,
    );
    expect(getOrderWizardCanProceed({ ...baseInput, hasCatalogProducts: false })).toBe(false);
  });

  it("gates beer-category steps on order type, then selected beer, then cart/paquete selection", () => {
    expect(getOrderWizardCanProceed({ ...baseInput, step: 1, orderType: null })).toBe(false);
    expect(getOrderWizardCanProceed({ ...baseInput, step: 1, orderType: "barril" })).toBe(true);
    expect(getOrderWizardCanProceed({ ...baseInput, step: 2, hasSelectedBeer: false })).toBe(false);
    expect(getOrderWizardCanProceed({ ...baseInput, step: 2, hasSelectedBeer: true })).toBe(true);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        step: 3,
        orderType: "paquete",
        hasCurrentSelection: false,
        hasCartItems: true,
      }),
    ).toBe(false);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        step: 3,
        orderType: "barril",
        hasCurrentSelection: false,
        hasCartItems: true,
      }),
    ).toBe(true);
  });

  it("gates non-beer-category steps on selected product, then presentation, then cart items", () => {
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        isBeerCategory: false,
        step: 1,
        hasSelectedProduct: false,
      }),
    ).toBe(false);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        isBeerCategory: false,
        step: 1,
        hasSelectedProduct: true,
      }),
    ).toBe(true);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        isBeerCategory: false,
        step: 2,
        hasSelectedPresentation: false,
      }),
    ).toBe(false);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        isBeerCategory: false,
        step: 3,
        hasCartItems: false,
      }),
    ).toBe(false);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        isBeerCategory: false,
        step: 3,
        hasCartItems: true,
      }),
    ).toBe(true);
  });

  it("requires cart items, name, valid date and address (when required) at step 4", () => {
    expect(getOrderWizardCanProceed(baseInput)).toBe(true);
    expect(getOrderWizardCanProceed({ ...baseInput, hasCartItems: false })).toBe(false);
    expect(getOrderWizardCanProceed({ ...baseInput, customerName: "  " })).toBe(false);
    expect(getOrderWizardCanProceed({ ...baseInput, date: "" })).toBe(false);
    expect(getOrderWizardCanProceed({ ...baseInput, date: "2026-07-01" })).toBe(false);
    expect(
      getOrderWizardCanProceed({ ...baseInput, deliveryRequiresAddress: true, address: "" }),
    ).toBe(false);
    expect(
      getOrderWizardCanProceed({
        ...baseInput,
        deliveryRequiresAddress: true,
        address: "Av. Corrientes 1234",
      }),
    ).toBe(true);
  });

  it("always allows step 5 once the catalog has products", () => {
    expect(getOrderWizardCanProceed({ ...baseInput, step: 5, hasCartItems: false })).toBe(true);
  });
});
