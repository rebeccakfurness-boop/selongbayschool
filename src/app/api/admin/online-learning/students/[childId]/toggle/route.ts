import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getChildForOnlineLearningAccessCheck } from '@/lib/online-learning';

/** Flips children.online_learning_enabled for one student -- the entry point a teacher (not just
 * an admin) uses, unlike the general Child Card PATCH (/api/admin/children/:id), which stays
 * admin-only. Same canAccessClass gate as the rest of this section: a teacher can only turn this
 * on/off for a student in one of their own assigned classes. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ childId: string }> }) {
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
  const enabled = (body as { enabled?: unknown })?.enabled;
  if (typeof enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be true or false.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const child = await getChildForOnlineLearningAccessCheck(childId);
    if (!child) return NextResponse.json({ error: 'Student not found.' }, { status: 404 });
    if (!(await canAccessClass(staff, child.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    await sql`UPDATE children SET online_learning_enabled = ${enabled}, updated_at = now() WHERE id = ${childId}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/online-learning/students/:childId/toggle] failed', err);
    return NextResponse.json({ error: 'Could not save that change.' }, { status: 500 });
  }
}
