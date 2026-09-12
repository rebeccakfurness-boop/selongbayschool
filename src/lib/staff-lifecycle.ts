import { sql } from './db';
import type { EmploymentStatus } from './staff-data';

export { ACTIVE_EMPLOYMENT_STATUSES, isActiveEmploymentStatus } from './staff-lifecycle-shared';
import { isActiveEmploymentStatus } from './staff-lifecycle-shared';

export type StatusTransitionResult = { ok: true } | { ok: false; error: string };

/** The guard rail for the Teacher Board: a card can't land in an active-employee column (casual,
 * teaching, or admin staff) without a start date already on file -- mirrors
 * checkActiveStatusGuardRail in child-lifecycle.ts (enrolment date/programme there). Moving
 * between two active statuses, into 'applicant', or into 'past_employee' is never blocked. */
export async function checkActiveEmploymentGuardRail(adminUserId: number, targetStatus: EmploymentStatus): Promise<StatusTransitionResult> {
  if (!isActiveEmploymentStatus(targetStatus)) return { ok: true };
  const rows = (await sql`SELECT start_date, employment_status FROM admin_users WHERE id = ${adminUserId}`) as unknown as {
    start_date: string | null;
    employment_status: EmploymentStatus;
  }[];
  const staff = rows[0];
  if (!staff) return { ok: false, error: 'Staff member not found.' };
  if (staff.employment_status === targetStatus) return { ok: true };
  if (!staff.start_date) {
    return { ok: false, error: 'Set a start date first (Edit on the Staff Card).' };
  }
  return { ok: true };
}
