import { sql } from '@/lib/db';
import { DAY_ORDER, DAY_LABELS, type DayOfWeek } from '@/lib/class-schedule';

export { DAY_ORDER, DAY_LABELS };

export type DutyType =
  | 'welcome_to_school'
  | 'break_duty'
  | 'lunch_duty'
  | 'cca_supervision'
  | 'non_contact_admin'
  | 'online_teaching_duty'
  | 'other';

export const DUTY_TYPE_LABELS: Record<DutyType, string> = {
  welcome_to_school: 'Welcome to School',
  break_duty: 'Play Break Duty',
  lunch_duty: 'Lunch Duty',
  cca_supervision: 'CCA Supervision',
  non_contact_admin: 'Non-Contact / Admin Time',
  online_teaching_duty: 'Online Teaching Duty',
  other: 'Other',
};

/** The whole-school day structure -- Welcome to School, play break, lunch, and CCAs -- as
 * opposed to non_contact_admin/online_teaching_duty, which are per-teacher arrangements with no
 * single school-wide time. Drives the Grand Roster section of "My Roster" (every staff member's
 * view of the common daily structure, not just their own duties). */
export const SCHOOL_WIDE_DUTY_TYPES: DutyType[] = ['welcome_to_school', 'break_duty', 'lunch_duty', 'cca_supervision'];

export interface DutyPreset {
  dutyType: DutyType;
  label: string;
  startTime: string;
  endTime: string;
}

/** The standard school day, as described for the roster feature: doors open 8:00 with a
 * staff-led welcome, lessons run 8:30-3:30 with a mid-morning play break and a midday lunch
 * break, and CCAs close out the afternoon. These are starting points for the "quick add" buttons
 * in the admin editor -- every field stays editable per assignment. */
export const DUTY_PRESETS: DutyPreset[] = [
  { dutyType: 'welcome_to_school', label: 'Welcome to School', startTime: '08:00', endTime: '08:30' },
  { dutyType: 'break_duty', label: 'Play Break Duty', startTime: '10:00', endTime: '10:20' },
  { dutyType: 'lunch_duty', label: 'Lunch Duty', startTime: '12:00', endTime: '13:00' },
  { dutyType: 'cca_supervision', label: 'CCA Supervision', startTime: '13:30', endTime: '15:30' },
  { dutyType: 'non_contact_admin', label: 'Non-Contact / Admin Time', startTime: '13:30', endTime: '15:30' },
  { dutyType: 'online_teaching_duty', label: 'Online Teaching Duty', startTime: '08:30', endTime: '10:00' },
];

export interface DutyRosterRow {
  id: number;
  admin_user_id: number;
  staff_label: string;
  duty_type: DutyType;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  label: string | null;
  location: string | null;
}

export async function getDutyRosterAll(): Promise<DutyRosterRow[]> {
  const rows = await sql`
    SELECT d.id, d.admin_user_id, COALESCE(a.display_name, a.email) AS staff_label,
           d.duty_type, d.day_of_week, d.start_time, d.end_time, d.label, d.location
    FROM duty_roster d
    JOIN admin_users a ON a.id = d.admin_user_id
    ORDER BY d.day_of_week, d.start_time
  `;
  return rows as unknown as DutyRosterRow[];
}

/** The Grand Roster data -- every whole-school block (see SCHOOL_WIDE_DUTY_TYPES) across every
 * staff member, for any staff member to view (not admin-only like getDutyRosterAll's caller-side
 * usage on the admin editor page; this one's read by the "My Roster" page every staff member can
 * open). */
export async function getSchoolWideDutyRoster(): Promise<DutyRosterRow[]> {
  const rows = await sql`
    SELECT d.id, d.admin_user_id, COALESCE(a.display_name, a.email) AS staff_label,
           d.duty_type, d.day_of_week, d.start_time, d.end_time, d.label, d.location
    FROM duty_roster d
    JOIN admin_users a ON a.id = d.admin_user_id
    WHERE d.duty_type = ANY(${SCHOOL_WIDE_DUTY_TYPES})
    ORDER BY d.day_of_week, d.start_time
  `;
  return rows as unknown as DutyRosterRow[];
}

export async function getDutyRosterForStaff(adminUserId: number): Promise<DutyRosterRow[]> {
  const rows = await sql`
    SELECT d.id, d.admin_user_id, COALESCE(a.display_name, a.email) AS staff_label,
           d.duty_type, d.day_of_week, d.start_time, d.end_time, d.label, d.location
    FROM duty_roster d
    JOIN admin_users a ON a.id = d.admin_user_id
    WHERE d.admin_user_id = ${adminUserId}
    ORDER BY d.day_of_week, d.start_time
  `;
  return rows as unknown as DutyRosterRow[];
}

export async function addDutyEntry(input: {
  adminUserId: number;
  dutyType: DutyType;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  label?: string | null;
  location?: string | null;
}): Promise<number> {
  const rows = await sql`
    INSERT INTO duty_roster (admin_user_id, duty_type, day_of_week, start_time, end_time, label, location)
    VALUES (
      ${input.adminUserId}, ${input.dutyType}, ${input.dayOfWeek},
      ${input.startTime}::time, ${input.endTime}::time, ${input.label ?? null}, ${input.location ?? null}
    )
    RETURNING id
  `;
  return rows[0].id as number;
}

export async function deleteDutyEntry(id: number): Promise<void> {
  await sql`DELETE FROM duty_roster WHERE id = ${id}`;
}

/** Soft nudge for the admin editor -- "ensure all teachers have non-contact time for
 * administration" isn't enforced (a school might legitimately stagger it, or be mid-setup), so
 * this just lists who has none booked anywhere in the week, for the editor to flag. */
export async function getTeachingStaffWithoutNonContactTime(): Promise<{ id: number; label: string }[]> {
  const rows = await sql`
    SELECT a.id, COALESCE(a.display_name, a.email) AS label
    FROM admin_users a
    WHERE a.employment_status = 'teaching_staff'
      AND NOT EXISTS (
        SELECT 1 FROM duty_roster d WHERE d.admin_user_id = a.id AND d.duty_type = 'non_contact_admin'
      )
    ORDER BY label
  `;
  return rows as unknown as { id: number; label: string }[];
}
