import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { adminChangePasswordSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
  if (!session.adminUserId) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = adminChangePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please fill in all fields.' },
      { status: 400 }
    );
  }
  const { currentPassword, newPassword } = parsed.data;

  try {
    const rows = await sql`SELECT password_hash FROM admin_users WHERE id = ${session.adminUserId}`;
    const user = rows[0];
    if (!user || !(await bcrypt.compare(currentPassword, user.password_hash as string))) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE admin_users SET password_hash = ${newHash} WHERE id = ${session.adminUserId}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/settings/change-password] failed', err);
    return NextResponse.json({ error: 'Could not update your password right now. Please try again shortly.' }, { status: 500 });
  }
}
