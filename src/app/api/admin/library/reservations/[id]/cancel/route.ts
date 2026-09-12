import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { cancelLibraryReservationAdmin } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const reservationId = Number(id);
  if (!Number.isInteger(reservationId)) {
    return NextResponse.json({ error: 'Invalid reservation id.' }, { status: 400 });
  }

  try {
    await cancelLibraryReservationAdmin(reservationId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/reservations/:id/cancel] failed', err);
    return NextResponse.json({ error: 'Could not cancel this reservation.' }, { status: 500 });
  }
}
