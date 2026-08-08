import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, STUDENT_DEVICE_COOKIE_NAME, deviceCookieOptions, type StudentSessionData } from '@/lib/auth';
import { studentLoginSchema } from '@/lib/validation';
import { createDeviceToken, checkRateLimit } from '@/lib/device-trust';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = studentLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please enter your username and password.' },
      { status: 400 }
    );
  }
  const { username, password } = parsed.data;

  // Password login had no throttling at all until now — a real gap for minors' accounts.
  // Keyed on username+IP together so one guessed username can't be brute-forced from a single
  // IP, without letting someone lock a real student out just by spamming failed attempts from
  // elsewhere.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
  const rateLimit = await checkRateLimit('student-login', `${ip}:${username.toLowerCase()}`, { maxAttempts: 10, windowSeconds: 600 });
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait a few minutes and try again.' }, { status: 429 });
  }

  try {
    await ensureSchema();
    const rows = await sql`SELECT id, child_id, password_hash FROM student_accounts WHERE username = ${username}`;
    const account = rows[0];

    if (!account || !(await bcrypt.compare(password, account.password_hash as string))) {
      return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
    }

    const session = await getIronSession<StudentSessionData>(await cookies(), await getStudentSessionOptions());
    session.studentAccountId = account.id as number;
    session.childId = account.child_id as number;
    await session.save();

    await sql`UPDATE student_accounts SET last_login_at = now() WHERE id = ${account.id}`;

    // "Remember this device" is automatic, not opt-in — every successful login trusts the
    // device so the next visit can skip re-entering username/password entirely.
    const deviceToken = await createDeviceToken('student', account.id as number, req.headers);
    const res = NextResponse.json({ ok: true });
    res.cookies.set(STUDENT_DEVICE_COOKIE_NAME, deviceToken, deviceCookieOptions());
    return res;
  } catch (err) {
    console.error('[api/student/login] failed', err);
    return NextResponse.json({ error: 'Could not log in right now. Please try again shortly.' }, { status: 500 });
  }
}
