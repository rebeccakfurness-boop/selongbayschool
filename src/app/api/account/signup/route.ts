import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { customerSignupSchema } from '@/lib/validation';
import { sendCustomerMagicLinkEmail } from '@/lib/email';
import { sanitizeNextPath } from '@/lib/auth';
import { issueCustomerMagicLink } from '@/lib/customer-magic-link';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = customerSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
      { status: 400 }
    );
  }
  const { email, name, phone } = parsed.data;
  const next = sanitizeNextPath((body as { next?: unknown }).next, '/account');

  try {
    await ensureSchema();

    const existing = await sql`SELECT id FROM customers WHERE email = ${email}`;
    let customerId: number;

    if (existing.length > 0) {
      customerId = existing[0].id as number;
    } else {
      const inserted = await sql`
        INSERT INTO customers (email, name, phone) VALUES (${email}, ${name}, ${phone || null})
        RETURNING id
      `;
      customerId = inserted[0].id as number;

      // Step 5.5: link any guest bookings made with this email before they had an account.
      await sql`
        UPDATE bookings SET customer_id = ${customerId}, is_guest = false
        WHERE parent_email = ${email} AND customer_id IS NULL
      `;
    }

    const { verifyUrl, code } = await issueCustomerMagicLink(customerId, next);
    await sendCustomerMagicLinkEmail(email, name, verifyUrl, code);

    return NextResponse.json({ ok: true, message: "We've emailed you a link to access your account." });
  } catch (err) {
    console.error('[api/account/signup] failed', err);
    return NextResponse.json({ error: 'Could not create your account right now. Please try again shortly.' }, { status: 500 });
  }
}
