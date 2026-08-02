import { sql } from '@/lib/db';

const SCHOOL_TIMEZONE = 'Asia/Makassar';

/** School-local "today" as YYYY-MM-DD, used to group check-in/out events into a school day and to
 * decide the kiosk's default AM/PM mode — the server may run in UTC, so this can't just be
 * `new Date().toISOString().slice(0, 10)`. */
export function schoolLocalToday(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: SCHOOL_TIMEZONE });
}

/** Before noon school-local time defaults the kiosk to Check In mode, afternoon defaults to Check
 * Out — staff can always override the mode by hand, this is just the walk-up-and-tap default. */
export function schoolLocalIsMorning(): boolean {
  const hour = Number(
    new Date().toLocaleString('en-US', { timeZone: SCHOOL_TIMEZONE, hour: 'numeric', hour12: false })
  );
  return hour < 12;
}

export type AttendanceEventType = 'check_in' | 'check_out';
export type AttendanceSessionType = 'daily' | 'activity';
export type AttendanceSource = 'kiosk' | 'parent_portal' | 'admin';
export type EnrollmentType = 'regular' | 'activities_only';

export interface RecordAttendanceInput {
  childId: number;
  eventType: AttendanceEventType;
  sessionType: AttendanceSessionType;
  activityId?: number | null;
  source: AttendanceSource;
  performedByCustomerId?: number | null;
  performedByAdminId?: number | null;
  notes?: string | null;
  /** Only ever set for admin corrections (backdating a missed check-in/out) — kiosk and portal
   * actions always use the insert's own `now()` default, never a client-supplied timestamp. */
  occurredAt?: string | null;
  /** Required by attendanceCheckSchema for 'kiosk'/'parent_portal' sources (the parent signing
   * for the check-in/out), always null for 'admin' — an admin correction is the explicit override
   * of the signature requirement, not another way to collect one. */
  signatureDataUrl?: string | null;
  signedByName?: string | null;
}

export interface AttendanceEventRow {
  id: number;
  child_id: number;
  event_type: AttendanceEventType;
  session_type: AttendanceSessionType;
  activity_id: number | null;
  activity_name: string | null;
  occurred_at: string;
  source: AttendanceSource;
  performed_by_label: string | null;
}

export async function recordAttendanceEvent(input: RecordAttendanceInput): Promise<AttendanceEventRow> {
  const rows = (await sql`
    INSERT INTO attendance_events (
      child_id, event_type, session_type, activity_id, source, performed_by_customer_id, performed_by_admin_id, notes,
      occurred_at, signature_data_url, signed_by_name
    ) VALUES (
      ${input.childId}, ${input.eventType}, ${input.sessionType}, ${input.activityId ?? null},
      ${input.source}, ${input.performedByCustomerId ?? null}, ${input.performedByAdminId ?? null}, ${input.notes ?? null},
      COALESCE(${input.occurredAt ?? null}::timestamptz, now()), ${input.signatureDataUrl ?? null}, ${input.signedByName ?? null}
    )
    RETURNING id, child_id, event_type, session_type, activity_id, occurred_at::text, source
  `) as unknown as (Omit<AttendanceEventRow, 'activity_name' | 'performed_by_label'>)[];
  const row = rows[0];
  return { ...row, activity_name: null, performed_by_label: null };
}

export interface KioskRosterChildRow {
  id: number;
  child_full_name: string;
  child_nickname: string | null;
  photo_url: string | null;
  class_name: string | null;
  enrollment_type: EnrollmentType;
  last_event_type: AttendanceEventType | null;
  last_event_time: string | null;
}

/** The kiosk's daily gate roster — regular students only (activities-only students never appear
 * on the AM/PM gate list, see /kiosk/activities for their flow instead), each annotated with
 * today's most recent daily check-in/out so the kiosk can show "already checked in" state. */
export async function getDailyKioskRoster(): Promise<KioskRosterChildRow[]> {
  const today = schoolLocalToday();
  return (await sql`
    SELECT c.id, c.child_full_name, c.child_nickname, c.photo_url, c.class_name, c.enrollment_type,
      latest.event_type AS last_event_type, latest.occurred_at::text AS last_event_time
    FROM children c
    LEFT JOIN LATERAL (
      SELECT event_type, occurred_at
      FROM attendance_events
      WHERE child_id = c.id AND session_type = 'daily'
        AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date = ${today}::date
      ORDER BY occurred_at DESC
      LIMIT 1
    ) latest ON true
    WHERE c.is_active = true AND c.enrollment_type = 'regular'
    ORDER BY c.child_full_name
  `) as unknown as KioskRosterChildRow[];
}

/** The activity check-in roster — every active student (regular or activities-only), since either
 * kind of student can attend a bookable activity. Not date/time-scoped to "today's" activities:
 * kept to a simple activity-name picker rather than matching a specific booked session slot. */
export async function getActivityKioskRoster(): Promise<Omit<KioskRosterChildRow, 'last_event_type' | 'last_event_time'>[]> {
  return (await sql`
    SELECT id, child_full_name, child_nickname, photo_url, class_name, enrollment_type
    FROM children
    WHERE is_active = true
    ORDER BY child_full_name
  `) as unknown as Omit<KioskRosterChildRow, 'last_event_type' | 'last_event_time'>[];
}

export interface ActivityOption {
  id: number;
  name: string;
}

export async function getActiveActivityOptions(): Promise<ActivityOption[]> {
  return (await sql`SELECT id, name FROM activities WHERE is_active = true ORDER BY name`) as unknown as ActivityOption[];
}

/** Today's most recent event per (child, session_type, activity) — used by both the kiosk and the
 * parent portal to show "Check In" vs "Check Out" as the primary action, and by the kiosk activity
 * flow to know a student's current in/out state for a specific activity. */
export async function getTodayEventStatus(
  childId: number,
  sessionType: AttendanceSessionType,
  activityId?: number | null
): Promise<{ event_type: AttendanceEventType; occurred_at: string } | null> {
  const today = schoolLocalToday();
  const rows = (await sql`
    SELECT event_type, occurred_at::text
    FROM attendance_events
    WHERE child_id = ${childId} AND session_type = ${sessionType}
      AND (activity_id IS NOT DISTINCT FROM ${activityId ?? null})
      AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date = ${today}::date
    ORDER BY occurred_at DESC
    LIMIT 1
  `) as unknown as { event_type: AttendanceEventType; occurred_at: string }[];
  return rows[0] ?? null;
}

/** Every daily check-in status for a guardian's children in one query (used by the parent portal
 * overview/attendance pages) — avoids one round-trip per child. */
export async function getTodayDailyStatusForChildren(
  childIds: number[]
): Promise<Map<number, { event_type: AttendanceEventType; occurred_at: string }>> {
  if (childIds.length === 0) return new Map();
  const today = schoolLocalToday();
  const rows = (await sql`
    SELECT DISTINCT ON (child_id) child_id, event_type, occurred_at::text
    FROM attendance_events
    WHERE child_id = ANY(${childIds}) AND session_type = 'daily'
      AND (occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date = ${today}::date
    ORDER BY child_id, occurred_at DESC
  `) as unknown as { child_id: number; event_type: AttendanceEventType; occurred_at: string }[];
  return new Map(rows.map((r) => [r.child_id, { event_type: r.event_type, occurred_at: r.occurred_at }]));
}

export interface AttendanceHistoryRow {
  id: number;
  event_type: AttendanceEventType;
  session_type: AttendanceSessionType;
  activity_name: string | null;
  occurred_at: string;
  source: AttendanceSource;
  performed_by_label: string | null;
  signed_by_name: string | null;
  has_signature: boolean;
}

/** Full history for one student's card — joins activity name and, for portal/admin actions, the
 * acting account's name/email. `signed_by_name` is the person who actually signed at the point of
 * check-in/out (typed at the kiosk, or the logged-in parent's own name on the portal) — for a
 * kiosk row that's the only identity captured at all, since there's no login there. */
export async function getAttendanceHistoryForChild(childId: number, limit = 200): Promise<AttendanceHistoryRow[]> {
  return (await sql`
    SELECT ae.id, ae.event_type, ae.session_type, a.name AS activity_name, ae.occurred_at::text, ae.source,
      COALESCE(cu.name, cu.email, au.email) AS performed_by_label,
      ae.signed_by_name, (ae.signature_data_url IS NOT NULL) AS has_signature
    FROM attendance_events ae
    LEFT JOIN activities a ON a.id = ae.activity_id
    LEFT JOIN customers cu ON cu.id = ae.performed_by_customer_id
    LEFT JOIN admin_users au ON au.id = ae.performed_by_admin_id
    WHERE ae.child_id = ${childId}
    ORDER BY ae.occurred_at DESC
    LIMIT ${limit}
  `) as unknown as AttendanceHistoryRow[];
}

/** A daily session_type day is "open" (an anomaly worth flagging) when its last event that day is
 * a check_in with no matching check_out — computed from the same history rather than a separate
 * query, since the student card always loads history anyway. */
export function findOpenDailyAttendanceDays(history: AttendanceHistoryRow[]): string[] {
  const byDay = new Map<string, AttendanceHistoryRow[]>();
  for (const row of history) {
    if (row.session_type !== 'daily') continue;
    const day = new Date(row.occurred_at).toLocaleDateString('en-CA', { timeZone: SCHOOL_TIMEZONE });
    const list = byDay.get(day) ?? [];
    list.push(row);
    byDay.set(day, list);
  }
  const today = schoolLocalToday();
  const openDays: string[] = [];
  for (const [day, events] of byDay) {
    if (day === today) continue; // today's not "open" until the school day is actually over
    const sorted = [...events].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
    const last = sorted[sorted.length - 1];
    if (last.event_type === 'check_in') openDays.push(day);
  }
  return openDays.sort().reverse();
}

export interface AttendanceReportRow {
  child_id: number;
  child_full_name: string;
  class_name: string | null;
  event_type: AttendanceEventType;
  session_type: AttendanceSessionType;
  activity_name: string | null;
  occurred_at: string;
  source: AttendanceSource;
  performed_by_label: string | null;
  signed_by_name: string | null;
}

export interface AttendanceReportFilters {
  from: string;
  to: string;
  classFilter?: string | null;
  childId?: number | null;
}

export async function getAttendanceReport(filters: AttendanceReportFilters): Promise<AttendanceReportRow[]> {
  return (await sql`
    SELECT c.id AS child_id, c.child_full_name, c.class_name, ae.event_type, ae.session_type,
      a.name AS activity_name, ae.occurred_at::text, ae.source,
      COALESCE(cu.name, cu.email, au.email) AS performed_by_label, ae.signed_by_name
    FROM attendance_events ae
    JOIN children c ON c.id = ae.child_id
    LEFT JOIN activities a ON a.id = ae.activity_id
    LEFT JOIN customers cu ON cu.id = ae.performed_by_customer_id
    LEFT JOIN admin_users au ON au.id = ae.performed_by_admin_id
    WHERE (ae.occurred_at AT TIME ZONE ${SCHOOL_TIMEZONE})::date BETWEEN ${filters.from}::date AND ${filters.to}::date
      AND (${filters.classFilter ?? null}::text IS NULL OR c.class_name = ${filters.classFilter ?? null})
      AND (${filters.childId ?? null}::bigint IS NULL OR c.id = ${filters.childId ?? null})
    ORDER BY ae.occurred_at DESC
  `) as unknown as AttendanceReportRow[];
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function attendanceReportToCsv(rows: AttendanceReportRow[]): string {
  const header = ['Student', 'Class', 'Date', 'Time', 'Type', 'Session', 'Activity', 'Source', 'Performed By', 'Signed By'];
  const lines = [header.join(',')];
  for (const row of rows) {
    const occurred = new Date(row.occurred_at);
    const date = occurred.toLocaleDateString('en-CA', { timeZone: SCHOOL_TIMEZONE });
    const time = occurred.toLocaleTimeString('en-GB', { timeZone: SCHOOL_TIMEZONE, hour: '2-digit', minute: '2-digit' });
    lines.push(
      [
        row.child_full_name,
        row.class_name ?? '',
        date,
        time,
        row.event_type === 'check_in' ? 'Check In' : 'Check Out',
        row.session_type === 'daily' ? 'Daily' : 'Activity',
        row.activity_name ?? '',
        row.source === 'kiosk' ? 'Kiosk' : row.source === 'parent_portal' ? 'Parent Portal' : 'Admin',
        row.performed_by_label ?? '',
        row.signed_by_name ?? '',
      ]
        .map((v) => csvEscape(String(v)))
        .join(',')
    );
  }
  return lines.join('\n');
}

/** Looks up one event's signature image (data URL) for the admin Child Card's "view signature"
 * link — kept out of getAttendanceHistoryForChild's normal result set since embedding a base64
 * image in every row of a 200-row history load would be wasteful; only fetched on demand. */
export async function getAttendanceEventSignature(eventId: number, childId: number): Promise<{ signatureDataUrl: string | null; signedByName: string | null } | null> {
  const rows = (await sql`
    SELECT signature_data_url, signed_by_name FROM attendance_events WHERE id = ${eventId} AND child_id = ${childId}
  `) as unknown as { signature_data_url: string | null; signed_by_name: string | null }[];
  if (rows.length === 0) return null;
  return { signatureDataUrl: rows[0].signature_data_url, signedByName: rows[0].signed_by_name };
}

export interface TodayRosterSummary {
  childId: number;
  childFullName: string;
  className: string | null;
  status: 'not_arrived' | 'checked_in' | 'checked_out';
  lastEventTime: string | null;
}

/** Today's whole-school gate summary for the admin attendance dashboard. */
export async function getTodayRosterSummary(): Promise<TodayRosterSummary[]> {
  const roster = await getDailyKioskRoster();
  return roster.map((r) => ({
    childId: r.id,
    childFullName: r.child_full_name,
    className: r.class_name,
    status: r.last_event_type === 'check_in' ? 'checked_in' : r.last_event_type === 'check_out' ? 'checked_out' : 'not_arrived',
    lastEventTime: r.last_event_time,
  }));
}
