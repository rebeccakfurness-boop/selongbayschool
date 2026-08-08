import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getStudentSessionOptions, STUDENT_DEVICE_COOKIE_NAME, type StudentSessionData } from '@/lib/auth';
import { revokeDeviceToken } from '@/lib/device-trust';

/** Logging out also forgets the device — not just ending the session — so a shared classroom or
 * family computer isn't left silently trusted for the rest of the token's 45-day window. */
export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<StudentSessionData>(cookieStore, await getStudentSessionOptions());
  session.destroy();

  const deviceToken = cookieStore.get(STUDENT_DEVICE_COOKIE_NAME)?.value;
  if (deviceToken) {
    await revokeDeviceToken('student', deviceToken);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(STUDENT_DEVICE_COOKIE_NAME);
  return res;
}
