import * as XLSX from 'xlsx';
import { sql } from './db';
import { SCHOOL_TIMEZONE } from './attendance';

export interface AcademicTermOption {
  id: number;
  label: string;
  start_date: string;
  end_date: string;
}

export async function getAcademicTerms(): Promise<AcademicTermOption[]> {
  return (await sql`
    SELECT id, label, start_date::text, end_date::text FROM academic_terms ORDER BY start_date
  `) as unknown as AcademicTermOption[];
}

export type CalendarDayStatus = 'school_day' | 'public_holiday' | 'school_holiday';

export interface TermCalendarDay {
  date: string;
  status: CalendarDayStatus;
  /** The exception's own label (e.g. "Indonesian Independence Day") -- null for an ordinary
   * school day, which needs no explanation. */
  label: string | null;
}

/** Every weekday (Mon-Fri) between a term's start/end date, each checked against
 * academic_calendar_exceptions -- weekends are excluded outright, never counted as school days at
 * this school, the same convention regenerateScheduleOccurrences (academic-calendar.ts) uses for
 * generating real class sessions, so this report's idea of "school day" can never disagree with
 * the actual timetable it's describing. */
export async function getTermCalendarDays(termId: number): Promise<{ term: AcademicTermOption; days: TermCalendarDay[] }> {
  const termRows = (await sql`
    SELECT id, label, start_date::text, end_date::text FROM academic_terms WHERE id = ${termId}
  `) as unknown as AcademicTermOption[];
  const term = termRows[0];
  if (!term) {
    throw new Error('Term not found.');
  }

  const exceptions = (await sql`
    SELECT start_date::text, end_date::text, label, exception_type
    FROM academic_calendar_exceptions
    WHERE start_date <= ${term.end_date}::date AND end_date >= ${term.start_date}::date
    ORDER BY start_date
  `) as unknown as { start_date: string; end_date: string; label: string; exception_type: CalendarDayStatus }[];

  const days: TermCalendarDay[] = [];
  const cursor = new Date(`${term.start_date}T00:00:00Z`);
  const end = new Date(`${term.end_date}T00:00:00Z`);
  while (cursor.getTime() <= end.getTime()) {
    const dow = cursor.getUTCDay();
    if (dow !== 0 && dow !== 6) {
      const date = cursor.toISOString().slice(0, 10);
      const match = exceptions.find((ex) => date >= ex.start_date && date <= ex.end_date);
      days.push({ date, status: match ? match.exception_type : 'school_day', label: match ? match.label : null });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return { term, days };
}

export interface RegisterPerson {
  id: number;
  name: string;
  subLabel: string | null;
}

export interface TermRegister {
  people: RegisterPerson[];
  /** `${personId}|${date}` -- present if any daily check-in landed on that school-local date. */
  presentKeys: Set<string>;
}

/** Regular, active students only -- activities-only students have no daily gate register at all
 * in this school's model (see getDailyKioskRoster's own filter), so they're excluded here too
 * rather than showing a row that's structurally never going to have any daily check-ins. */
export async function getStudentTermRegister(termStart: string, termEnd: string, classFilter?: string | null): Promise<TermRegister> {
  const people = (await sql`
    SELECT id, child_full_name AS name, class_name AS sub_label
    FROM children
    WHERE is_active = true AND enrollment_type = 'regular'
      AND (${classFilter ?? null}::text IS NULL OR class_name = ${classFilter ?? null})
    ORDER BY class_name NULLS LAST, child_full_name
  `) as unknown as { id: number; name: string; sub_label: string | null }[];

  const presentRows = (await sql`
    SELECT DISTINCT ae.child_id, (ae.occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date::text AS day
    FROM attendance_events ae
    WHERE ae.session_type = 'daily' AND ae.event_type = 'check_in'
      AND (ae.occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date BETWEEN ${termStart}::date AND ${termEnd}::date
  `) as unknown as { child_id: number; day: string }[];

  return {
    people: people.map((p) => ({ id: p.id, name: p.name, subLabel: p.sub_label })),
    presentKeys: new Set(presentRows.map((r) => `${r.child_id}|${r.day}`)),
  };
}

/** Every active staff member (any role) -- mirrors getTodayStaffRosterSummary's own filter. */
export async function getStaffTermRegister(termStart: string, termEnd: string): Promise<TermRegister> {
  const people = (await sql`
    SELECT id, COALESCE(display_name, email) AS name, position_title AS sub_label
    FROM admin_users
    WHERE is_active = true
    ORDER BY name
  `) as unknown as { id: number; name: string; sub_label: string | null }[];

  const presentRows = (await sql`
    SELECT DISTINCT admin_user_id, (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date::text AS day
    FROM staff_attendance_events
    WHERE event_type = 'check_in'
      AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date BETWEEN ${termStart}::date AND ${termEnd}::date
  `) as unknown as { admin_user_id: number; day: string }[];

  return {
    people: people.map((p) => ({ id: p.id, name: p.name, subLabel: p.sub_label })),
    presentKeys: new Set(presentRows.map((r) => `${r.admin_user_id}|${r.day}`)),
  };
}

function shortDayLabel(date: string): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { timeZone: 'UTC', day: '2-digit', month: 'short' });
}

function dayStatusLabel(day: TermCalendarDay): string {
  if (day.status === 'school_day') return 'School day';
  if (day.label) return day.label;
  return day.status === 'public_holiday' ? 'Public holiday' : 'School holiday';
}

/** One sheet's worth of rows: a header (dates), a second row naming what each date actually is
 * (school day, or which holiday), then one row per person -- P/A for a school day, the holiday's
 * own label standing in for a judgment call that doesn't apply on a day the school wasn't open. */
function buildRegisterSheet(personLabel: string, subLabel: string, days: TermCalendarDay[], register: TermRegister): XLSX.WorkSheet {
  const schoolDayCount = days.filter((d) => d.status === 'school_day').length;

  const rows: (string | number)[][] = [
    [personLabel, subLabel, ...days.map((d) => shortDayLabel(d.date)), 'Days Present', 'School Days', 'Attendance %'],
    ['', '', ...days.map(dayStatusLabel), '', '', ''],
  ];

  for (const person of register.people) {
    let present = 0;
    const cells = days.map((d) => {
      if (d.status !== 'school_day') return dayStatusLabel(d);
      const wasPresent = register.presentKeys.has(`${person.id}|${d.date}`);
      if (wasPresent) present += 1;
      return wasPresent ? 'P' : 'A';
    });
    const pct = schoolDayCount > 0 ? Math.round((present / schoolDayCount) * 1000) / 10 : 0;
    rows.push([person.name, person.subLabel ?? '', ...cells, present, schoolDayCount, pct]);
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet['!cols'] = [{ wch: 24 }, { wch: 16 }, ...days.map(() => ({ wch: 9 })), { wch: 12 }, { wch: 11 }, { wch: 11 }];
  return sheet;
}

export function buildTermAttendanceWorkbook(
  days: TermCalendarDay[],
  studentRegister: TermRegister,
  staffRegister: TermRegister
): Uint8Array {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, buildRegisterSheet('Student', 'Class', days, studentRegister), 'Students');
  XLSX.utils.book_append_sheet(wb, buildRegisterSheet('Staff', 'Position', days, staffRegister), 'Staff');
  // 'array' (a plain Uint8Array), not 'buffer' -- a Node Buffer is assignable to a route
  // handler's Response body in practice, but TypeScript's BodyInit type doesn't accept it directly.
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}
