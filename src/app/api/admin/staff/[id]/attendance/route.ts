import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, requireAdmin } from '@/lib/current-staff';
import { staffAttendanceCorrectionSchema, firstIssueMessage } from '@/lib/validation';
import { getAttendanceHistoryForStaff, findOpenStaffAttendanceDays, recordStaffAttendanceEvent } from '@/lib/staff-attendance';

/** GET: admin, or the staff member viewing their own history (self-service "when did I actually
 * check in/out" read) -- same admin-or-self pattern as the other Staff Card sections. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }
  if (staff.role !== 'admin' && String(staff.adminUserId) !== String(adminUserId)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const history = await getAttendanceHistoryForStaff(adminUserId);
    const openDays = findOpenStaffAttendanceDays(history);
    return NextResponse.json({ ok: true, history, openDays });
  } catch (err) {
    console.error('[api/admin/staff/:id/attendance] failed to load', err);
    return NextResponse.json({ error: 'Could not load attendance.' }, { status: 500 });
  }
}

/** Manual correction (a missed check-in/out, backdated) -- admin-only, unlike the equivalent
 * child route: attendance here is payroll-adjacent, so it's stricter than "any logged-in staff"
 * even though the underlying DELETE for a child's attendance entry doesn't itself check role. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await requireAdmin();
  const { id: idParam } = await params;
  const adminUserId = Number(idParam);
  if (!Number.isInteger(adminUserId)) {
    return NextResponse.json({ error: 'Invalid staff id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = staffAttendanceCorrectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid correction.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const event = await recordStaffAttendanceEvent({
      adminUserId,
      eventType: d.eventType,
      source: 'admin',
      performedByAdminId: staff.adminUserId,
      occurredAt: d.occurredAt,
    });
    return NextResponse.json({ ok: true, event });
  } catch (err) {
    console.error('[api/admin/staff/:id/attendance] failed to add correction', err);
    return NextResponse.json({ error: 'Could not save the correction.' }, { status: 500 });
  }
}
