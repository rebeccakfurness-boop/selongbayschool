import { sql } from '@/lib/db';
import { type DayOfWeek } from '@/lib/class-schedule';

/** Selong Bay School runs on WITA (Indonesia Central Time), a fixed UTC+8 offset with no daylight
 * saving observed — unlike most timezones, a hardcoded offset is safe here and doesn't need an
 * IANA tz-database lookup to stay correct. Occurrence timestamps are always built from this. */
export const SCHOOL_TIMEZONE = 'Asia/Makassar';
export const SCHOOL_TIMEZONE_LABEL = 'WITA';
const SCHOOL_UTC_OFFSET = '+08:00';

/** Combines a plain calendar date with a school-local wall-clock time into the real TIMESTAMPTZ
 * (ISO string with explicit offset) that `schedule_session_occurrences.starts_at`/`ends_at` store —
 * this is what makes correct per-viewer timezone display possible at all downstream. */
export function buildSchoolTimestamp(dateStr: string, timeStr: string): string {
  const time = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return `${dateStr}T${time}${SCHOOL_UTC_OFFSET}`;
}

/** Formats a stored TIMESTAMPTZ in school-local (WITA) time, e.g. "9:00 AM". Safe to call
 * server- or client-side since it always names an explicit timeZone. */
export function formatSchoolTime(isoTimestamp: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: SCHOOL_TIMEZONE,
  }).format(new Date(isoTimestamp));
}

/** Formats a stored TIMESTAMPTZ in the *browser's* local time. Only meaningful called from a
 * client component (or with an explicit timeZone override) — on the server, "no timeZone" resolves
 * to the server's own zone, not the viewer's. */
export function formatViewerTime(isoTimestamp: string, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  }).format(new Date(isoTimestamp));
}

interface AcademicTermRow {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
}

interface AcademicExceptionRow {
  start_date: string;
  end_date: string;
}

const DAY_TO_JS_DOW: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Every calendar date between start/end (inclusive) that falls on `dayOfWeek`. Dates are plain
 * "YYYY-MM-DD" strings throughout (see db.ts's DATE type-parser override) and compared as UTC days
 * to sidestep any server-local-timezone drift. */
function datesForDayOfWeek(startDate: string, endDate: string, dayOfWeek: DayOfWeek): string[] {
  const targetDow = DAY_TO_JS_DOW[dayOfWeek];
  const cursor = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  while (cursor.getUTCDay() !== targetDow) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  const dates: string[] = [];
  while (cursor.getTime() <= end.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 7);
  }
  return dates;
}

function isHoliday(date: string, exceptions: AcademicExceptionRow[]): boolean {
  return exceptions.some((ex) => date >= ex.start_date && date <= ex.end_date);
}

export interface RegenerateResult {
  created: number;
  updated: number;
  deleted: number;
  skippedHolidays: number;
  skippedManuallyEdited: number;
}

/** (Re)generates `schedule_session_occurrences` for one or all `class_schedule` weekly patterns,
 * against every configured `academic_terms` row, skipping any date covered by an
 * `academic_calendar_exceptions` row — real dated sessions built off the actual term calendar,
 * never blind "every Monday forever" recurrence.
 *
 * Occurrences an admin has hand-edited (`manually_edited = true`) are never touched, in either
 * direction: they're excluded from the stale-cleanup delete and from the upsert's overwrite. Call
 * this after editing class_schedule, academic_terms, or academic_calendar_exceptions. With no
 * `academic_terms` rows configured yet, this is a no-op (nothing to generate against). */
export async function regenerateScheduleOccurrences(opts?: { classScheduleId?: number }): Promise<RegenerateResult> {
  const result: RegenerateResult = { created: 0, updated: 0, deleted: 0, skippedHolidays: 0, skippedManuallyEdited: 0 };

  const terms = (await sql`
    SELECT id, label, start_date::text, end_date::text FROM academic_terms ORDER BY start_date
  `) as unknown as AcademicTermRow[];
  if (terms.length === 0) return result;

  const exceptions = (await sql`
    SELECT start_date::text, end_date::text FROM academic_calendar_exceptions
  `) as unknown as AcademicExceptionRow[];

  const patterns = (opts?.classScheduleId
    ? await sql`
        SELECT id, day_of_week, start_time::text, end_time::text
        FROM class_schedule WHERE id = ${opts.classScheduleId}
      `
    : await sql`
        SELECT id, day_of_week, start_time::text, end_time::text FROM class_schedule
      `) as unknown as { id: number; day_of_week: DayOfWeek; start_time: string; end_time: string }[];

  // Not bounded to the current terms' min/max: if an admin deletes or shrinks a term, occurrences
  // generated under the old range must still be reachable for cleanup here, or they'd be silently
  // orphaned (stuck outside every current term's range forever, since the old bound would exclude
  // them from ever being reconsidered). Bounded to today-forward instead, so a change made now can
  // never rewrite what already happened.
  const today = new Date().toISOString().slice(0, 10);
  if (patterns.length === 0) return result;

  // All date math happens in memory first (cheap), so the database work below is a small, fixed
  // number of round trips no matter how many patterns or how long the term is — a real school's
  // terms x classes easily produces thousands of (pattern, date) pairs, and awaiting one INSERT and
  // one SELECT per pair (the original version of this function) took long enough to blow past
  // Vercel's function timeout, which looked to the browser like Save just hung forever. Same lesson
  // already learned once in this codebase for the timetable import route (see its unnest() comment).
  const validDatesByPattern = new Map<number, Set<string>>();
  const toUpsert: { classScheduleId: number; date: string; startsAt: string; endsAt: string }[] = [];
  for (const pattern of patterns) {
    const validDates = new Set<string>();
    for (const term of terms) {
      for (const date of datesForDayOfWeek(term.start_date, term.end_date, pattern.day_of_week)) {
        if (isHoliday(date, exceptions)) {
          result.skippedHolidays += 1;
          continue;
        }
        validDates.add(date);
      }
    }
    validDatesByPattern.set(pattern.id, validDates);
    for (const date of validDates) {
      toUpsert.push({
        classScheduleId: pattern.id,
        date,
        startsAt: buildSchoolTimestamp(date, pattern.start_time),
        endsAt: buildSchoolTimestamp(date, pattern.end_time),
      });
    }
  }

  const patternIds = patterns.map((p) => p.id);
  const existingRows = (await sql`
    SELECT id, class_schedule_id, occurrence_date::text FROM schedule_session_occurrences
    WHERE class_schedule_id = ANY(${patternIds}) AND manually_edited = false AND occurrence_date >= ${today}
  `) as unknown as { id: number; class_schedule_id: number; occurrence_date: string }[];

  const staleIds = existingRows
    .filter((row) => !validDatesByPattern.get(row.class_schedule_id)?.has(row.occurrence_date))
    .map((row) => row.id);
  if (staleIds.length > 0) {
    await sql`DELETE FROM schedule_session_occurrences WHERE id = ANY(${staleIds})`;
    result.deleted = staleIds.length;
  }

  if (toUpsert.length > 0) {
    const rows = (await sql`
      INSERT INTO schedule_session_occurrences (class_schedule_id, occurrence_date, starts_at, ends_at)
      SELECT * FROM unnest(
        ${toUpsert.map((r) => r.classScheduleId)}::bigint[],
        ${toUpsert.map((r) => r.date)}::date[],
        ${toUpsert.map((r) => r.startsAt)}::timestamptz[],
        ${toUpsert.map((r) => r.endsAt)}::timestamptz[]
      )
      -- calendar_sync_status only resets to 'pending' when the actual time changed, not on every
      -- touch -- this function also runs school-wide (no classScheduleId) after an unrelated term
      -- or holiday-exception edit, and unconditionally resetting it there would re-trigger a Google
      -- Calendar sync for every already-synced occurrence in the school, most of which didn't
      -- actually move. A same-time change (e.g. just the teacher) doesn't touch starts_at/ends_at at
      -- all, so it can't be caught here -- see the explicit re-flag in the class-schedule PATCH route
      -- for that case.
      ON CONFLICT (class_schedule_id, occurrence_date) DO UPDATE
        SET starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at,
          calendar_sync_status = CASE
            WHEN schedule_session_occurrences.starts_at IS DISTINCT FROM EXCLUDED.starts_at
              OR schedule_session_occurrences.ends_at IS DISTINCT FROM EXCLUDED.ends_at
            THEN 'pending'
            ELSE schedule_session_occurrences.calendar_sync_status
          END
        WHERE schedule_session_occurrences.manually_edited = false
      RETURNING (xmax = 0) AS inserted
    `) as unknown as { inserted: boolean }[];

    result.skippedManuallyEdited = toUpsert.length - rows.length;
    for (const row of rows) {
      if (row.inserted) result.created += 1;
      else result.updated += 1;
    }
  }

  return result;
}
