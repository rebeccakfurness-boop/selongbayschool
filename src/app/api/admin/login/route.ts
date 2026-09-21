import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, ADMIN_DEVICE_COOKIE_NAME, deviceCookieOptions, type AdminSessionData } from '@/lib/auth';
import { adminLoginSchema } from '@/lib/validation';
import { createDeviceToken } from '@/lib/device-trust';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please enter your email and password.' },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`SELECT id, email, password_hash, role, is_active FROM admin_users WHERE email = ${email}`;
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }
    if (!user.is_active) {
      return NextResponse.json({ error: 'This account has been deactivated. Contact the school office.' }, { status: 403 });
    }

    const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
    session.adminUserId = user.id as number;
    session.email = user.email as string;
    session.role = user.role as AdminSessionData['role'];
    await session.save();

    // "Remember this device" is automatic, same as the parent/student login flows — the admin
    // session cookie itself only lasts 12 hours, so without this a teacher or admin who doesn't
    // touch the portal for half a day is back to typing their password in again.
    const deviceToken = await createDeviceToken('admin', user.id as number, req.headers);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(ADMIN_DEVICE_COOKIE_NAME, deviceToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/admin/login] failed', err);
    return NextResponse.json({ error: 'Could not log in right now. Please try again shortly.' }, { status: 500 });
  }
}
