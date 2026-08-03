import { describe, expect, it } from "vitest";
import { getNextWizardStep, getPrevWizardStep } from "./orderWizardConstants";

describe("getNextWizardStep", () => {
  it("advances one step at a time outside the beer category", () => {
    expect(getNextWizardStep(1, false, null)).toBe(2);
    expect(getNextWizardStep(2, false, "barril")).toBe(3);
  });

  it("advances one step at a time in the beer category for barril/growler", () => {
    expect(getNextWizardStep(1, true, "barril")).toBe(2);
    expect(getNextWizardStep(2, true, "growler")).toBe(3);
  });

  it("skips step 2 for paquete/porrón, but only in the beer category", () => {
    expect(getNextWizardStep(1, true, "paquete")).toBe(3);
    expect(getNextWizardStep(1, true, "porrón")).toBe(3);
    expect(getNextWizardStep(1, false, "paquete")).toBe(2);
  });

  it("clamps at step 5", () => {
    expect(getNextWizardStep(5, true, "barril")).toBe(5);
  });
});

describe("getPrevWizardStep", () => {
  it("goes back one step at a time outside the beer category", () => {
    expect(getPrevWizardStep(3, false, null)).toBe(2);
    expect(getPrevWizardStep(2, false, "barril")).toBe(1);
  });

  it("goes back one step at a time in the beer category for barril/growler", () => {
    expect(getPrevWizardStep(3, true, "barril")).toBe(2);
    expect(getPrevWizardStep(2, true, "growler")).toBe(1);
  });

  it("skips step 2 backwards for paquete/porrón, but only in the beer category", () => {
    expect(getPrevWizardStep(3, true, "paquete")).toBe(1);
    expect(getPrevWizardStep(3, true, "porrón")).toBe(1);
    expect(getPrevWizardStep(3, false, "paquete")).toBe(2);
  });

  it("clamps at step 1", () => {
    expect(getPrevWizardStep(1, true, "barril")).toBe(1);
  });
});
