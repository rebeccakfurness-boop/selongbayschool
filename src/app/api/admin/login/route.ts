import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { adminLoginSchema } from '@/lib/validation';

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
    const rows = await sql`SELECT id, email, password_hash FROM admin_users WHERE email = ${email}`;
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash as string))) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
    session.adminUserId = user.id as number;
    session.email = user.email as string;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/login] failed', err);
    return NextResponse.json({ error: 'Could not log in right now. Please try again shortly.' }, { status: 500 });
  }
}
