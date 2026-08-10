import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';

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
