import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { cancelLibraryReservationByCustomer } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in first.' }, { status: 401 });
  }

  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId)) {
    return NextResponse.json({ error: 'Invalid reservation id.' }, { status: 400 });
  }

  try {
    await cancelLibraryReservationByCustomer(reservationId, session.customerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/account/library/reservations/:id/cancel] failed', err);
    return NextResponse.json({ error: 'Could not cancel this reservation.' }, { status: 500 });
  }
}
