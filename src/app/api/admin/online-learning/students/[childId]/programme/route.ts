import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { assignChildOnlineTerm, getChildForOnlineLearningAccessCheck } from '@/lib/online-learning';

/** Adds one curriculum_terms row to a student's individual online programme -- deliberately not
 * checked against the child's own class_name (see the schema comment on child_online_programme_
 * terms in db.ts): an online student can be assigned a different class's or subject's programme
 * entirely, e.g. working ahead or catching up. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
  const staff = await getCurrentStaff();
  const { childId: idParam } = await params;
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
  const termId = Number((body as { termId?: unknown })?.termId);
  if (!Number.isInteger(termId)) {
    return NextResponse.json({ error: 'Invalid programme.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    await assignChildOnlineTerm(childId, termId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/programme] failed to add', err);
    return NextResponse.json({ error: 'Could not add that programme.' }, { status: 500 });
  }
}
