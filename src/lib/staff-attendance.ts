import { sql } from '@/lib/db';
import { schoolLocalToday, SCHOOL_TIMEZONE } from '@/lib/attendance';

export type StaffAttendanceEventType = 'check_in' | 'check_out';
export type StaffAttendanceSource = 'self' | 'admin';

export interface RecordStaffAttendanceInput {
  adminUserId: number;
  eventType: StaffAttendanceEventType;
  source: StaffAttendanceSource;
  /** Only ever set for source = 'admin' -- the staff member who made the correction. For 'self',
   * the actor and the subject are the same admin_user_id, so this stays null. */
  performedByAdminId?: number | null;
  /** Only ever set for an admin correction (backdating a missed check-in/out) -- a self check
   * always uses the insert's own now() default. */
  occurredAt?: string | null;
}

export interface StaffAttendanceEventRow {
  id: number;
  admin_user_id: number;
  event_type: StaffAttendanceEventType;
  occurred_at: string;
  source: StaffAttendanceSource;
}

export async function recordStaffAttendanceEvent(input: RecordStaffAttendanceInput): Promise<StaffAttendanceEventRow> {
  const rows = (await sql`
    INSERT INTO staff_attendance_events (admin_user_id, event_type, source, performed_by_admin_id, occurred_at)
    VALUES (
      ${input.adminUserId}, ${input.eventType}, ${input.source}, ${input.performedByAdminId ?? null},
      COALESCE(${input.occurredAt ?? null}::timestamptz, now())
    )
    RETURNING id, admin_user_id, event_type, occurred_at::text, source
  `) as unknown as StaffAttendanceEventRow[];
  return rows[0];
}

/** Today's most recent event for one staff member -- drives the self check-in/out button's
 * "Check In" vs "Check Out" label. */
export async function getTodayEventStatusForStaff(
  adminUserId: number
): Promise<{ event_type: StaffAttendanceEventType; occurred_at: string } | null> {
  const today = schoolLocalToday();
  const rows = (await sql`
    SELECT event_type, occurred_at::text
    FROM staff_attendance_events
    WHERE admin_user_id = ${adminUserId}
      AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date = ${today}::date
    ORDER BY occurred_at DESC
    LIMIT 1
  `) as unknown as { event_type: StaffAttendanceEventType; occurred_at: string }[];
  return rows[0] ?? null;
}

export interface TodayStaffRosterSummary {
  adminUserId: number;
  staffLabel: string;
  positionTitle: string | null;
  status: 'not_arrived' | 'checked_in' | 'checked_out';
  lastEventId: number | null;
  lastEventTime: string | null;
}

/** Today's whole-school staff roster for the admin attendance dashboard -- every active staff
 * member (any role/employment status), annotated with today's most recent event, same shape as
 * getTodayRosterSummary for students. */
export async function getTodayStaffRosterSummary(): Promise<TodayStaffRosterSummary[]> {
  const today = schoolLocalToday();
  const rows = (await sql`
    SELECT a.id AS admin_user_id, COALESCE(a.display_name, a.email) AS staff_label, a.position_title,
      latest.id AS last_event_id, latest.event_type AS last_event_type, latest.occurred_at::text AS last_event_time
    FROM admin_users a
    LEFT JOIN LATERAL (
      SELECT id, event_type, occurred_at
      FROM staff_attendance_events
      WHERE admin_user_id = a.id AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date = ${today}::date
      ORDER BY occurred_at DESC
      LIMIT 1
    ) latest ON true
    WHERE a.is_active = true
    ORDER BY staff_label
  `) as unknown as {
    admin_user_id: number;
    staff_label: string;
    position_title: string | null;
    last_event_id: number | null;
    last_event_type: StaffAttendanceEventType | null;
    last_event_time: string | null;
  }[];
  return rows.map((r) => ({
    adminUserId: r.admin_user_id,
    staffLabel: r.staff_label,
    positionTitle: r.position_title,
    status: r.last_event_type === 'check_in' ? 'checked_in' : r.last_event_type === 'check_out' ? 'checked_out' : 'not_arrived',
    lastEventId: r.last_event_id,
    lastEventTime: r.last_event_time,
  }));
}

export interface StaffAttendanceHistoryRow {
  id: number;
  event_type: StaffAttendanceEventType;
  occurred_at: string;
  source: StaffAttendanceSource;
  performed_by_label: string | null;
}

export async function getAttendanceHistoryForStaff(adminUserId: number, limit = 200): Promise<StaffAttendanceHistoryRow[]> {
  return (await sql`
    SELECT ae.id, ae.event_type, ae.occurred_at::text, ae.source,
      COALESCE(pa.display_name, pa.email) AS performed_by_label
    FROM staff_attendance_events ae
    LEFT JOIN admin_users pa ON pa.id = ae.performed_by_admin_id
    WHERE ae.admin_user_id = ${adminUserId}
    ORDER BY ae.occurred_at DESC
    LIMIT ${limit}
  `) as unknown as StaffAttendanceHistoryRow[];
}

/** A day is "open" (worth flagging) when its last event is a check_in with no matching
 * check_out -- same logic as findOpenDailyAttendanceDays for students. */
export function findOpenStaffAttendanceDays(history: StaffAttendanceHistoryRow[]): string[] {
  const byDay = new Map<string, StaffAttendanceHistoryRow[]>();
  for (const row of history) {
    const day = new Date(row.occurred_at).toLocaleDateString('en-CA', { timeZone: SCHOOL_TIMEZONE });
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }
  const today = schoolLocalToday();
  const openDays: string[] = [];
  for (const [day, events] of byDay) {
    if (day === today) continue;
    const sorted = [...events].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    const last = sorted[sorted.length - 1];
    if (last.event_type === 'check_in') openDays.push(day);
  }
  return openDays.sort().reverse();
}

export interface StaffAttendanceReportRow {
  admin_user_id: number;
  staff_label: string;
  event_type: StaffAttendanceEventType;
  occurred_at: string;
  source: StaffAttendanceSource;
  performed_by_label: string | null;
}

export interface StaffAttendanceReportFilters {
  from: string;
  to: string;
  adminUserId?: number | null;
}

export async function getStaffAttendanceReport(filters: StaffAttendanceReportFilters): Promise<StaffAttendanceReportRow[]> {
  return (await sql`
    SELECT a.id AS admin_user_id, COALESCE(a.display_name, a.email) AS staff_label,
      ae.event_type, ae.occurred_at::text, ae.source,
      COALESCE(pa.display_name, pa.email) AS performed_by_label
    FROM staff_attendance_events ae
    JOIN admin_users a ON a.id = ae.admin_user_id
    LEFT JOIN admin_users pa ON pa.id = ae.performed_by_admin_id
    WHERE (ae.occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date BETWEEN ${filters.from}::date AND ${filters.to}::date
      AND (${filters.adminUserId ?? null}::bigint IS NULL OR a.id = ${filters.adminUserId ?? null})
    ORDER BY ae.occurred_at DESC
  `) as unknown as StaffAttendanceReportRow[];
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function staffAttendanceReportToCsv(rows: StaffAttendanceReportRow[]): string {
  const header = ['Staff', 'Date', 'Time', 'Type', 'Source', 'Performed By'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const occurred = new Date(row.occurred_at);
    const date = occurred.toLocaleDateString('en-CA', { timeZone: SCHOOL_TIMEZONE });
    const time = occurred.toLocaleTimeString('en-GB', { timeZone: SCHOOL_TIMEZONE, hour: '2-digit', minute: '2-digit' });
    lines.push(
      [
        row.staff_label,
        date,
        time,
        row.event_type === 'check_in' ? 'Check In' : 'Check Out',
        row.source === 'self' ? 'Self' : 'Admin',
        row.performed_by_label ?? '',
      ]
        .map((v) => csvEscape(String(v)))
        .join(',')
    );
  }
  return lines.join('\n');
}
