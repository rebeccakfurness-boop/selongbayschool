import { sql } from '@/lib/db';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
export type ClassFormat = 'online' | 'in_person';

export const DAY_ORDER: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

/** One row of a seed timetable (see class-schedule-seed.ts) — no id/class_name, since those are
 * supplied by whatever is importing it (class_name is the seed data's object key). */
export interface ClassScheduleSeedEntry {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  subject: string;
}

export interface ClassScheduleRow {
  id: number;
  class_name: string;
  subject: string;
  teacher_id: number | null;
  teacher_label: string | null;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  format: ClassFormat;
  location_or_link: string | null;
  meet_link: string | null;
  lesson_plan_id: number | null;
  lesson_plan_title: string | null;
  /** Status of the soonest upcoming (not-cancelled) dated occurrence's real, auto-generated Calendar
   * event — null when there's no such occurrence yet (e.g. no academic term configured), distinct
   * from 'pending' (occurrence exists, cron hasn't synced it yet) and 'failed' (synced attempt
   * errored — see next_occurrence_sync_error). meet_link above is the separate, manually-pasted
   * pattern-level fallback; this is what the admin schedule editor actually shows as ground truth. */
  next_occurrence_sync_status: 'pending' | 'synced' | 'failed' | null;
  next_occurrence_sync_error: string | null;
  next_occurrence_meet_link: string | null;
}

/** Sorted in JS rather than SQL (day_of_week is TEXT, so a plain ORDER BY would put Friday before
 * Monday) — the `sql` tagged-template wrapper in db.ts doesn't expose the driver's raw/unsafe
 * escape hatch needed for an ORDER BY CASE expression, and a weekly timetable is small enough
 * (a few dozen rows at most) that sorting client-side costs nothing. */
function sortSchedule(rows: ClassScheduleRow[]): ClassScheduleRow[] {
  return [...rows].sort((a, b) => {
    const dayDiff = DAY_ORDER.indexOf(a.day_of_week) - DAY_ORDER.indexOf(b.day_of_week);
    return dayDiff !== 0 ? dayDiff : a.start_time.localeCompare(b.start_time);
  });
}

export async function getWeeklyScheduleForClass(className: string | null): Promise<ClassScheduleRow[]> {
  if (!className) return [];
  const rows = (await sql`
    SELECT cs.id, cs.class_name, cs.subject, cs.teacher_id,
      COALESCE(au.display_name, au.email) AS teacher_label,
      cs.day_of_week, cs.start_time::text, cs.end_time::text, cs.format, cs.location_or_link,
      cs.meet_link, cs.lesson_plan_id, lp.title AS lesson_plan_title,
      next_occ.meet_link AS next_occurrence_meet_link,
      next_occ.calendar_sync_status AS next_occurrence_sync_status,
      next_occ.calendar_sync_error AS next_occurrence_sync_error
    FROM class_schedule cs
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    LEFT JOIN lesson_plans lp ON lp.id = cs.lesson_plan_id
    LEFT JOIN LATERAL (
      SELECT meet_link, calendar_sync_status, calendar_sync_error
      FROM schedule_session_occurrences o
      WHERE o.class_schedule_id = cs.id AND o.occurrence_date >= CURRENT_DATE AND o.is_cancelled = false
      ORDER BY o.occurrence_date ASC LIMIT 1
    ) next_occ ON true
    WHERE cs.class_name = ${className}
  `) as unknown as ClassScheduleRow[];
  return sortSchedule(rows);
}

export async function getWeeklyScheduleForClasses(classNames: string[]): Promise<ClassScheduleRow[]> {
  if (classNames.length === 0) return [];
  const rows = (await sql`
    SELECT cs.id, cs.class_name, cs.subject, cs.teacher_id,
      COALESCE(au.display_name, au.email) AS teacher_label,
      cs.day_of_week, cs.start_time::text, cs.end_time::text, cs.format, cs.location_or_link,
      cs.meet_link, cs.lesson_plan_id, lp.title AS lesson_plan_title,
      next_occ.meet_link AS next_occurrence_meet_link,
      next_occ.calendar_sync_status AS next_occurrence_sync_status,
      next_occ.calendar_sync_error AS next_occurrence_sync_error
    FROM class_schedule cs
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    LEFT JOIN lesson_plans lp ON lp.id = cs.lesson_plan_id
    LEFT JOIN LATERAL (
      SELECT meet_link, calendar_sync_status, calendar_sync_error
      FROM schedule_session_occurrences o
      WHERE o.class_schedule_id = cs.id AND o.occurrence_date >= CURRENT_DATE AND o.is_cancelled = false
      ORDER BY o.occurrence_date ASC LIMIT 1
    ) next_occ ON true
    WHERE cs.class_name = ANY(${classNames})
  `) as unknown as ClassScheduleRow[];
  return sortSchedule(rows);
}
