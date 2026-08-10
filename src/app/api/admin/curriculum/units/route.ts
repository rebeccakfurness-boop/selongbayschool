import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createCurriculumUnitSchema } from '@/lib/validation';
import { z } from 'zod';

const bodySchema = createCurriculumUnitSchema.extend({ termId: z.coerce.number().int().positive() });

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
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid unit.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const termRows = await sql`SELECT class_name FROM curriculum_terms WHERE id = ${d.termId}`;
    if (termRows.length === 0) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, termRows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const [{ next_order }] = (await sql`
      SELECT COALESCE(MAX(sort_order), 0) + 1 AS next_order FROM curriculum_term_units WHERE term_id = ${d.termId}
    `) as unknown as { next_order: number }[];

    const rows = await sql`
      INSERT INTO curriculum_term_units (term_id, sort_order, title, description)
      VALUES (${d.termId}, ${next_order}, ${d.title}, ${d.description || null})
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id, sortOrder: next_order });
  } catch (err) {
    console.error('[api/admin/curriculum/units] failed to create', err);
    return NextResponse.json({ error: 'Could not create unit.' }, { status: 500 });
  }
}
