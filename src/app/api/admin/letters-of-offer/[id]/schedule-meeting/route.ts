import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { scheduleMeetingSchema } from '@/lib/validation';
import { getLetterOfOfferById } from '@/lib/letters-of-offer';
import { createMeetingInvite } from '@/lib/meeting-scheduling';
import { isCalendarConnected } from '@/lib/google-calendar';
import { sendMeetingScheduleEmail } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid letter of offer id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = scheduleMeetingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email.' }, { status: 400 });
  }

  try {
    await ensureSchema();

    if (!(await isCalendarConnected())) {
      return NextResponse.json(
        { error: 'Google Calendar is not connected yet — connect it at Meeting Calendar in the sidebar first.' },
        { status: 409 }
      );
    }

    const letter = await getLetterOfOfferById(id);
    if (!letter) {
      return NextResponse.json({ error: 'Letter of offer not found.' }, { status: 404 });
    }

    const { token } = await createMeetingInvite({
      childId: letter.child_id,
      letterOfOfferId: letter.id,
      parentEmail: parsed.data.email,
    });

    const scheduleUrl = new URL(`/schedule-meeting/${token}`, siteConfig.url).toString();
    const sent = await sendMeetingScheduleEmail({
      toEmail: parsed.data.email,
      childFullName: letter.child_full_name,
      scheduleUrl,
    });
    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/letters-of-offer/:id/schedule-meeting] failed', err);
    return NextResponse.json(
      { error: `Could not send meeting invite: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
