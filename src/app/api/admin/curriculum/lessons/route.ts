import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createCurriculumLessonSchema } from '@/lib/validation';
import { z } from 'zod';

const bodySchema = createCurriculumLessonSchema.extend({ unitId: z.coerce.number().int().positive() });

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid lesson.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const unitRows = await sql`
      SELECT ct.class_name FROM curriculum_term_units u
      JOIN curriculum_terms ct ON ct.id = u.term_id
      WHERE u.id = ${d.unitId}
    `;
    if (unitRows.length === 0) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, unitRows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const [{ next_order }] = (await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM curriculum_unit_lessons WHERE unit_id = ${d.unitId}
    `) as unknown as { next_order: number }[];

    const rows = await sql`
      INSERT INTO curriculum_unit_lessons (unit_id, sort_order, title, objectives)
      VALUES (${d.unitId}, ${next_order}, ${d.title}, ${d.objectives || null})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id, sortOrder: next_order });
  } catch (err) {
    console.error('[api/admin/curriculum/lessons] failed to create', err);
    return NextResponse.json({ error: 'Could not create lesson.' }, { status: 500 });
  }
}
