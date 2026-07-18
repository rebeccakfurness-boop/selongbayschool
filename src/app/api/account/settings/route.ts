import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { emergencyContactSchema } from '@/lib/validation';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to update your account.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = emergencyContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    await ensureSchema();
    await sql`
      UPDATE customers
      SET emergency_contact_name = ${input.emergencyContactName}, emergency_contact_phone = ${input.emergencyContactPhone}
      WHERE id = ${session.customerId}
    `;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/settings] failed to update emergency contact', err);
    return NextResponse.json({ error: 'Could not save your changes right now. Please try again shortly.' }, { status: 500 });
  }
}
