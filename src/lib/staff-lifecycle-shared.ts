import type { EmploymentStatus } from '@/lib/staff-data';

/** Pure helpers with no DB access, split out from staff-lifecycle.ts specifically so
 * StaffBoard.tsx (a client component) can import them without pulling '@neondatabase/serverless'
 * into the browser bundle -- same reasoning as child-lifecycle-shared.ts. staff-lifecycle.ts
 * re-exports everything here too, so server code can import from either file. */

export const ACTIVE_EMPLOYMENT_STATUSES: EmploymentStatus[] = ['casual_employee', 'teaching_staff', 'admin_staff'];

export function isActiveEmploymentStatus(status: EmploymentStatus): boolean {
  return (ACTIVE_EMPLOYMENT_STATUSES as string[]).includes(status);
}
