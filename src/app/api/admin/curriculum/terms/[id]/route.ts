import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { getCurriculumTermTree, getProgressMapForChildren } from '@/lib/curriculum';

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
    const term = await getCurriculumTermTree(id);
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
