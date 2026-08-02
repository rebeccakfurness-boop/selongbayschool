import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { kioskAdminCheckSchema } from '@/lib/validation';
import { recordAttendanceEvent } from '@/lib/attendance';

/** The kiosk's admin-override check-in/out — available right on the gate roster (not just the
 * Child Card) now that /kiosk requires a staff login. No signature: this is the deliberate
 * override for when staff are checking a child in/out themselves, not the parent. Always
 * attributed to whichever staff member is signed into the kiosk right now. */
export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = kioskAdminCheckSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid check-in.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const [child] = (await sql`SELECT child_full_name FROM children WHERE id = ${d.childId} AND is_active = true`) as unknown as {
      child_full_name: string;
    }[];
    if (!child) {
      return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    }

    const event = await recordAttendanceEvent({
      childId: d.childId,
      eventType: d.eventType,
      sessionType: d.sessionType,
      activityId: d.activityId ?? null,
      source: 'admin',
      performedByAdminId: staff.adminUserId,
    });

    return NextResponse.json({
      ok: true,
      id: event.id,
      childFullName: child.child_full_name,
      occurredAt: event.occurred_at,
      eventType: event.event_type,
    });
  } catch (err) {
    console.error('[api/kiosk/admin-check] failed', err);
    return NextResponse.json({ error: 'Could not record check-in/out.' }, { status: 500 });
  }
}
