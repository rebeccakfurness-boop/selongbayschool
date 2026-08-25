import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass, requireAdmin } from '@/lib/current-staff';
import { getCurriculumTermTree, getProgressMapForChildren } from '@/lib/curriculum';
import { createCurriculumTermSchema } from '@/lib/validation';

/** Backs the authoring page's programme picker — fetches one programme's full tree once
 * selected, rather than the server loading every programme's units/lessons up front. Also
 * returns every one of the class's children's progress, so the "class progress" list on each
 * lesson doesn't need a round trip per child. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid term id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const term = await getCurriculumTermTree(id, true);
    if (!term) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, term.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    const childRows = (await sql`
      SELECT id FROM children WHERE class_name = ${term.class_name}
    `) as unknown as { id: number }[];
    const progressByChild = await getProgressMapForChildren(childRows.map((r) => r.id));
    const progress = [...progressByChild.entries()].map(([childId, m]) => [childId, [...m.entries()]] as const);

    return NextResponse.json({ term, progress });
  } catch (err) {
    console.error('[api/admin/curriculum/terms/:id] failed to load', err);
    return NextResponse.json({ error: 'Could not load programme.' }, { status: 500 });
  }
}

/** Admin-only: fixes a programme's class/subject/term/framework labels in place, without deleting
 * and recreating (and losing) its units and lessons. Exists mainly to fix a programme whose class
 * doesn't match any current child's class_name — class_name is free text, not a foreign key, so a
 * typo or an imported draft using a different label than the school's real class names otherwise
 * makes the programme invisible to every teacher with no way to correct it from the UI. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid term id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = createCurriculumTermSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid programme.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE curriculum_terms
      SET class_name = ${d.className}, subject = ${d.subject}, term_label = ${d.termLabel}, framework_label = ${d.frameworkLabel || null}
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/terms/:id] failed to update', err);
    if (err instanceof Error && err.message.includes('curriculum_terms_class_name_subject_term_label_key')) {
      return NextResponse.json({ error: 'A programme for this class, subject, and term already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Could not update programme.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid term id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`SELECT class_name FROM curriculum_terms WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Programme not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, rows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await sql`DELETE FROM curriculum_terms WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/terms/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete programme.' }, { status: 500 });
  }
}
