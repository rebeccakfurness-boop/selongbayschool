import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createCurriculumLessonResourceSchema } from '@/lib/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const lessonId = Number(idParam);
  if (!Number.isInteger(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createCurriculumLessonResourceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid resource.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const lessonRows = await sql`
      SELECT ct.class_name FROM curriculum_unit_lessons l
      JOIN curriculum_term_units u ON u.id = l.unit_id
      JOIN curriculum_terms ct ON ct.id = u.term_id
      WHERE l.id = ${lessonId}
    `;
    if (lessonRows.length === 0) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, lessonRows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO curriculum_lesson_resources (lesson_id, title, url) VALUES (${lessonId}, ${d.title}, ${d.url}) RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/curriculum/lessons/:id/resources] failed to create', err);
    return NextResponse.json({ error: 'Could not add resource.' }, { status: 500 });
  }
}
