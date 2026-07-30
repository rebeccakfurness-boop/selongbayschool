import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, type AdminSessionData, type StaffRole } from '@/lib/auth';
import { sql } from '@/lib/db';

export interface CurrentStaff {
  adminUserId: number;
  email: string;
  role: StaffRole;
}

/** Reads the already-authenticated admin session (see src/proxy.ts, which guarantees
 * adminUserId is set for every /admin/* page) and returns it in a typed, non-optional shape. */
export async function getCurrentStaff(): Promise<CurrentStaff> {
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  return {
    adminUserId: session.adminUserId!,
    email: session.email!,
    // Sessions created before the role column existed have no role stored; treat them as admin
    // rather than locking out the account that was already using this app.
    role: session.role ?? 'admin',
  };
}

/** Call at the top of any page/route that's admin-only (the booking system, invoicing settings,
 * etc.) — the proxy only enforces "is a logged-in staff member", not role, so per-page pages must
 * gate themselves. Sends a teacher back to the Family Board rather than an error page, since
 * ending up here is a nav mistake, not a real attempt to reach something they shouldn't. */
export async function requireAdmin(): Promise<CurrentStaff> {
  const staff = await getCurrentStaff();
  if (staff.role !== 'admin') {
    redirect('/admin/families');
  }
  return staff;
}

export async function getAssignedClasses(adminUserId: number): Promise<string[]> {
  const rows = (await sql`
    SELECT class_name FROM teacher_assignments WHERE admin_user_id = ${adminUserId}
  `) as unknown as { class_name: string }[];
  return rows.map((r) => r.class_name);
}

/** Inverse of getAssignedClasses — every teacher assigned to a class, by email. Used to notify a
 * child's own teacher(s) when a parent edits medical/dietary info, alongside the school inbox. */
export async function getTeacherEmailsForClass(className: string | null): Promise<string[]> {
  if (!className) return [];
  const rows = (await sql`
    SELECT DISTINCT au.email FROM teacher_assignments ta
    JOIN admin_users au ON au.id = ta.admin_user_id
    WHERE ta.class_name = ${className}
  `) as unknown as { email: string }[];
  return rows.map((r) => r.email);
}

/** Admins can touch any class; teachers only their own assignments (used to gate lesson plans,
 * curriculum units, work samples, and learning profiles by class, alongside the child/board-level
 * scoping already applied elsewhere). */
export async function canAccessClass(staff: CurrentStaff, className: string | null): Promise<boolean> {
  if (staff.role === 'admin') return true;
  if (!className) return false;
  const assigned = await getAssignedClasses(staff.adminUserId);
  return assigned.includes(className);
}
