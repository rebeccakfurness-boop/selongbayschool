import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { updateBookingStatusSchema } from '@/lib/validation';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const bookingId = Number(id);
  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: 'Invalid booking id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = updateBookingStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid status.' }, { status: 400 });
  }

  try {
    const rows = await sql`
      UPDATE bookings SET status = ${parsed.data.status}
      WHERE id = ${bookingId} AND status = 'pending_payment'
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found or not awaiting payment.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/bookings/[id]] failed', err);
    return NextResponse.json({ error: 'Could not update booking.' }, { status: 500 });
  }
}
