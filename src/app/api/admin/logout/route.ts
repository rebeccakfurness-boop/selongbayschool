import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getSessionOptions, ADMIN_DEVICE_COOKIE_NAME, type AdminSessionData } from '@/lib/auth';
import { revokeDeviceToken } from '@/lib/device-trust';

export async function POST() {
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  session.destroy();

  // Logging out also forgets the device, same as the parent/student flows -- important on a
  // shared staffroom computer, where "log out" should mean the next person sees a fresh login.
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(ADMIN_DEVICE_COOKIE_NAME)?.value;
  if (deviceToken) {
    await revokeDeviceToken('admin', deviceToken);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_DEVICE_COOKIE_NAME);
  return res;
}
