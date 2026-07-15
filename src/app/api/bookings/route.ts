import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { ensureSchema, sql } from '@/lib/db';
import { bookingSchema } from '@/lib/validation';
import { sendBookingAutoReply, sendBookingNotification } from '@/lib/email';
import { getCustomerSessionOptions, type CustomerSessionData } from '@/lib/auth';

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
  const usingPack = input.paymentMethod === 'pack_session';
  const status = usingPack ? 'paid' : input.paymentMethod === 'pay_online' ? 'pending_payment' : 'pay_at_session';

  // Never trust a client-supplied customer id: whoever's booking is determined solely by
  // their own session cookie, so nobody can attach a booking to someone else's account.
  const customerSession = await getIronSession<CustomerSessionData>(await cookies(), await getCustomerSessionOptions());
  const customerId = customerSession.customerId ?? null;
  const isGuest = !customerId;

  if (usingPack && !customerId) {
    return NextResponse.json({ error: 'Please log in to use a session from your pack.' }, { status: 401 });
  }

  try {
    await ensureSchema();

    // Single atomic statement: only inserts the booking if the slot still has capacity
    // (and, when using a pack, only if the pass is still valid and re-checked server-side,
    // never trusting the client's earlier "you have an active pack" check), preventing both
    // a double-booking race and a double-spend of the same pack session.
    const rows = usingPack
      ? await sql`
          WITH slot_update AS (
            UPDATE sessions
            SET spots_remaining = spots_remaining - 1
            WHERE id = ${input.slotId} AND spots_remaining > 0 AND status = 'active'
            RETURNING id, activity_id
          ),
          slot_with_activity AS (
            SELECT su.id, a.slug AS activity_slug, a.name AS activity_name
            FROM slot_update su
            JOIN activities a ON a.id = su.activity_id
          ),
          pass_update AS (
            UPDATE passes
            SET sessions_used = sessions_used + 1
            WHERE id = ${input.passId} AND customer_id = ${customerId} AND status = 'paid'
              AND expires_at > now() AND sessions_used < total_sessions
            RETURNING id
          )
          INSERT INTO bookings (
            slot_id, activity_slug, activity_name, child_name, child_age,
            parent_name, parent_email, parent_phone, emergency_contact, payment_method, status,
            customer_id, is_guest, pass_id
          )
          SELECT swa.id, swa.activity_slug, swa.activity_name, ${input.childName}, ${input.childAge},
            ${input.parentName}, ${input.parentEmail}, ${input.parentPhone}, ${input.emergencyContact},
            'pack_session', ${status}, ${customerId}, ${isGuest}, pu.id
          FROM slot_with_activity swa, pass_update pu
          RETURNING id, activity_slug, activity_name, slot_id
        `
      : await sql`
          WITH slot_update AS (
            UPDATE sessions
            SET spots_remaining = spots_remaining - 1
            WHERE id = ${input.slotId} AND spots_remaining > 0 AND status = 'active'
            RETURNING id, activity_id
          ),
          slot_with_activity AS (
            SELECT su.id, a.slug AS activity_slug, a.name AS activity_name
            FROM slot_update su
            JOIN activities a ON a.id = su.activity_id
          )
          INSERT INTO bookings (
            slot_id, activity_slug, activity_name, child_name, child_age,
            parent_name, parent_email, parent_phone, emergency_contact, payment_method, status,
            customer_id, is_guest
          )
          SELECT id, activity_slug, activity_name, ${input.childName}, ${input.childAge},
            ${input.parentName}, ${input.parentEmail}, ${input.parentPhone}, ${input.emergencyContact},
            ${input.paymentMethod}, ${status}, ${customerId}, ${isGuest}
          FROM slot_with_activity
          RETURNING id, activity_slug, activity_name, slot_id
        `;

    if (rows.length === 0) {
      if (usingPack) {
        // Distinguish which of the two conditions failed, purely for a clearer error message.
        const passRows = await sql`
          SELECT 1 FROM passes WHERE id = ${input.passId} AND customer_id = ${customerId} AND status = 'paid'
            AND expires_at > now() AND sessions_used < total_sessions
        `;
        if (passRows.length === 0) {
          return NextResponse.json(
            { error: 'That activity pack no longer has sessions available. Please choose another payment option.' },
            { status: 409 }
          );
        }
      }
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

    let priceIDR: number | null = null;
    let priceNote: string | null = null;
    if (usingPack) {
      priceNote = 'Included in your activity pack';
    } else {
      const activityRows = await sql`SELECT price_idr, price_note FROM activities WHERE slug = ${booking.activity_slug}`;
      const activity = activityRows[0];
      priceIDR = (activity?.price_idr as number | undefined) ?? null;
      priceNote = (activity?.price_note as string | undefined) ?? null;
    }

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
      paymentMethod: input.paymentMethod,
      priceIDR,
      priceNote,
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
