import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { setLessonProgressSchema } from '@/lib/validation';
import { setChildLessonProgress } from '@/lib/curriculum';

export async function PATCH(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = setLessonProgressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`SELECT class_name FROM children WHERE id = ${d.childId}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Child not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, rows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await setChildLessonProgress(d.childId, d.lessonId, d.status, { adminUserId: staff.adminUserId });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/progress] failed to update', err);
    return NextResponse.json({ error: 'Could not save progress.' }, { status: 500 });
  }
}
