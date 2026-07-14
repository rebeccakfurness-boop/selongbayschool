import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { bookingSchema } from '@/lib/validation';
import { sendBookingAutoReply, sendBookingNotification } from '@/lib/email';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Please check the form and try again.' },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    await ensureSchema();

    // Single atomic statement: only inserts the booking if the slot still has
    // capacity, preventing a double-booking race between concurrent requests.
    const rows = await sql`
      WITH slot_update AS (
        UPDATE sessions
        SET spots_remaining = spots_remaining - 1
        WHERE id = ${input.slotId} AND spots_remaining > 0
        RETURNING id, activity_id, session_date, session_time
      ),
      slot_with_activity AS (
        SELECT su.id, a.slug AS activity_slug, a.name AS activity_name
        FROM slot_update su
        JOIN activities a ON a.id = su.activity_id
      )
      INSERT INTO bookings (
        slot_id, activity_slug, activity_name, child_name, child_age,
        parent_name, parent_email, parent_phone, emergency_contact
      )
      SELECT id, activity_slug, activity_name, ${input.childName}, ${input.childAge},
        ${input.parentName}, ${input.parentEmail}, ${input.parentPhone}, ${input.emergencyContact}
      FROM slot_with_activity
      RETURNING id, activity_slug, activity_name, slot_id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Sorry, that slot just filled up. Please pick another date or time.' },
        { status: 409 }
      );
    }

    const booking = rows[0];
    const slotRows = await sql`SELECT session_date::text AS slot_date, session_time AS slot_time FROM sessions WHERE id = ${input.slotId}`;
    const slot = slotRows[0];
    const dateLabel = slot ? new Date(`${slot.slot_date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    }) : '';

    const emailInput = {
      activityName: booking.activity_name as string,
      date: dateLabel,
      time: slot?.slot_time ?? '',
      childName: input.childName,
      childAge: input.childAge,
      parentName: input.parentName,
      parentEmail: input.parentEmail,
      parentPhone: input.parentPhone,
      emergencyContact: input.emergencyContact,
    };

    const notifySent = await sendBookingNotification(emailInput);
    const replySent = await sendBookingAutoReply(emailInput);

    await sql`
      UPDATE bookings
      SET notify_email_status = ${notifySent ? 'sent' : 'failed'},
          reply_email_status = ${replySent ? 'sent' : 'failed'}
      WHERE id = ${booking.id}
    `;

    if (!notifySent) {
      console.error('[api/bookings] booking notification email failed to send', { bookingId: booking.id });
    }

    return NextResponse.json({
      ok: true,
      bookingId: booking.id,
      emailWarning: !notifySent ? 'Booking saved, but our confirmation email could not be sent. We still have your booking on file.' : undefined,
    });
  } catch (err) {
    console.error('[api/bookings] failed to create booking', err);
    return NextResponse.json({ error: 'Could not complete your booking right now. Please try again shortly.' }, { status: 500 });
  }
}
