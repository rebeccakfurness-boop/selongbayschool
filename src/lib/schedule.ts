import { sql } from '@/lib/db';
import type { DayOfWeek, ClassFormat } from '@/lib/class-schedule';

export type ScheduleType = 'on_site' | 'hybrid' | 'home_schooling';

export interface SessionOccurrenceRow {
  occurrence_id: number;
  occurrence_date: string;
  starts_at: string;
  ends_at: string;
  is_cancelled: boolean;
  cancellation_reason: string | null;
  class_schedule_id: number;
  class_name: string;
  subject: string;
  teacher_id: number | null;
  teacher_label: string | null;
  day_of_week: DayOfWeek;
  location_or_link: string | null;
  meet_link: string | null;
  format: ClassFormat;
  lesson_plan_id: number | null;
  lesson_plan_title: string | null;
  lesson_plan_description: string | null;
  calendar_sync_status: 'pending' | 'synced' | 'failed';
  calendar_sync_error: string | null;
}

interface RawOccurrenceRow extends Omit<SessionOccurrenceRow, 'format' | 'meet_link'> {
  base_format: ClassFormat;
  format_override: ClassFormat | null;
  applies: boolean | null;
  pattern_meet_link: string | null;
  occurrence_meet_link: string | null;
}

/** Sessions for one class, in the given date window, filtered for a student's schedule type: a
 * class_schedule_type_overrides row with applies = false drops the session entirely (e.g. a Home
 * Schooling student skips an on-campus-only session); format_override swaps online <-> in_person
 * per schedule type (e.g. a Hybrid student joins online what an On-Site student attends in person).
 * No schedule_type set yet (child not configured) shows every session at its own base format. */
export async function getUpcomingOccurrencesForClass(
  className: string | null,
  scheduleType: ScheduleType | null,
  fromDate: string,
  toDate: string
): Promise<SessionOccurrenceRow[]> {
  if (!className) return [];

  const rows = (
    scheduleType
      ? await sql`
          SELECT
            o.id AS occurrence_id, o.occurrence_date::text, o.starts_at, o.ends_at,
            o.is_cancelled, o.cancellation_reason,
            o.calendar_sync_status, o.calendar_sync_error,
            cs.id AS class_schedule_id, cs.class_name, cs.subject, cs.teacher_id,
            COALESCE(au.display_name, au.email) AS teacher_label,
            cs.day_of_week, cs.location_or_link, cs.meet_link AS pattern_meet_link,
            o.meet_link AS occurrence_meet_link, cs.format AS base_format,
            cs.lesson_plan_id, lp.title AS lesson_plan_title, lp.description AS lesson_plan_description,
            ov.format_override, ov.applies
          FROM schedule_session_occurrences o
          JOIN class_schedule cs ON cs.id = o.class_schedule_id
          LEFT JOIN admin_users au ON au.id = cs.teacher_id
          LEFT JOIN lesson_plans lp ON lp.id = cs.lesson_plan_id
          LEFT JOIN class_schedule_type_overrides ov ON ov.class_schedule_id = cs.id AND ov.schedule_type = ${scheduleType}
          WHERE cs.class_name = ${className}
            AND o.occurrence_date BETWEEN ${fromDate} AND ${toDate}
            AND o.is_cancelled = false
            AND COALESCE(ov.applies, true) = true
          ORDER BY o.starts_at
        `
      : await sql`
          SELECT
            o.id AS occurrence_id, o.occurrence_date::text, o.starts_at, o.ends_at,
            o.is_cancelled, o.cancellation_reason,
            o.calendar_sync_status, o.calendar_sync_error,
            cs.id AS class_schedule_id, cs.class_name, cs.subject, cs.teacher_id,
            COALESCE(au.display_name, au.email) AS teacher_label,
            cs.day_of_week, cs.location_or_link, cs.meet_link AS pattern_meet_link,
            o.meet_link AS occurrence_meet_link, cs.format AS base_format,
            cs.lesson_plan_id, lp.title AS lesson_plan_title, lp.description AS lesson_plan_description,
            NULL::text AS format_override, NULL::boolean AS applies
          FROM schedule_session_occurrences o
          JOIN class_schedule cs ON cs.id = o.class_schedule_id
          LEFT JOIN admin_users au ON au.id = cs.teacher_id
          LEFT JOIN lesson_plans lp ON lp.id = cs.lesson_plan_id
          WHERE cs.class_name = ${className}
            AND o.occurrence_date BETWEEN ${fromDate} AND ${toDate}
            AND o.is_cancelled = false
          ORDER BY o.starts_at
        `
  ) as unknown as RawOccurrenceRow[];

  return rows.map((r) => ({
    occurrence_id: r.occurrence_id,
    occurrence_date: r.occurrence_date,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    is_cancelled: r.is_cancelled,
    cancellation_reason: r.cancellation_reason,
    class_schedule_id: r.class_schedule_id,
    class_name: r.class_name,
    subject: r.subject,
    teacher_id: r.teacher_id,
    teacher_label: r.teacher_label,
    day_of_week: r.day_of_week,
    location_or_link: r.location_or_link,
    // The auto-generated per-occurrence link (real, unique, kept in sync via the Calendar API) wins
    // once it exists; the pattern-level meet_link is a teacher-pasted fallback shown only until that
    // occurrence has synced (or if Calendar isn't connected at all — see calendar_sync_status).
    meet_link: r.occurrence_meet_link ?? r.pattern_meet_link,
    format: r.format_override ?? r.base_format,
    lesson_plan_id: r.lesson_plan_id,
    lesson_plan_title: r.lesson_plan_title,
    lesson_plan_description: r.lesson_plan_description,
    calendar_sync_status: r.calendar_sync_status,
    calendar_sync_error: r.calendar_sync_error,
  }));
}

/** Staff-facing equivalent of getUpcomingOccurrencesForClass — across every class a teacher (or
 * admin) can access at once, at each session's own base format (no per-child schedule_type
 * resolution, since this is the class roster's session, not one particular student's view of it).
 * Used by the worksheets tab to list sessions a teacher can open to mark. */
export async function getOccurrencesForClassesInWindow(
  classNames: string[],
  fromDate: string,
  toDate: string
): Promise<SessionOccurrenceRow[]> {
  if (classNames.length === 0) return [];

  const rows = (await sql`
    SELECT
      o.id AS occurrence_id, o.occurrence_date::text, o.starts_at, o.ends_at,
      o.is_cancelled, o.cancellation_reason,
      o.calendar_sync_status, o.calendar_sync_error,
      cs.id AS class_schedule_id, cs.class_name, cs.subject, cs.teacher_id,
      COALESCE(au.display_name, au.email) AS teacher_label,
      cs.day_of_week, cs.location_or_link, cs.meet_link AS pattern_meet_link,
      o.meet_link AS occurrence_meet_link, cs.format AS base_format,
      cs.lesson_plan_id, lp.title AS lesson_plan_title, lp.description AS lesson_plan_description,
      NULL::text AS format_override, NULL::boolean AS applies
    FROM schedule_session_occurrences o
    JOIN class_schedule cs ON cs.id = o.class_schedule_id
    LEFT JOIN admin_users au ON au.id = cs.teacher_id
    LEFT JOIN lesson_plans lp ON lp.id = cs.lesson_plan_id
    WHERE cs.class_name = ANY(${classNames})
      AND o.occurrence_date BETWEEN ${fromDate} AND ${toDate}
      AND o.is_cancelled = false
    ORDER BY o.starts_at
  `) as unknown as RawOccurrenceRow[];

  return rows.map((r) => ({
    occurrence_id: r.occurrence_id,
    occurrence_date: r.occurrence_date,
    starts_at: r.starts_at,
    ends_at: r.ends_at,
    is_cancelled: r.is_cancelled,
    cancellation_reason: r.cancellation_reason,
    class_schedule_id: r.class_schedule_id,
    class_name: r.class_name,
    subject: r.subject,
    teacher_id: r.teacher_id,
    teacher_label: r.teacher_label,
    day_of_week: r.day_of_week,
    location_or_link: r.location_or_link,
    meet_link: r.occurrence_meet_link ?? r.pattern_meet_link,
    format: r.format_override ?? r.base_format,
    lesson_plan_id: r.lesson_plan_id,
    lesson_plan_title: r.lesson_plan_title,
    lesson_plan_description: r.lesson_plan_description,
    calendar_sync_status: r.calendar_sync_status,
    calendar_sync_error: r.calendar_sync_error,
  }));
}

export interface NotificationPrefRow {
  child_id: number;
  enabled: boolean;
}

/** One global reminder toggle per (parent, child) — off by default (opt-in), per the spec's
 * requirement that a parent's preference is respected exactly, never silently re-enabled. Per-
 * session overrides are schema-ready (schedule_notification_prefs.class_schedule_id) but not yet
 * surfaced in the UI; this reads/writes only the global (class_schedule_id IS NULL) row. */
export async function getNotificationPref(customerId: number, childId: number): Promise<boolean> {
  const [row] = (await sql`
    SELECT enabled FROM schedule_notification_prefs
    WHERE customer_id = ${customerId} AND child_id = ${childId} AND class_schedule_id IS NULL
  `) as unknown as { enabled: boolean }[];
  return row?.enabled ?? false;
}

export async function setNotificationPref(customerId: number, childId: number, enabled: boolean): Promise<void> {
  await sql`
    INSERT INTO schedule_notification_prefs (customer_id, child_id, class_schedule_id, enabled, updated_at)
    VALUES (${customerId}, ${childId}, NULL, ${enabled}, now())
    ON CONFLICT (customer_id, child_id) WHERE class_schedule_id IS NULL
      DO UPDATE SET enabled = ${enabled}, updated_at = now()
  `;
}
