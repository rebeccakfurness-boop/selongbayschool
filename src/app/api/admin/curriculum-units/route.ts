import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { upsertCurriculumUnitSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const staff = await getCurrentStaff();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = upsertCurriculumUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid curriculum unit.' }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await canAccessClass(staff, d.className))) {
    return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
  }

  try {
    await ensureSchema();
    // Only one "current" unit makes sense per class at a time.
    await sql`UPDATE curriculum_units SET is_current = false WHERE class_name = ${d.className} AND is_current = true`;
    const rows = await sql`
      INSERT INTO curriculum_units (class_name, term_label, unit_title, description, is_current)
      VALUES (${d.className}, ${d.termLabel}, ${d.unitTitle}, ${d.description ?? null}, true)
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/curriculum-units] failed to create', err);
    return NextResponse.json({ error: 'Could not save curriculum unit.' }, { status: 500 });
  }
}
