import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { updateCurriculumUnitSchema } from '@/lib/validation';

interface UnitLookupRow {
  class_name: string;
  title: string;
  description: string | null;
}

async function loadUnit(id: number): Promise<UnitLookupRow | null> {
  const rows = (await sql`
    SELECT ct.class_name, u.title, u.description FROM curriculum_term_units u
    JOIN curriculum_terms ct ON ct.id = u.term_id
    WHERE u.id = ${id}
  `) as unknown as UnitLookupRow[];
  return rows[0] ?? null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid unit id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const parsed = updateCurriculumUnitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid update.' }, { status: 400 });
  }
  const d = parsed.data;

  try {
    await ensureSchema();
    const existing = await loadUnit(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    const title = d.title ?? existing.title;
    const description = d.description !== undefined ? d.description : existing.description;
    await sql`UPDATE curriculum_term_units SET title = ${title}, description = ${description} WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/units/:id] failed to update', err);
    return NextResponse.json({ error: 'Could not update unit.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid unit id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const existing = await loadUnit(id);
    if (existing === null) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, existing.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await sql`DELETE FROM curriculum_term_units WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/units/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete unit.' }, { status: 500 });
  }
}
