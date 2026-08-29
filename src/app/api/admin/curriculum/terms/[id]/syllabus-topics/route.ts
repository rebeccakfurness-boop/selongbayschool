import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { createSyllabusTopicSchema } from '@/lib/validation';

/** Manual add-a-topic path for the Syllabus Map view -- most terms get their topic tree from
 * generateCurriculumTerm() persisting the parsed syllabus (see generate.ts), but a hand-authored
 * term (no generation run yet) still needs somewhere to record what the syllabus covers. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const termId = Number(idParam);
  if (!Number.isInteger(termId)) {
    return NextResponse.json({ error: 'Invalid term id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createSyllabusTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid topic.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const termRows = await sql`SELECT class_name FROM curriculum_terms WHERE id = ${termId}`;
    if (termRows.length === 0) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, termRows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const rows = await sql`
      INSERT INTO curriculum_syllabus_topics (term_id, ref, parent_ref, title, sort_order)
      VALUES (${termId}, ${d.ref}, ${d.parentRef ?? null}, ${d.title}, ${d.sortOrder ?? 0})
      ON CONFLICT (term_id, ref) DO UPDATE SET parent_ref = EXCLUDED.parent_ref, title = EXCLUDED.title
      RETURNING id
    `;
    return NextResponse.json({ id: rows[0].id });
  } catch (err) {
    console.error('[api/admin/curriculum/terms/:id/syllabus-topics] failed to create', err);
    return NextResponse.json({ error: 'Could not save topic.' }, { status: 500 });
  }
}
