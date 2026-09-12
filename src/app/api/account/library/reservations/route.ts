import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { ensureSchema } from '@/lib/db';
import { guardianOwnsChild } from '@/lib/lms-data';
import { createLibraryReservation, ReservationError } from '@/lib/library';

export async function POST(req: NextRequest) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const d = body as { itemId?: number; childId?: number };
  const itemId = Number(d.itemId);
  const childId = Number(d.childId);
  if (!Number.isInteger(itemId) || !Number.isInteger(childId)) {
    return NextResponse.json({ error: 'An item and a child are required.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    if (!(await guardianOwnsChild(session.customerId, childId))) {
      return NextResponse.json({ error: 'That child is not linked to your account.' }, { status: 403 });
    }

    const reservation = await createLibraryReservation({ itemId, childId, customerId: session.customerId });
    return NextResponse.json({ ok: true, reservation });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[api/account/library/reservations] failed', err);
    return NextResponse.json({ error: 'Could not reserve this item right now.' }, { status: 500 });
  }
}
