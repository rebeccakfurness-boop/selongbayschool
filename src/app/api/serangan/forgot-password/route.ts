import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ensureSchema, sql } from '@/lib/db';
import { sendSeranganPasswordResetEmail } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';
import { seranganForgotPasswordSchema } from '@/lib/validation';
import { RESET_TOKEN_TTL_MS } from '@/lib/auth';

const GENERIC_MESSAGE = "If that email has a Serangan English School account, we've sent a password reset link.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = seranganForgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please enter a valid email address.' }, { status: 400 });
  }
  const { email } = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`SELECT id FROM serangan_admin_users WHERE email = ${email}`;
    const user = rows[0];

    // Always respond identically whether or not the email matches an account, so this endpoint
    // can't be used to enumerate accounts -- same as the admin forgot-password route.
    if (user) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await sql`
        UPDATE serangan_admin_users SET reset_token = ${token}, reset_token_expires_at = ${expiresAt.toISOString()} WHERE id = ${user.id}
      `;

      const resetUrl = `${siteConfig.url}/serangan/reset-password?token=${token}`;
      const sent = await sendSeranganPasswordResetEmail(email, resetUrl);
      if (!sent) {
        console.error('[api/serangan/forgot-password] failed to send reset email', { email });
      }
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[api/serangan/forgot-password] failed', err);
    return NextResponse.json({ error: 'Could not process that request right now. Please try again shortly.' }, { status: 500 });
  }
}
