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
      cs.day_of_week, cs.start_time::text, cs.end_time::text, cs.format, cs.location_or_link
    FROM class_schedule cs
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    WHERE cs.class_name = ${className}
  `) as unknown as ClassScheduleRow[];
  return sortSchedule(rows);
}

export async function getWeeklyScheduleForClasses(classNames: string[]): Promise<ClassScheduleRow[]> {
  if (classNames.length === 0) return [];
  const rows = (await sql`
    SELECT cs.id, cs.class_name, cs.subject, cs.teacher_id,
      COALESCE(au.display_name, au.email) AS teacher_label,
      cs.day_of_week, cs.start_time::text, cs.end_time::text, cs.format, cs.location_or_link
    FROM class_schedule cs
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    WHERE cs.class_name = ANY(${classNames})
  `) as unknown as ClassScheduleRow[];
  return sortSchedule(rows);
}
