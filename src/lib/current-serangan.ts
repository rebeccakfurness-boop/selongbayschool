import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSeranganSessionOptions, type SeranganSessionData } from '@/lib/auth';

export interface CurrentSeranganAdmin {
  seranganAdminId: number;
  email: string;
}

/** Reads the already-authenticated Serangan session (see src/proxy.ts, which guarantees
 * seranganAdminId is set for every /serangan/* page) and returns it in a typed, non-optional
 * shape -- same role as lib/current-staff.ts's getCurrentStaff, for the separate Serangan login. */
export async function getCurrentSeranganAdmin(): Promise<CurrentSeranganAdmin> {
  const session = await getIronSession<SeranganSessionData>(await cookies(), await getSeranganSessionOptions());
  return {
    seranganAdminId: session.seranganAdminId!,
    email: session.email!,
  };
}
