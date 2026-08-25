import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { publishLesson } from '@/lib/curriculum';
import { updateCurriculumLessonSchema } from '@/lib/validation';

interface LessonLookupRow {
  class_name: string;
  title: string;
  objectives: string | null;
  worksheet_url: string | null;
  worksheet_title: string | null;
  video_url: string | null;
  video_title: string | null;
  equipment_note: string | null;
}

async function loadLesson(id: number): Promise<LessonLookupRow | null> {
  const rows = (await sql`
    SELECT ct.class_name, l.title, l.objectives, l.worksheet_url, l.worksheet_title,
           l.video_url, l.video_title, l.equipment_note
    FROM curriculum_unit_lessons l
    JOIN curriculum_term_units u ON u.id = l.unit_id
    JOIN curriculum_terms ct ON ct.id = u.term_id
    WHERE l.id = ${id}
  `) as unknown as LessonLookupRow[];
  return rows[0] ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateCurriculumLessonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const existing = await loadLesson(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const merged = {
      title: d.title ?? existing.title,
      objectives: d.objectives !== undefined ? d.objectives : existing.objectives,
      worksheetUrl: d.worksheetUrl !== undefined ? d.worksheetUrl : existing.worksheet_url,
      worksheetTitle: d.worksheetTitle !== undefined ? d.worksheetTitle : existing.worksheet_title,
      videoUrl: d.videoUrl !== undefined ? d.videoUrl : existing.video_url,
      videoTitle: d.videoTitle !== undefined ? d.videoTitle : existing.video_title,
      equipmentNote: d.equipmentNote !== undefined ? d.equipmentNote : existing.equipment_note,
    };
    await sql`
      UPDATE curriculum_unit_lessons SET
        title = ${merged.title}, objectives = ${merged.objectives},
        worksheet_url = ${merged.worksheetUrl}, worksheet_title = ${merged.worksheetTitle},
        video_url = ${merged.videoUrl}, video_title = ${merged.videoTitle}, equipment_note = ${merged.equipmentNote}
      WHERE id = ${id}
    `;
    if (d.reviewStatus === 'published') {
      await publishLesson(id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/lessons/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update lesson.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid lesson id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await loadLesson(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await sql`DELETE FROM curriculum_unit_lessons WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/lessons/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete lesson.' }, { status: 500 });
  }
}
