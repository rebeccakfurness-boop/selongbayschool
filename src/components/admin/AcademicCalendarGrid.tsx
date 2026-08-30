import type { AcademicTerm, AcademicCalendarException } from '@/components/admin/AcademicCalendarManager';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** Monday = 0 ... Sunday = 6, matching the attached calendar's Monday-start weeks. */
function mondayIndex(year: number, month: number, day: number): number {
  const sundayIndex = new Date(Date.UTC(year, month, day)).getUTCDay();
  return (sundayIndex + 6) % 7;
}

function exceptionFor(dateStr: string, exceptions: AcademicCalendarException[]): AcademicCalendarException | undefined {
  return exceptions.find((exc) => dateStr >= exc.start_date && dateStr <= exc.end_date);
}

/** Real, data-driven month grid: the date range comes entirely from the terms and exceptions
 * already stored in the database, never from a fixed calendar year. Styled after the school's
 * "Academic Calendar" PDF: Monday-start weeks and a three-colour legend (school day / school
 * holiday / public holiday). */
export default function AcademicCalendarGrid({
  terms,
  exceptions,
}: {
  terms: AcademicTerm[];
  exceptions: AcademicCalendarException[];
}) {
  const allDates = [
    ...terms.flatMap((t) => [t.start_date, t.end_date]),
    ...exceptions.flatMap((e) => [e.start_date, e.end_date]),
  ];

  if (allDates.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-sand-line p-6 text-center text-sm text-ink-soft">
        No terms or holidays set up yet, so there&apos;s no calendar to show.
      </div>
    );
  }

  const minDate = allDates.reduce((a, b) => (a < b ? a : b));
  const maxDate = allDates.reduce((a, b) => (a > b ? a : b));
  const [minYear, minMonth] = minDate.split('-').map(Number);
  const [maxYear, maxMonth] = maxDate.split('-').map(Number);

  const months: { year: number; month: number }[] = [];
  let year = minYear;
  let month = minMonth - 1;
  while (year < maxYear || (year === maxYear && month <= maxMonth - 1)) {
    months.push({ year, month });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-sand-line bg-paper" /> School days
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-sand" /> School holidays
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-orange/40" /> Public holidays (no school)
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {months.map(({ year: y, month: m }) => {
          const total = daysInMonth(y, m);
          const leadingBlanks = mondayIndex(y, m, 1);
          const cells: (number | null)[] = [...Array(leadingBlanks).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
          while (cells.length % 7 !== 0) cells.push(null);

          return (
            <div key={`${y}-${m}`} className="rounded-md border border-sand-line bg-paper p-4 shadow-soft">
              <h3 className="font-display text-sm font-semibold text-ink">
                {MONTH_NAMES[m]} {y}
              </h3>
              <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                {WEEKDAY_LABELS.map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {cells.map((day, i) => {
                  if (day === null) return <span key={i} />;
                  const dateStr = toDateStr(y, m, day);
                  const exc = exceptionFor(dateStr, exceptions);
                  const bg = exc ? (exc.exception_type === 'public_holiday' ? 'bg-orange/40' : 'bg-sand') : '';
                  return (
                    <span
                      key={i}
                      title={exc?.label}
                      className={`flex aspect-square items-center justify-center rounded-sm text-[11px] text-ink ${bg}`}
                    >
                      {day}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
