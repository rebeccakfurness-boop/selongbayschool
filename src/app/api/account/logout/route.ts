import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, CUSTOMER_DEVICE_COOKIE_NAME, type CustomerSessionData } from '@/lib/auth';
import { revokeDeviceToken } from '@/lib/device-trust';

/** Logging out also forgets the device — not just ending the session — so a shared or school
 * computer isn't left silently trusted for the rest of the token's 45-day window. */
export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<CustomerSessionData>(cookieStore, await getCustomerSessionOptions());
  session.destroy();

  const deviceToken = cookieStore.get(CUSTOMER_DEVICE_COOKIE_NAME)?.value;
  if (deviceToken) {
    await revokeDeviceToken('customer', deviceToken);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
  return res;
}
