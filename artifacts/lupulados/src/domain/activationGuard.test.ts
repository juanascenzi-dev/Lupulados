import { describe, expect, it } from "vitest";
import { getGuardedActivationState } from "./activationGuard";

describe("guarded activation", () => {
  it("allows the first activation even when the clock value is lower than the guard interval", () => {
    const first = getGuardedActivationState(0, 100, 1500);

    expect(first.allowed).toBe(true);
    expect(first.lastActivatedAt).toBe(100);
  });

  it("blocks a repeated activation inside the guard window", () => {
    const first = getGuardedActivationState(0, 10_000, 1500);
    const second = getGuardedActivationState(first.lastActivatedAt, 10_200, 1500);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(second.lastActivatedAt).toBe(10_000);
  });

  it("allows a later activation after the guard window", () => {
    const first = getGuardedActivationState(0, 10_000, 1500);
    const later = getGuardedActivationState(first.lastActivatedAt, 11_501, 1500);

    expect(later.allowed).toBe(true);
    expect(later.lastActivatedAt).toBe(11_501);
  });
});
