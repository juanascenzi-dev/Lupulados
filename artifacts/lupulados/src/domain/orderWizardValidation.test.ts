import { describe, expect, it } from "vitest";
import { getOrderWizardValidationMessage } from "./orderWizardValidation";

const baseInput = {
  step: 4,
  orderType: "barril" as const,
  hasSelectedBeer: true,
  hasCurrentSelection: true,
  customerName: "Juan",
  date: "2026-08-01",
  today: "2026-07-24",
  delivery: "fabrica" as const,
  address: "",
};

describe("orderWizardValidation", () => {
  it("explains the missing selection for the first wizard steps", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 1, orderType: null })).toBe(
      "Elegí qué querés pedir para continuar.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 2, hasSelectedBeer: false })).toBe(
      "Elegí un estilo de cerveza para continuar.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, step: 3, hasCurrentSelection: false })).toBe(
      "Agregá una cantidad al pedido para continuar.",
    );
  });

  it("does not say delivery is missing when the selected delivery is valid", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, customerName: "" })).toBe(
      "Completá tu nombre para continuar.",
    );
  });

  it("uses a general message when several required fields are missing", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, customerName: "", date: "" })).toBe(
      "Completá los datos obligatorios para continuar.",
    );
  });

  it("requires address only for delivery options outside factory pickup", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, delivery: "caba", address: "" })).toBe(
      "Completá la dirección de entrega.",
    );
    expect(getOrderWizardValidationMessage({ ...baseInput, delivery: "caba", address: "Av. Corrientes 1234" })).toBeNull();
  });

  it("rejects empty or past dates with the same concrete message", () => {
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "" })).toBe("Seleccioná una fecha válida.");
    expect(getOrderWizardValidationMessage({ ...baseInput, date: "2026-07-23" })).toBe("Seleccioná una fecha válida.");
  });
});
