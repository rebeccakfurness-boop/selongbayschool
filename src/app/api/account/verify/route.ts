import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, sanitizeNextPath, CUSTOMER_DEVICE_COOKIE_NAME, deviceCookieOptions, type CustomerSessionData } from '@/lib/auth';
import { createDeviceToken } from '@/lib/device-trust';

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/account');

  if (!token) {
    return NextResponse.redirect(new URL('/account/login?error=invalid', req.url));
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, email FROM customers
      WHERE magic_link_token = ${token} AND magic_link_token_expires_at > now()
    `;
    const customer = rows[0];

    if (!customer) {
      return NextResponse.redirect(new URL('/account/login?error=expired', req.url));
    }

    // Single-use: clear the token immediately so the same email link can't be replayed.
    await sql`
      UPDATE customers
      SET magic_link_token = NULL, magic_link_token_expires_at = NULL, last_login_at = now()
      WHERE id = ${customer.id}
    `;

    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    session.customerId = customer.id as number;
    session.email = customer.email as string;
    await session.save();

    // "Remember this device" is automatic, not opt-in — every successful login trusts the
    // device so the next visit can skip the email round-trip entirely (see lib/device-trust.ts).
    const deviceToken = await createDeviceToken('customer', customer.id as number, req.headers);
    const res = NextResponse.redirect(new URL(next, req.url));
    res.cookies.set(CUSTOMER_DEVICE_COOKIE_NAME, deviceToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/account/verify] failed', err);
    return NextResponse.redirect(new URL('/account/login?error=server', req.url));
  }
}
