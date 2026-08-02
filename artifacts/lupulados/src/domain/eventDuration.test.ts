import { describe, expect, it } from "vitest";
import {
  durationMinutesFromInputs,
  durationPartsFromMinutes,
  durationToHoursDecimal,
  formatDuration,
  formatDurationLabel,
  MAX_EVENT_DURATION_MINUTES,
  normalizeDurationMinutes,
  parseDurationUnit,
  validateEventDuration,
} from "./eventDuration";

describe("eventDuration", () => {
  it("formats whole-hour durations", () => {
    expect(formatDurationLabel(240)).toBe("= 4 horas");
  });

  it("formats durations with minutes", () => {
    expect(formatDurationLabel(150)).toBe("= 2 horas y 30 minutos");
  });

  it("uses singular hour for one hour", () => {
    expect(formatDurationLabel(60)).toBe("= 1 hora");
  });

  it("normalizes minutes greater than one day", () => {
    expect(durationPartsFromMinutes(26 * 60)).toEqual({ days: 1, hours: 2, minutes: 0 });
    expect(durationPartsFromMinutes(49 * 60 + 30)).toEqual({ days: 2, hours: 1, minutes: 30 });
  });

  it("formats long durations with days, hours and minutes", () => {
    expect(formatDuration(26 * 60)).toBe("1 dia y 2 horas");
    expect(formatDuration(49 * 60 + 30)).toBe("2 dias, 1 hora y 30 minutos");
  });

  it("parses only safe non-negative integer units", () => {
    expect(parseDurationUnit("26")).toBe(26);
    expect(parseDurationUnit("-1")).toBeNull();
    expect(parseDurationUnit("NaN")).toBeNull();
    expect(parseDurationUnit("1.5")).toBeNull();
  });

  it("normalizes invalid or negative totals to zero without NaN", () => {
    expect(normalizeDurationMinutes(Number.NaN)).toBe(0);
    expect(normalizeDurationMinutes(-30)).toBe(0);
  });

  it("caps totals above the maximum supported duration", () => {
    expect(normalizeDurationMinutes(MAX_EVENT_DURATION_MINUTES + 1000)).toBe(
      MAX_EVENT_DURATION_MINUTES,
    );
    expect(durationMinutesFromInputs(100000, 0)).toBe(MAX_EVENT_DURATION_MINUTES);
  });

  it("builds total minutes from extended hour and minute inputs", () => {
    expect(durationMinutesFromInputs(49, 30)).toBe(49 * 60 + 30);
    expect(durationToHoursDecimal(90)).toBe(1.5);
  });

  it("validates zero duration instead of correcting it silently", () => {
    expect(validateEventDuration(0)).toBe(
      "La duracion debe ser mayor a cero para calcular la recomendacion.",
    );
    expect(validateEventDuration(60)).toBeNull();
  });
});
