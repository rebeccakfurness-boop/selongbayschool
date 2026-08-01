import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { bookMeetingSlotSchema } from '@/lib/validation';
import { getMeetingInviteByToken, markMeetingBooked, computeAvailableSlots, MEETING_DURATION_MINUTES } from '@/lib/meeting-scheduling';
import { getFreeBusy, createMeetingEvent } from '@/lib/google-calendar';
import { sendMeetingBookedConfirmation, sendMeetingBookedNotification } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = bookMeetingSlotSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid booking.' }, { status: 400 });
  }
  const { startIso, format, bookedByName } = parsed.data;

  try {
    await ensureSchema();

    const invite = await getMeetingInviteByToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'This scheduling link is not valid.' }, { status: 404 });
    }
    if (invite.status === 'booked') {
      return NextResponse.json({ error: 'A time has already been booked for this meeting.' }, { status: 409 });
    }
    if (invite.status === 'cancelled') {
      return NextResponse.json({ error: 'This scheduling link is no longer active.' }, { status: 409 });
    }

    // Re-check the slot is still genuinely open — the page's slot list can be a few minutes stale
    // (another family booking the same window, or a new event landing on the calendar directly).
    const requestedStart = new Date(startIso);
    const timeMin = new Date();
    const timeMax = new Date(requestedStart.getTime() + 24 * 3600 * 1000);
    const busy = await getFreeBusy(timeMin.toISOString(), timeMax.toISOString());
    const stillAvailable = computeAvailableSlots(busy, timeMin).some((slot) => slot.startIso === startIso);
    if (!stillAvailable) {
      return NextResponse.json({ error: 'That time was just taken — please go back and choose another.' }, { status: 409 });
    }
    const meetingEnd = new Date(requestedStart.getTime() + MEETING_DURATION_MINUTES * 60 * 1000).toISOString();

    const event = await createMeetingEvent({
      summary: `Meeting: ${invite.child_full_name} (Selong Bay School)`,
      description: `Meeting about ${invite.child_full_name}'s enrolment, booked online by ${bookedByName} (${invite.parent_email}).`,
      startIso,
      endIso: meetingEnd,
      attendeeEmails: [invite.parent_email],
      format,
      location: format === 'in_person' ? siteConfig.contact.address : null,
    });

    await markMeetingBooked(invite.id, {
      startIso,
      endIso: meetingEnd,
      format,
      bookedByName,
      googleEventId: event.eventId,
      meetLink: event.meetLink,
    });

    await sendMeetingBookedConfirmation({
      toEmail: invite.parent_email,
      childFullName: invite.child_full_name,
      startIso,
      format,
      location: siteConfig.contact.address,
      meetLink: event.meetLink,
    });
    await sendMeetingBookedNotification({
      childFullName: invite.child_full_name,
      bookedByName,
      startIso,
      format,
    });

    return NextResponse.json({ ok: true, meetLink: event.meetLink });
  } catch (err) {
    console.error('[api/schedule-meeting/:token/book] failed', err);
    return NextResponse.json(
      { error: `Could not book that time: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
