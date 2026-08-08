import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sanitizeNextPath, STUDENT_DEVICE_COOKIE_NAME } from '@/lib/auth';
import { revokeDeviceToken } from '@/lib/device-trust';

/** "Not you? Log in with something else" on the "Continue as [name]?" screen — revokes the
 * token outright (not just ignores it) and shows the normal username/password form. Important
 * on a shared classroom or family device: this is how a second child stops the first one's
 * remembered login from being offered to them at all on their next visit too, not just this one. */
export async function GET(req: NextRequest) {
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/student');
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(STUDENT_DEVICE_COOKIE_NAME)?.value;
  if (deviceToken) {
    await revokeDeviceToken('student', deviceToken);
  }
  const res = NextResponse.redirect(new URL(`/student/login?next=${encodeURIComponent(next)}`, req.url));
  res.cookies.delete(STUDENT_DEVICE_COOKIE_NAME);
  return res;
}
