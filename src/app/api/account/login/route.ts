import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ensureSchema, sql } from '@/lib/db';
import { customerLoginSchema } from '@/lib/validation';
import { sendCustomerMagicLinkEmail } from '@/lib/email';
import { sanitizeNextPath, MAGIC_LINK_TOKEN_TTL_MS } from '@/lib/auth';
import { siteConfig } from '@/lib/site-content';
import { checkRateLimit } from '@/lib/device-trust';

const GENERIC_MESSAGE = "If that email has an account, we've sent a login link.";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Enter a valid email address.' },
      { status: 400 }
    );
  }
  const { email } = parsed.data;
  const next = sanitizeNextPath((body as { next?: unknown }).next, '/account');

  try {
    await ensureSchema();

    // This route had no throttling at all until now — nothing stopped either an email-bombing
    // nuisance (repeatedly requesting a link for someone else's address) or a script hammering
    // it to probe which addresses have accounts. Keyed on IP+email together, and rate-limited
    // requests still return the same generic message below rather than a distinct error, so
    // this can't be used to enumerate accounts either.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown';
    const rateLimit = await checkRateLimit('customer-magic-link', `${ip}:${email.toLowerCase()}`, { maxAttempts: 5, windowSeconds: 600 });

    const rows = rateLimit.allowed ? await sql`SELECT id, name FROM customers WHERE email = ${email}` : [];
    const customer = rows[0];

    if (customer) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + MAGIC_LINK_TOKEN_TTL_MS);
      await sql`
        UPDATE customers SET magic_link_token = ${token}, magic_link_token_expires_at = ${expiresAt.toISOString()}
        WHERE id = ${customer.id}
      `;
      const verifyUrl = new URL('/api/account/verify', siteConfig.url);
      verifyUrl.searchParams.set('token', token);
      verifyUrl.searchParams.set('next', next);
      await sendCustomerMagicLinkEmail(email, (customer.name as string) || 'there', verifyUrl.toString());
    }

    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('[api/account/login] failed', err);
    return NextResponse.json({ error: 'Could not send your login link right now. Please try again shortly.' }, { status: 500 });
  }
}
