import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, sanitizeNextPath, CUSTOMER_DEVICE_COOKIE_NAME, deviceCookieOptions, type CustomerSessionData } from '@/lib/auth';
import { createDeviceToken, checkRateLimit } from '@/lib/device-trust';
import { customerVerifyCodeSchema } from '@/lib/validation';

const GENERIC_ERROR = 'That code is incorrect or has expired. Please check it or request a new one.';

/** Typed-code counterpart to /api/account/verify's link click -- same login, same
 * session/device-cookie outcome, just reached by typing the 6-digit code from the email instead
 * of clicking its link. Exists because a parent tapping the link from their email app's own
 * in-app browser sets the session/device cookie in THAT browser, not the one they normally use --
 * typing the code here happens directly in whichever browser they're looking at, so it always
 * lands in the right place. Only 900,000 possible codes (vs. the link's 256-bit token), so this
 * is rate-limited far more tightly than anything else in the auth flow. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = customerVerifyCodeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }
  const { email, code } = parsed.data;
  const next = sanitizeNextPath((body as { next?: unknown }).next, '/account');

  try {
    await ensureSchema();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit('customer-verify-code', `${ip}:${email.toLowerCase()}`, { maxAttempts: 8, windowSeconds: 1800 });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new code.' }, { status: 429 });
    }

    const rows = await sql`
      SELECT id, email FROM customers
      WHERE email = ${email} AND magic_link_code = ${code} AND magic_link_token_expires_at > now()
    `;
    const customer = rows[0];
    if (!customer) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
    }

    // Single-use: clear both the code and its paired link token together, so neither can be
    // replayed once either one has been used.
    await sql`
      UPDATE customers
      SET magic_link_token = NULL, magic_link_code = NULL, magic_link_token_expires_at = NULL, last_login_at = now()
      WHERE id = ${customer.id}
    `;

    const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
    session.customerId = customer.id as number;
    session.email = customer.email as string;
    await session.save();

    const deviceToken = await createDeviceToken('customer', customer.id as number, req.headers);
    const res = NextResponse.json({ ok: true, next });
    res.cookies.set(CUSTOMER_DEVICE_COOKIE_NAME, deviceToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/account/verify-code] failed', err);
    return NextResponse.json({ error: 'Could not verify that code right now. Please try again shortly.' }, { status: 500 });
  }
}
