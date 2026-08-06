import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { createChildSchema, firstIssueMessage } from '@/lib/validation';
import { convertAdmissionsEnquiry, type AdmissionsEnquiryRow } from '@/lib/child-lifecycle';

/** "Enquiry → Family record" from the lifecycle spec: turns one admissions_enquiries lead (the
 * admissions team's own tracker — see the Admissions Pipeline tab) into a real children row,
 * without retyping anything the admin already captured during the tour/interview stage. The
 * request body is the same shape as "+ New Family" (createChildSchema) because the client-side
 * form is genuinely the same form, just pre-filled from the lead — the admin can still edit
 * anything (e.g. fix a messy child_name) before submitting. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id: idParam } = await params;
  const enquiryId = Number(idParam);
  if (!Number.isInteger(enquiryId)) {
    return NextResponse.json({ error: 'Invalid enquiry id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = createChildSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid child.') }, { status: 400 });
  }

  try {
    await ensureSchema();

    const rows = (await sql`
      SELECT id, source, parent_name, child_name, child_age, contact_phone, contact_email,
        plan_to_stay, first_message_date::text, visit_date::text, booking_date::text, booking_time,
        follow_up_notes, converted_child_id
      FROM admissions_enquiries WHERE id = ${enquiryId}
    `) as unknown as AdmissionsEnquiryRow[];
    const enquiry = rows[0];
    if (!enquiry) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }
    if (enquiry.converted_child_id) {
      return NextResponse.json({ error: 'This lead has already been converted to a family record.' }, { status: 409 });
    }

    const childId = await convertAdmissionsEnquiry(enquiry, parsed.data);
    return NextResponse.json({ id: childId });
  } catch (err) {
    console.error('[api/admin/admissions-enquiries/:id/convert] failed to convert', err);
    return NextResponse.json({ error: 'Could not convert this lead.' }, { status: 500 });
  }
}
