import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { linkEnrolmentToFamily } from '@/lib/enrolments';

/** Manual retry of the automatic Family Board linking submitEnrolment attempts -- for a
 * submission whose original attempt failed (logged server-side only, previously with no way to
 * notice or fix it from the admin UI). See linkEnrolmentToFamily's own comment: safe to call even
 * if it already succeeded, since it matches an existing card by email/phone before creating one. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const enrolmentId = Number(id);
  if (!Number.isInteger(enrolmentId)) {
    return NextResponse.json({ error: 'Invalid enrolment id.' }, { status: 400 });
  }

  try {
    const childId = await linkEnrolmentToFamily(enrolmentId);
    return NextResponse.json({ ok: true, childId });
  } catch (err) {
    console.error('[api/admin/enrolments/:id/link-family] failed', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Could not link this enrolment to a family.' }, { status: 500 });
  }
}
