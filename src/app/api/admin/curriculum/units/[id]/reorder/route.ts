import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';
import { reorderSchema } from '@/lib/validation';

interface UnitRow {
  id: number;
  term_id: number;
  sort_order: number;
  class_name: string;
}

/** Swaps this unit's sort_order with its neighbour in the requested direction — simple up/down
 * reordering rather than drag-and-drop, matching the same "forms over drag targets" choice already
 * made for the Weekly Schedule's admin editor. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid direction.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = (await sql`
      SELECT u.id, u.term_id, u.sort_order, ct.class_name
      FROM curriculum_term_units u JOIN curriculum_terms ct ON ct.id = u.term_id
      WHERE u.id = ${id}
    `) as unknown as UnitRow[];
    const current = rows[0];
    if (!current) {
      return NextResponse.json({ error: 'Unit not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, current.class_name))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }

    // The neon `sql` tagged template has no fragment-composition escape hatch, and an operator
    // (< vs >) or sort direction can't be passed as a bound parameter either way — hence the
    // full branch rather than trying to interpolate either into one query.
    const neighborRows = (
      parsed.data.direction === 'up'
        ? await sql`
            SELECT id, sort_order FROM curriculum_term_units
            WHERE term_id = ${current.term_id} AND sort_order < ${current.sort_order}
            ORDER BY sort_order DESC LIMIT 1
          `
        : await sql`
            SELECT id, sort_order FROM curriculum_term_units
            WHERE term_id = ${current.term_id} AND sort_order > ${current.sort_order}
            ORDER BY sort_order ASC LIMIT 1
          `
    ) as unknown as { id: number; sort_order: number }[];
    const neighbor = neighborRows[0];
    if (!neighbor) {
      return NextResponse.json({ ok: true }); // already at the edge — no-op, not an error
    }

    await sql`UPDATE curriculum_term_units SET sort_order = ${neighbor.sort_order} WHERE id = ${current.id}`;
    await sql`UPDATE curriculum_term_units SET sort_order = ${current.sort_order} WHERE id = ${neighbor.id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/units/:id/reorder] failed', err);
    return NextResponse.json({ error: 'Could not reorder unit.' }, { status: 500 });
  }
}
