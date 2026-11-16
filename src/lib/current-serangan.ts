import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getIronSession } from 'iron-session';
import { getSeranganSessionOptions, type SeranganSessionData, type SeranganRole } from '@/lib/auth';

export interface CurrentSeranganAdmin {
  seranganAdminId: number;
  email: string;
  role: SeranganRole;
}

/** Reads the already-authenticated Serangan session (see src/proxy.ts, which guarantees
 * seranganAdminId is set for every /serangan/* page) and returns it in a typed, non-optional
 * shape -- same role as lib/current-staff.ts's getCurrentStaff, for the separate Serangan login. */
export async function getCurrentSeranganAdmin(): Promise<CurrentSeranganAdmin> {
  const session = await getIronSession<SeranganSessionData>(await cookies(), await getSeranganSessionOptions());
  return {
    seranganAdminId: session.seranganAdminId!,
    email: session.email!,
    // Sessions created before the role column existed have no role stored; treat them as admin
    // rather than locking out the account that was already using this dashboard.
    role: session.role ?? 'admin',
  };
}

/** Call at the top of any PAGE (server component) that only Shaun/Elizabeth (role 'admin')
 * should reach -- finances, statement import, reports, and user management all surface budget/
 * donation/expenditure figures a 'staff' account must never see. Sends a 'staff' account back to
 * the Overview page rather than an error, since ending up here is a nav mistake, not a real
 * attempt to reach something they shouldn't. Do not use this inside a route handler -- see
 * requireSeranganAdminApi below for why. */
export async function requireSeranganAdmin(): Promise<CurrentSeranganAdmin> {
  const admin = await getCurrentSeranganAdmin();
  if (admin.role !== 'admin') {
    redirect('/serangan');
  }
  return admin;
}

/** The route-handler equivalent of requireSeranganAdmin above. Throws rather than redirects --
 * same reasoning as requireBudgetUnlocked in lib/current-staff.ts: a route handler returning
 * JSON should give the client a real 403 to show, not a redirect fetch() would just follow
 * silently and then fail to parse as JSON. Callers catch Error('SERANGAN_FORBIDDEN') and return
 * NextResponse.json({ error: ... }, { status: 403 }). */
export async function requireSeranganAdminApi(): Promise<CurrentSeranganAdmin> {
  const admin = await getCurrentSeranganAdmin();
  if (admin.role !== 'admin') {
    throw new Error('SERANGAN_FORBIDDEN');
  }
  return admin;
}
