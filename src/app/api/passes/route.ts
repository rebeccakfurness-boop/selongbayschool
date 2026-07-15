import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { passPurchaseSchema } from '@/lib/validation';
import { sendPassAutoReply, sendPassNotification } from '@/lib/email';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { activityPass } from '@/lib/site-content';

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId || !session.email) {
    return NextResponse.json({ error: 'Please log in to buy an activity pack.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = passPurchaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
      { status: 400 }
    );
  }
  const { childName, paymentMethod } = parsed.data;
  const status = paymentMethod === 'pay_online' ? 'pending_payment' : 'pay_at_session';

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO passes (customer_id, child_name, total_sessions, price_paid_idr, payment_method, status)
      VALUES (${session.customerId}, ${childName}, ${activityPass.totalSessions}, ${activityPass.priceIDR}, ${paymentMethod}, ${status})
      RETURNING id, expires_at
    `;
    const pass = rows[0];

    const customerRows = await sql`SELECT name, email FROM customers WHERE id = ${session.customerId}`;
    const customer = customerRows[0];
    const expiresAtLabel = new Date(pass.expires_at as string).toLocaleDateString('en-AU', {
      year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Makassar',
    });

    const emailInput = {
      childName,
      customerName: (customer?.name as string) || 'there',
      customerEmail: (customer?.email as string) || session.email,
      totalSessions: activityPass.totalSessions,
      priceIDR: activityPass.priceIDR,
      expiresAt: expiresAtLabel,
      paymentMethod,
    };

    await sendPassNotification(emailInput);
    await sendPassAutoReply(emailInput);

    return NextResponse.json({ ok: true, passId: pass.id });
  } catch (err) {
    console.error('[api/passes] failed to create pass', err);
    return NextResponse.json({ error: 'Could not complete your purchase right now. Please try again shortly.' }, { status: 500 });
  }
}
