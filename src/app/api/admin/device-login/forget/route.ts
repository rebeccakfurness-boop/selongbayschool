import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sanitizeNextPath, ADMIN_DEVICE_COOKIE_NAME } from '@/lib/auth';
import { revokeDeviceToken } from '@/lib/device-trust';
import { adminLoginPathFromParam } from '@/lib/admin-login-path';

/** "Not you? Log in with something else" on staff's "Continue as [name]?" screen — revokes the
 * token outright and shows the normal password form. Matters on a shared staffroom computer:
 * this is how the next person stops the previous teacher's remembered login from being offered
 * to them at all, not just this one visit. */
export async function GET(req: NextRequest) {
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/admin');
  const loginPath = adminLoginPathFromParam(req.nextUrl.searchParams.get('from'));
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(ADMIN_DEVICE_COOKIE_NAME)?.value;
  if (deviceToken) {
    await revokeDeviceToken('admin', deviceToken);
  }
  const res = NextResponse.redirect(new URL(`${loginPath}?next=${encodeURIComponent(next)}`, req.url));
  res.cookies.delete(ADMIN_DEVICE_COOKIE_NAME);
  return res;
}
