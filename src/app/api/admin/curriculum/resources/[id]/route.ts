import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid resource id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT ct.class_name FROM curriculum_lesson_resources r
      JOIN curriculum_unit_lessons l ON l.id = r.lesson_id
      JOIN curriculum_term_units u ON u.id = l.unit_id
      JOIN curriculum_terms ct ON ct.id = u.term_id
      WHERE r.id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Resource not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, rows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to that class.' }, { status: 403 });
    }
    await sql`DELETE FROM curriculum_lesson_resources WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/curriculum/resources/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete resource.' }, { status: 500 });
  }
}
