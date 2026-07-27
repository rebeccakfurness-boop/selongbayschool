import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSessionOptions, type AdminSessionData, type StaffRole } from '@/lib/auth';

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
