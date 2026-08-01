import { describe, expect, it } from "vitest";
import { MAX_EVENT_GUESTS, MIN_EVENT_GUESTS, clampEventGuestCount, parseEventGuestCount } from "./eventGuestCount";

describe("eventGuestCount", () => {
  it("accepts integer guest counts from one upward", () => {
    expect(parseEventGuestCount("1")).toBe(1);
    expect(parseEventGuestCount("9")).toBe(9);
    expect(parseEventGuestCount(10)).toBe(10);
    expect(parseEventGuestCount("500")).toBe(MAX_EVENT_GUESTS);
  });

  it.each(["0", "-1", "1.5", "abc", "", "  "])("rejects invalid guest count input: %s", (value) => {
    expect(parseEventGuestCount(value)).toBeNull();
  });

  it("clamps stepper updates without forcing ten guests", () => {
    expect(clampEventGuestCount(-4)).toBe(MIN_EVENT_GUESTS);
    expect(clampEventGuestCount(1)).toBe(1);
    expect(clampEventGuestCount(9)).toBe(9);
    expect(clampEventGuestCount(501)).toBe(MAX_EVENT_GUESTS);
  });
});
