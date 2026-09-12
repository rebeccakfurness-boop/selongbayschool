import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { deleteChildOnlineScheduleSlot, getChildForOnlineLearningAccessCheck, getChildIdForOnlineScheduleSlot } from '@/lib/online-learning';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ childId: string; slotId: string }> }) {
  const staff = await getCurrentStaff();
  const { childId: childIdParam, slotId: slotIdParam } = await params;
  const childId = Number(childIdParam);
  const slotId = Number(slotIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(slotId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    const slotChildId = await getChildIdForOnlineScheduleSlot(slotId);
    if (slotChildId !== childId) {
      return NextResponse.json({ error: 'Slot not found.' }, { status: 404 });
    }

    await deleteChildOnlineScheduleSlot(slotId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/schedule/:slotId] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that slot.' }, { status: 500 });
  }
}
