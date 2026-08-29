import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { updateSyllabusTopicSchema } from '@/lib/validation';
import { setSyllabusTopicKnown } from '@/lib/curriculum';

/** Toggles the "already known" flag on one syllabus subtopic from the Syllabus Map view -- the
 * only thing this route changes; ref/title/parent_ref are set once at creation (via the term-scoped
 * POST route or generation) and not editable here. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid topic id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateSyllabusTopicSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT ct.class_name FROM curriculum_syllabus_topics t
      JOIN curriculum_terms ct ON ct.id = t.term_id
      WHERE t.id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Topic not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, rows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await setSyllabusTopicKnown(id, parsed.data.known);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/syllabus-topics/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update topic.' }, { status: 500 });
  }
}
