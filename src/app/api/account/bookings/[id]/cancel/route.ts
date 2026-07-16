import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';
import { sendCustomerCancellationConfirmation, sendCustomerCancellationNotification } from '@/lib/email';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  pay_at_session: 'Pay at session',
  paid: 'Paid',
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const bookingId = Number(idParam);
  if (!Number.isInteger(bookingId)) {
    return NextResponse.json({ error: 'Invalid booking id.' }, { status: 400 });
  }

  const session = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  if (!session.customerId) {
    return NextResponse.json({ error: 'Please log in to cancel a booking.' }, { status: 401 });
  }

  try {
    await ensureSchema();

    // customer_id is checked below against the caller's own session, never trusted from the
    // client, so nobody can cancel a booking that isn't theirs even by guessing another id.
    const rows = await sql`
      SELECT b.id, b.slot_id, b.customer_id, b.activity_name, b.child_name, b.parent_name,
             b.parent_email, b.parent_phone, b.payment_method, b.status, b.pass_id,
             s.session_date::text AS slot_date, s.session_time AS slot_time
      FROM bookings b
      JOIN sessions s ON s.id = b.slot_id
      WHERE b.id = ${bookingId}
    `;
    const booking = rows[0];
    if (!booking || booking.customer_id !== session.customerId) {
      return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
    }
    if (booking.status === 'cancelled') {
      return NextResponse.json({ error: 'This booking is already cancelled.' }, { status: 409 });
    }
    const today = new Date().toISOString().slice(0, 10);
    if ((booking.slot_date as string) < today) {
      return NextResponse.json({ error: 'Past bookings cannot be cancelled.' }, { status: 400 });
    }

    const statusBeforeCancel = booking.status as string;

    // Guards against a double-click re-processing the same cancellation (freeing an extra
    // spot, or double-crediting a pack session) — a second call finds 0 rows here and stops.
    const updated = await sql`
      UPDATE bookings SET status = 'cancelled' WHERE id = ${bookingId} AND status != 'cancelled' RETURNING id
    `;
    if (updated.length === 0) {
      return NextResponse.json({ error: 'This booking is already cancelled.' }, { status: 409 });
    }

    await sql`UPDATE sessions SET spots_remaining = spots_remaining + 1 WHERE id = ${booking.slot_id}`;

    // A booking paid for with a pack session gets that session credited back, since the
    // customer is cancelling well ahead of the session rather than a no-show.
    if (booking.payment_method === 'pack_session' && booking.pass_id) {
      await sql`UPDATE passes SET sessions_used = GREATEST(sessions_used - 1, 0) WHERE id = ${booking.pass_id}`;
    }

    const dateLabel = new Date(`${booking.slot_date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const mayHavePaid = booking.payment_method === 'pay_online';

    const confirmationSent = await sendCustomerCancellationConfirmation({
      activityName: booking.activity_name,
      date: dateLabel,
      time: booking.slot_time,
      childName: booking.child_name,
      parentName: booking.parent_name,
      parentEmail: booking.parent_email,
      mayHavePaid,
    });

    const notificationSent = await sendCustomerCancellationNotification({
      activityName: booking.activity_name,
      date: dateLabel,
      time: booking.slot_time,
      childName: booking.child_name,
      parentName: booking.parent_name,
      parentEmail: booking.parent_email,
      parentPhone: booking.parent_phone,
      paymentStatusLabel: STATUS_LABELS[statusBeforeCancel] ?? statusBeforeCancel,
    });

    return NextResponse.json({
      ok: true,
      emailWarning:
        !confirmationSent || !notificationSent
          ? 'Booking cancelled, but one of our confirmation emails could not be sent.'
          : undefined,
    });
  } catch (err) {
    console.error('[api/account/bookings/:id/cancel] failed', err);
    return NextResponse.json({ error: 'Could not cancel this booking right now. Please try again shortly.' }, { status: 500 });
  }
}
