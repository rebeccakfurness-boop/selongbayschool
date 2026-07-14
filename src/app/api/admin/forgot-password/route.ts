import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ensureSchema, sql } from '@/lib/db';
import { sendAdminPasswordResetEmail } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';
import { adminForgotPasswordSchema } from '@/lib/validation';
import { RESET_TOKEN_TTL_MS } from '@/lib/auth';

const GENERIC_MESSAGE = "If that email has an admin account, we've sent a password reset link.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = adminForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please enter a valid email address.' },
      { status: 400 }
    );
  }
  const { email } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`SELECT id FROM admin_users WHERE email = ${email}`;
    const user = rows[0];

    // Always respond identically whether or not the email matches an admin
    // account, so this endpoint can't be used to enumerate admin emails.
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await sql`
        UPDATE admin_users
        SET reset_token = ${token}, reset_token_expires_at = ${expiresAt.toISOString()}
        WHERE id = ${user.id}
      `;

      const resetUrl = `${siteConfig.url}/admin/reset-password?token=${token}`;
      const sent = await sendAdminPasswordResetEmail(email, resetUrl);
      if (!sent) {
        console.error('[api/admin/forgot-password] failed to send reset email', { email });
      }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[api/admin/forgot-password] failed', err);
    return NextResponse.json({ error: 'Could not process that request right now. Please try again shortly.' }, { status: 500 });
  }
}
