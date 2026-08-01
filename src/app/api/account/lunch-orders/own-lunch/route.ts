import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { guardianOwnsChild } from '@/lib/lms-data';
import { bringOwnLunchSchema } from '@/lib/validation';
import { createOwnLunchRecord } from '@/lib/lunch-orders';

/** No PDF/invoice involved — App Router is fine here, unlike the priced-order route which needs
 * the Pages Router for PDF rendering (see src/pages/api/account/lunch-orders/create.ts). Not
 * covered by src/proxy.ts (matcher only lists /api/admin/:path* and /account/:path*, not
 * /api/account/:path*), so the session is checked directly. */
export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to update lunch preferences.' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = bringOwnLunchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, parsed.data.childId))) {
      return NextResponse.json({ error: 'Not authorized for this child.' }, { status: 403 });
    }
    await createOwnLunchRecord(parsed.data.childId, session.customerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/lunch-orders/own-lunch] failed', err);
    return NextResponse.json({ error: 'Could not save your preference.' }, { status: 500 });
  }
}
