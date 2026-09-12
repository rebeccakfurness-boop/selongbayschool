import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { fulfillLibraryReservation, ReservationError } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId)) {
    return NextResponse.json({ error: 'Invalid reservation id.' }, { status: 400 });
  }

  try {
    const loanId = await fulfillLibraryReservation(reservationId, staff.adminUserId);
    return NextResponse.json({ ok: true, loanId });
  } catch (err) {
    if (err instanceof ReservationError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[api/admin/library/reservations/:id/fulfill] failed', err);
    return NextResponse.json({ error: 'Could not fulfill this reservation.' }, { status: 500 });
  }
}
