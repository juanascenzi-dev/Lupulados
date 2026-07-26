export function formatDurationLabel(hours: number, minutes: number) {
  const hStr = `${hours} hora${hours !== 1 ? "s" : ""}`;
  if (minutes === 0) return `= ${hStr}`;

  return `= ${hStr} ${minutes} minutos`;
}
