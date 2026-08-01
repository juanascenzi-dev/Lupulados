export const MIN_EVENT_GUESTS = 1;
export const MAX_EVENT_GUESTS = 500;

export function parseEventGuestCount(value: string | number): number | null {
  const rawValue = typeof value === "number" ? String(value) : value.trim();
  if (!/^\d+$/.test(rawValue)) return null;

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed < MIN_EVENT_GUESTS) return null;

  return Math.min(parsed, MAX_EVENT_GUESTS);
}

export function clampEventGuestCount(value: number): number {
  if (!Number.isFinite(value)) return MIN_EVENT_GUESTS;
  return Math.min(Math.max(Math.trunc(value), MIN_EVENT_GUESTS), MAX_EVENT_GUESTS);
}
