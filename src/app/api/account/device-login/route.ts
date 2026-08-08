import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import {
  getCustomerSessionOptions,
  sanitizeNextPath,
  CUSTOMER_DEVICE_COOKIE_NAME,
  deviceCookieOptions,
  type CustomerSessionData,
} from '@/lib/auth';
import { verifyAndRotateDeviceToken, checkRateLimit } from '@/lib/device-trust';

/** Redeems a "remember this device" cookie for a parent — reached only via the redirect from
 * /account/login when that cookie is present. Never shows an error on failure: an invalid,
 * expired, or already-used-and-rotated token just falls back to the normal magic-link form,
 * exactly as if the cookie had never been there (spec: "no dead ends or errors"). */
export async function GET(req: NextRequest) {
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/account');
  const loginUrl = new URL('/account/login', req.url);
  loginUrl.searchParams.set('next', next);

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(CUSTOMER_DEVICE_COOKIE_NAME)?.value;
  if (!deviceToken) {
    return NextResponse.redirect(loginUrl);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit('customer-device-login', ip, { maxAttempts: 20, windowSeconds: 300 });
  if (!rateLimit.allowed) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
    return res;
  }

  try {
    await ensureSchema();
    const result = await verifyAndRotateDeviceToken('customer', deviceToken, req.headers);

    if (!result) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
      return res;
    }

    const rows = await sql`SELECT email FROM customers WHERE id = ${result.accountId}`;
    const customer = rows[0];
    if (!customer) {
      // Shouldn't happen — verifyAndRotateDeviceToken already checks the account exists — but
      // fall back safely rather than creating a session with no email.
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(CUSTOMER_DEVICE_COOKIE_NAME);
      return res;
    }

    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    session.customerId = result.accountId;
    session.email = customer.email as string;
    await session.save();
    await sql`UPDATE customers SET last_login_at = now() WHERE id = ${result.accountId}`;

    const res = NextResponse.redirect(new URL(next, req.url));
    res.cookies.set(CUSTOMER_DEVICE_COOKIE_NAME, result.newRawToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/account/device-login] failed', err);
    return NextResponse.redirect(loginUrl);
  }
}
