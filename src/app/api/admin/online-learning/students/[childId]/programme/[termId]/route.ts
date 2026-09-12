import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { removeChildOnlineTerm, getChildForOnlineLearningAccessCheck } from '@/lib/online-learning';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ childId: string; termId: string }> }) {
  const staff = await getCurrentStaff();
  const { childId: childIdParam, termId: termIdParam } = await params;
  const childId = Number(childIdParam);
  const termId = Number(termIdParam);
  if (!Number.isInteger(childId) || !Number.isInteger(termId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    await removeChildOnlineTerm(childId, termId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/programme/:termId] failed to remove', err);
    return NextResponse.json({ error: 'Could not remove that programme.' }, { status: 500 });
  }
}
