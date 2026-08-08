import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, CUSTOMER_DEVICE_COOKIE_NAME, type CustomerSessionData } from '@/lib/auth';
import { revokeDeviceTokenById } from '@/lib/device-trust';

/** Revokes one device from the "Trusted Devices" list in account settings. Scoped to the
 * signed-in customer's own id (revokeDeviceTokenById requires an exact accountId match), so this
 * can never be used to revoke another customer's device by guessing an id. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const session = await getIronSession<CustomerSessionData>(cookieStore, await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  }

  const { id } = await params;
  const tokenId = Number(id);
  if (!Number.isInteger(tokenId)) {
    return NextResponse.json({ error: 'Invalid device id.' }, { status: 400 });
  }

  try {
    await revokeDeviceTokenById('customer', session.customerId, tokenId);

    // If the device being revoked is the one making this very request, also clear its cookie —
    // otherwise it would keep trying (and failing) to silently log in on its own next visit. The
    // trusted-devices list already marks is_current server-side (see listDeviceTokens); a client
    // lying about this flag can only ever clear its own cookie, never anyone else's, so trusting
    // it here doesn't need a second DB round trip to re-verify.
    let isCurrentDevice = false;
    try {
      const body = await req.json();
      isCurrentDevice = Boolean(body?.isCurrentDevice);
    } catch {
      // no body sent — fine, just means "not the current device"
    }

    const res = NextResponse.json({ ok: true });
    if (isCurrentDevice) {
      res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
    }
    return res;
  } catch (err) {
    console.error('[api/account/devices/:id/revoke] failed', err);
    return NextResponse.json({ error: 'Could not revoke that device.' }, { status: 500 });
  }
}
