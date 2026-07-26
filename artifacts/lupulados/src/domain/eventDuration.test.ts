import { describe, expect, it } from "vitest";
import { formatDurationLabel } from "./eventDuration";

describe("formatDurationLabel", () => {
  it("formats whole-hour durations", () => {
    expect(formatDurationLabel(4, 0)).toBe("= 4 horas");
  });

  it("formats durations with minutes", () => {
    expect(formatDurationLabel(2, 30)).toBe("= 2 horas 30 minutos");
  });

  it("uses singular hour for one hour", () => {
    expect(formatDurationLabel(1, 0)).toBe("= 1 hora");
  });

  it("updates the visible label when hour or minute values change", () => {
    expect(formatDurationLabel(3, 15)).toBe("= 3 horas 15 minutos");
    expect(formatDurationLabel(5, 45)).toBe("= 5 horas 45 minutos");
  });
});
