import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { upsertLessonPlanSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = upsertLessonPlanSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid lesson plan.' }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await canAccessClass(staff, d.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      INSERT INTO lesson_plans (class_name, week_label, subject, title, description, teacher_id)
      VALUES (${d.className}, ${d.weekLabel}, ${d.subject ?? null}, ${d.title}, ${d.description ?? null}, ${staff.adminUserId})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/lesson-plans] failed to create', err);
    return NextResponse.json({ error: 'Could not create lesson plan.' }, { status: 500 });
  }
}
