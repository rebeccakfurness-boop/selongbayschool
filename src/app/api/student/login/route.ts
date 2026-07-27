import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getStudentSessionOptions, type StudentSessionData } from '@/lib/auth';
import { studentLoginSchema } from '@/lib/validation';

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/student/login] failed', err);
    return NextResponse.json({ error: 'Could not log in right now. Please try again shortly.' }, { status: 500 });
  }
}
