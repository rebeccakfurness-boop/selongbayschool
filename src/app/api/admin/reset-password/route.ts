import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { ensureSchema, sql } from '@/lib/db';
import { getSessionOptions, type AdminSessionData } from '@/lib/auth';
import { adminResetPasswordSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = adminResetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT id, email FROM admin_users
      WHERE reset_token = ${token} AND reset_token_expires_at > now()
    `;
    const user = rows[0];
    if (!user) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await sql`
      UPDATE admin_users
      SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires_at = NULL
      WHERE id = ${user.id}
    `;

    // Log the admin straight in after a successful reset.
    const session = await getIronSession<AdminSessionData>(await cookies(), await getSessionOptions());
    session.adminUserId = user.id as number;
    session.email = user.email as string;
    await session.save();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/reset-password] failed', err);
    return NextResponse.json({ error: 'Could not reset your password right now. Please try again shortly.' }, { status: 500 });
  }
}
