import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { updateAdultsInHouseholdSchema } from '@/lib/validation';
import { updateAdultsInHousehold } from '@/lib/family-discount';
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

  const parsed = updateAdultsInHouseholdSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Please check the number and try again.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await updateAdultsInHousehold(session.customerId, parsed.data.adultsInHousehold);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/discount-card/adults] failed to update', err);
    return NextResponse.json({ error: 'Could not save that right now. Please try again shortly.' }, { status: 500 });
  }
}
