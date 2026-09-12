import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { joinLibraryMembership } from '@/lib/library';

export async function POST() {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to join the library.' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const membership = await joinLibraryMembership(session.customerId);
    return NextResponse.json({ ok: true, membership });
  } catch (err) {
    console.error('[api/account/library/join] failed', err);
    return NextResponse.json({ error: 'Could not join the library right now.' }, { status: 500 });
  }
}
