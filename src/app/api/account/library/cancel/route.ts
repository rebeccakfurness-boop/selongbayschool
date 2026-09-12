import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { cancelLibraryMembership } from '@/lib/library';

export async function POST() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  }

  try {
    await cancelLibraryMembership(session.customerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/library/cancel] failed', err);
    return NextResponse.json({ error: 'Could not cancel your membership right now.' }, { status: 500 });
  }
}
