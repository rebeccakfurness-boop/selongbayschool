export interface LunchWeekdays {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
}

const WEEKDAY_LABELS: { key: keyof LunchWeekdays; short: string }[] = [
  { key: 'monday', short: 'Mon' },
  { key: 'tuesday', short: 'Tue' },
  { key: 'wednesday', short: 'Wed' },
  { key: 'thursday', short: 'Thu' },
  { key: 'friday', short: 'Fri' },
];

/** Date.getUTCDay() index (0 = Sunday .. 6 = Saturday) -> LunchWeekdays key, weekends unused. */
const DAY_INDEX_TO_KEY: (keyof LunchWeekdays | null)[] = [null, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', null];

/** Pure (no I/O) so it can run identically client-side (live total preview) and server-side (the
 * authoritative count stored on the order/invoice) — counts how many of the selected weekdays fall
 * within [startDate, endDate] inclusive. Dates are plain "YYYY-MM-DD" strings parsed as UTC
 * midnight specifically to avoid any local-timezone date-boundary drift. */
export function countLunchDays(startDate: string, endDate: string, weekdays: LunchWeekdays): number {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return 0;

  let count = 0;
  for (let cur = start; cur <= end; cur = new Date(cur.getTime() + 24 * 3600 * 1000)) {
    const key = DAY_INDEX_TO_KEY[cur.getUTCDay()];
    if (key && weekdays[key]) count++;
  }
  return count;
}

export function weekdaysSummaryLabel(weekdays: LunchWeekdays): string {
  const selected = WEEKDAY_LABELS.filter((d) => weekdays[d.key]).map((d) => d.short);
  return selected.length > 0 ? selected.join('/') : 'No days selected';
}
