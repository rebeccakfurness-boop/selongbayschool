import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import {
  getStudentSessionOptions,
  sanitizeNextPath,
  STUDENT_DEVICE_COOKIE_NAME,
  deviceCookieOptions,
  type StudentSessionData,
} from '@/lib/auth';
import { verifyAndRotateDeviceToken, checkRateLimit } from '@/lib/device-trust';

/** Redeems a "remember this device" cookie for a student — same pattern as
 * /api/account/device-login for parents. Never shows an error on failure: falls back to the
 * normal username/password form exactly as if the cookie had never been there. */
export async function GET(req: NextRequest) {
  const next = sanitizeNextPath(req.nextUrl.searchParams.get('next'), '/student');
  const loginUrl = new URL('/student/login', req.url);
  loginUrl.searchParams.set('next', next);

  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(STUDENT_DEVICE_COOKIE_NAME)?.value;
  if (!deviceToken) {
    return NextResponse.redirect(loginUrl);
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit('student-device-login', ip, { maxAttempts: 20, windowSeconds: 300 });
  if (!rateLimit.allowed) {
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete(STUDENT_DEVICE_COOKIE_NAME);
    return res;
  }

  try {
    await ensureSchema();
    const result = await verifyAndRotateDeviceToken('student', deviceToken, req.headers);

    if (!result) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(STUDENT_DEVICE_COOKIE_NAME);
      return res;
    }

    const rows = await sql`SELECT child_id FROM student_accounts WHERE id = ${result.accountId}`;
    const account = rows[0];
    if (!account) {
      const res = NextResponse.redirect(loginUrl);
      res.cookies.delete(STUDENT_DEVICE_COOKIE_NAME);
      return res;
    }

    const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
    session.studentAccountId = result.accountId;
    session.childId = account.child_id as number;
    await session.save();
    await sql`UPDATE student_accounts SET last_login_at = now() WHERE id = ${result.accountId}`;

    const res = NextResponse.redirect(new URL(next, req.url));
    res.cookies.set(STUDENT_DEVICE_COOKIE_NAME, result.newRawToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/student/device-login] failed', err);
    return NextResponse.redirect(loginUrl);
  }
}
