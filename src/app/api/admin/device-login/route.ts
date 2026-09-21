import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import {
  getSessionOptions,
  sanitizeNextPath,
  ADMIN_DEVICE_COOKIE_NAME,
  deviceCookieOptions,
  type AdminSessionData,
} from '@/lib/auth';
import { verifyAndRotateDeviceToken, checkRateLimit } from '@/lib/device-trust';
import { adminLoginPathFromParam } from '@/lib/admin-login-path';

/** Redeems a "remember this device" cookie for staff — reached only via the redirect from
 * /admin/login or /teacher/login when that cookie is present. Mirrors
 * /api/account/device-login exactly: never shows an error on failure, an invalid/expired/rotated
 * token just falls back to the normal password form. */
export async function GET(req: NextRequest) {
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/admin');
  const loginPath = adminLoginPathFromParam(req.nextUrl.searchParams.get('from'));
  const loginUrl = new URL(loginPath, req.url);
  loginUrl.searchParams.set('next', next);

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(ADMIN_DEVICE_COOKIE_NAME)?.value;
  if (!deviceToken) {
    return NextResponse.redirect(loginUrl);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit('admin-device-login', ip, { maxAttempts: 20, windowSeconds: 300 });
  if (!rateLimit.allowed) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(ADMIN_DEVICE_COOKIE_NAME);
    return res;
  }

  try {
    await ensureSchema();
    const result = await verifyAndRotateDeviceToken('admin', deviceToken, req.headers);

    if (!result) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(ADMIN_DEVICE_COOKIE_NAME);
      return res;
    }

    const rows = await sql`SELECT email, role FROM admin_users WHERE id = ${result.accountId}`;
    const user = rows[0];
    if (!user) {
      // Shouldn't happen -- verifyAndRotateDeviceToken already checks the account exists -- but
      // fall back safely rather than creating a session with no email/role.
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(ADMIN_DEVICE_COOKIE_NAME);
      return res;
    }

    const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
    session.adminUserId = result.accountId;
    session.email = user.email as string;
    session.role = user.role as AdminSessionData['role'];
    await session.save();

    const res = NextResponse.redirect(new URL(next, req.url));
    res.cookies.set(ADMIN_DEVICE_COOKIE_NAME, result.newRawToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/admin/device-login] failed', err);
    return NextResponse.redirect(loginUrl);
  }
}
