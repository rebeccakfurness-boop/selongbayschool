import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { scheduleMeetingSchema } from '@/lib/validation';
import { findOrCreateFamilyForContact } from '@/lib/family-matching';
import { createMeetingInvite } from '@/lib/meeting-scheduling';
import { isCalendarConnected } from '@/lib/google-calendar';
import { sendMeetingScheduleEmail } from '@/lib/email';
import { siteConfig } from '@/lib/site-content';

interface EnquiryContactRow {
  name: string;
  email: string;
  phone: string | null;
  child_name: string | null;
}

/** Manual "Send schedule meeting" on the Enquiries list — same meeting_invites/Google Calendar
 * flow as the Letter of Offer's "Schedule a meeting" button, just resolving the child from the
 * enquiry's own contact details instead of an existing letter. findOrCreateFamilyForContact is
 * idempotent (matches by email/phone first), so this is safe to click even for an enquiry that
 * already auto-linked to a card at submission time (see submitEnquiry in src/lib/enquiries.ts) —
 * it reuses that same card rather than creating a duplicate. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid enquiry id.' }, { status: 400 });
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

    const rows = (await sql`
      SELECT name, email, phone, child_name FROM enquiries WHERE id = ${id}
    `) as unknown as EnquiryContactRow[];
    const enquiry = rows[0];
    if (!enquiry) {
      return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    }

    const childId = await findOrCreateFamilyForContact({
      parentName: enquiry.name,
      parentEmail: enquiry.email,
      parentPhone: enquiry.phone,
      childName: enquiry.child_name,
    });

    const { token } = await createMeetingInvite({
      childId,
      letterOfOfferId: null,
      parentEmail: parsed.data.email,
    });

    const scheduleUrl = new URL(`/schedule-meeting/${token}`, siteConfig.url).toString();
    const sent = await sendMeetingScheduleEmail({
      toEmail: parsed.data.email,
      childFullName: enquiry.child_name || enquiry.name,
      scheduleUrl,
    });
    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/enquiries/:id/schedule-meeting] failed', err);
    return NextResponse.json(
      { error: `Could not send meeting invite: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
