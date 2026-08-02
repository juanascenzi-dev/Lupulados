export interface EventDurationParts {
  days: number;
  hours: number;
  minutes: number;
}

export const MIN_EVENT_DURATION_MINUTES = 0;

export function parseDurationUnit(value: string | number): number | null {
  const rawValue = typeof value === "number" ? String(value) : value.trim();
  if (!/^\d+$/.test(rawValue)) return null;

  const parsed = Number(rawValue);
  if (!Number.isSafeInteger(parsed) || parsed < 0) return null;

  return parsed;
}

export function normalizeDurationMinutes(totalMinutes: number): number {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= MIN_EVENT_DURATION_MINUTES) {
    return MIN_EVENT_DURATION_MINUTES;
  }

  return Math.trunc(totalMinutes);
}

export function durationPartsFromMinutes(totalMinutes: number): EventDurationParts {
  const normalized = normalizeDurationMinutes(totalMinutes);
  const days = Math.floor(normalized / 1440);
  const remainingAfterDays = normalized % 1440;
  const hours = Math.floor(remainingAfterDays / 60);
  const minutes = remainingAfterDays % 60;

  return { days, hours, minutes };
}

export function durationMinutesFromInputs(hours: number, minutes: number): number {
  const safeHours = Number.isFinite(hours) ? Math.max(0, Math.trunc(hours)) : 0;
  const safeMinutes = Number.isFinite(minutes) ? Math.max(0, Math.trunc(minutes)) : 0;
  return normalizeDurationMinutes(safeHours * 60 + safeMinutes);
}

function formatUnit(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function formatDuration(totalMinutes: number): string {
  const { days, hours, minutes } = durationPartsFromMinutes(totalMinutes);
  const parts: string[] = [];

  if (days > 0) parts.push(formatUnit(days, "dia", "dias"));
  if (hours > 0) parts.push(formatUnit(hours, "hora", "horas"));
  if (minutes > 0) parts.push(formatUnit(minutes, "minuto", "minutos"));

  if (parts.length === 0) return "0 minutos";
  if (parts.length === 1) return parts[0];

  return `${parts.slice(0, -1).join(", ")} y ${parts[parts.length - 1]}`;
}

export function formatDurationLabel(totalMinutes: number) {
  return `= ${formatDuration(totalMinutes)}`;
}

export function durationToHoursDecimal(totalMinutes: number): number {
  return normalizeDurationMinutes(totalMinutes) / 60;
}

export function validateEventDuration(totalMinutes: number): string | null {
  if (!Number.isFinite(totalMinutes) || totalMinutes < 0) {
    return "Ingresa una duracion valida.";
  }

  if (normalizeDurationMinutes(totalMinutes) === 0) {
    return "La duracion debe ser mayor a cero para calcular la recomendacion.";
  }

  return null;
}
