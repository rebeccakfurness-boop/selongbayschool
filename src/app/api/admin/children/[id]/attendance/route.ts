import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';
import { adminAttendanceCorrectionSchema } from '@/lib/validation';
import { getAttendanceHistoryForChild, findOpenDailyAttendanceDays, recordAttendanceEvent } from '@/lib/attendance';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await getCurrentStaff();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const history = await getAttendanceHistoryForChild(childId);
    const openDays = findOpenDailyAttendanceDays(history);
    return NextResponse.json({ ok: true, history, openDays });
  } catch (err) {
    console.error('[api/admin/children/:id/attendance] failed to load', err);
    return NextResponse.json({ error: 'Could not load attendance.' }, { status: 500 });
  }
}

/** Manual correction — e.g. a parent forgot to check a child out at pickup and calls the office.
 * Always source='admin' with the acting staff member recorded, and always lets occurred_at be
 * backdated (recordAttendanceEvent only accepts that for this one caller). */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const childId = Number(idParam);
  if (!Number.isInteger(childId)) {
    return NextResponse.json({ error: 'Invalid child id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = adminAttendanceCorrectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid correction.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const event = await recordAttendanceEvent({
      childId,
      eventType: d.eventType,
      sessionType: d.sessionType,
      activityId: d.activityId ?? null,
      source: 'admin',
      performedByAdminId: staff.adminUserId,
      occurredAt: d.occurredAt,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[api/admin/children/:id/attendance] failed to add correction', err);
    return NextResponse.json({ error: 'Could not save the correction.' }, { status: 500 });
  }
}
