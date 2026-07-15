import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { sendSessionCancellationEmail } from '@/lib/email';

interface BookingToNotify {
  activity_name: string;
  parent_name: string;
  parent_email: string;
  child_name: string;
  payment_method: string | null;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid session id.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    const sessionRows = await sql`
      SELECT s.id, a.name AS activity_name, s.session_date::text AS slot_date, s.session_time AS slot_time
      FROM sessions s
      JOIN activities a ON a.id = s.activity_id
      WHERE s.id = ${id}
    `;
    if (sessionRows.length === 0) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }
    const session = sessionRows[0];

    const bookings = (await sql`
      SELECT activity_name, parent_name, parent_email, child_name, payment_method
      FROM bookings
      WHERE slot_id = ${id} AND status != 'cancelled'
    `) as unknown as BookingToNotify[];

    await sql`UPDATE sessions SET status = 'cancelled' WHERE id = ${id}`;
    await sql`UPDATE bookings SET status = 'cancelled' WHERE slot_id = ${id}`;

    const dateLabel = new Date(`${session.slot_date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    let emailed = 0;
    for (const booking of bookings) {
      const sent = await sendSessionCancellationEmail({
        activityName: booking.activity_name,
        date: dateLabel,
        time: session.slot_time as string,
        parentName: booking.parent_name,
        parentEmail: booking.parent_email,
        childName: booking.child_name,
        mayHavePaid: booking.payment_method === 'pay_online',
      });
      if (sent) emailed += 1;
    }

    return NextResponse.json({ ok: true, notified: emailed, total: bookings.length });
  } catch (err) {
    console.error('[api/admin/availability/:id/cancel] failed to cancel session', err);
    return NextResponse.json({ error: 'Could not cancel session.' }, { status: 500 });
  }
}
