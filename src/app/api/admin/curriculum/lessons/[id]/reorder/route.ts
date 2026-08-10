import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { reorderSchema } from '@/lib/validation';

interface LessonRow {
  id: number;
  unit_id: number;
  sort_order: number;
  class_name: string;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid direction.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      SELECT l.id, l.unit_id, l.sort_order, ct.class_name
      FROM curriculum_unit_lessons l
      JOIN curriculum_term_units u ON u.id = l.unit_id
      JOIN curriculum_terms ct ON ct.id = u.term_id
      WHERE l.id = ${id}
    `) as unknown as LessonRow[];
    const current = rows[0];
    if (!current) {
      return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, current.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const neighborRows = (
      parsed.data.direction === 'up'
        ? await sql`
            SELECT id, sort_order FROM curriculum_unit_lessons
            WHERE unit_id = ${current.unit_id} AND sort_order < ${current.sort_order}
            ORDER BY sort_order DESC LIMIT 1
          `
        : await sql`
            SELECT id, sort_order FROM curriculum_unit_lessons
            WHERE unit_id = ${current.unit_id} AND sort_order > ${current.sort_order}
            ORDER BY sort_order ASC LIMIT 1
          `
    ) as unknown as { id: number; sort_order: number }[];
    const neighbor = neighborRows[0];
    if (!neighbor) {
      return NextResponse.json({ ok: true });
    }

    await sql`UPDATE curriculum_unit_lessons SET sort_order = ${neighbor.sort_order} WHERE id = ${current.id}`;
    await sql`UPDATE curriculum_unit_lessons SET sort_order = ${current.sort_order} WHERE id = ${neighbor.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/lessons/:id/reorder] failed', err);
    return NextResponse.json({ error: 'Could not reorder lesson.' }, { status: 500 });
  }
}
