import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, CUSTOMER_DEVICE_COOKIE_NAME, type CustomerSessionData } from '@/lib/auth';
import { revokeAllDeviceTokensForAccount } from '@/lib/device-trust';

/** "Log out everywhere" — revokes every trusted device for this account, including the one
 * making this request, and ends the current session too, so the person doing this is signed out
 * here as well and has to log back in fresh (the clean, unambiguous reading of "everywhere"). */
export async function POST() {
  const cookieStore = await cookies();
  const session = await getIronSession<CustomerSessionData>(cookieStore, await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  try {
    await revokeAllDeviceTokensForAccount('customer', session.customerId);
    session.destroy();

    const res = NextResponse.json({ ok: true });
    res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
    return res;
  } catch (err) {
    console.error('[api/account/devices/revoke-all] failed', err);
    return NextResponse.json({ error: 'Could not log out everywhere.' }, { status: 500 });
  }
}
