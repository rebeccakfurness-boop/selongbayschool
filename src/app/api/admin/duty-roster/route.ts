import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, requireAdmin } from '@/lib/current-staff';
import { dutyRosterEntrySchema, firstIssueMessage } from '@/lib/validation';
import { getDutyRosterAll, getDutyRosterForStaff, addDutyEntry } from '@/lib/duty-roster';

/** GET: admin sees the whole school's roster (for the editor grid); a teacher/staff member gets
 * only their own duties (used by "My Roster" — the class_schedule half of that merged view comes
 * from a separate call). POST: admin-only -- the roster is assigned by HR, not self-service. */
export async function GET() {
  const staff = await getCurrentStaff();
  try {
    await ensureSchema();
    if (staff.role === 'admin') {
      const entries = await getDutyRosterAll();
      return NextResponse.json({ entries });
    }
    const entries = await getDutyRosterForStaff(staff.adminUserId);
    return NextResponse.json({ entries });
  } catch (err) {
    console.error('[api/admin/duty-roster] failed to load', err);
    return NextResponse.json({ error: 'Could not load the duty roster.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  await requireAdmin();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = dutyRosterEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstIssueMessage(parsed.error, 'Invalid duty entry.') }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const id = await addDutyEntry({
      adminUserId: d.adminUserId,
      dutyType: d.dutyType,
      dayOfWeek: d.dayOfWeek,
      startTime: d.startTime,
      endTime: d.endTime,
      label: d.label ?? null,
      location: d.location ?? null,
    });
    return NextResponse.json({ id });
  } catch (err) {
    console.error('[api/admin/duty-roster] failed to create', err);
    return NextResponse.json({ error: 'Could not add that duty.' }, { status: 500 });
  }
}
