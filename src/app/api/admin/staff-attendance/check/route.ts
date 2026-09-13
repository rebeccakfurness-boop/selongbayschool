import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { staffAttendanceCheckSchema, firstIssueMessage } from '@/lib/validation';
import { recordStaffAttendanceEvent } from '@/lib/staff-attendance';

/** Self check-in/out for the logged-in staff member -- no signature (their session already
 * proves who this is, unlike the parent-portal/kiosk flow for students), and always "right now":
 * occurredAt is never accepted from the client, only the insert's own now() default. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = staffAttendanceCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid check-in.') }, { status: 400 });
  }

  try {
    await ensureSchema();
    const event = await recordStaffAttendanceEvent({
      adminUserId: staff.adminUserId,
      eventType: parsed.data.eventType,
      source: 'self',
    });
    return NextResponse.json({ ok: true, occurredAt: event.occurred_at, eventType: event.event_type });
  } catch (err) {
    console.error('[api/admin/staff-attendance/check] failed', err);
    return NextResponse.json({ error: 'Could not record check-in/out.' }, { status: 500 });
  }
}
