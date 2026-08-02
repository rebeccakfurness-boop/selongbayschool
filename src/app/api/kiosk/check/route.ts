import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { attendanceCheckSchema } from '@/lib/validation';
import { recordAttendanceEvent } from '@/lib/attendance';

/** Gated by proxy.ts's kiosk-unlock cookie check, not by who's standing at the tablet — kiosk
 * actions are intentionally anonymous (source='kiosk', no performed_by_*), matching the walk-up
 * nature of the gate. */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const parsed = attendanceCheckSchema.safeParse(body);
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
      source: 'kiosk',
    });

    return NextResponse.json({ ok: true, childFullName: child.child_full_name, occurredAt: event.occurred_at, eventType: event.event_type });
  } catch (err) {
    console.error('[api/kiosk/check] failed', err);
    return NextResponse.json({ error: 'Could not record check-in/out.' }, { status: 500 });
  }
}
