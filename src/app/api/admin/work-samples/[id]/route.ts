import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid work sample id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      SELECT c.class_name FROM work_samples w JOIN children c ON c.id = w.child_id WHERE w.id = ${id}
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Work sample not found.' }, { status: 404 });
    }
    if (!(await canAccessClass(staff, rows[0].class_name as string))) {
      return NextResponse.json({ error: 'You are not assigned to this child’s class.' }, { status: 403 });
    }
    await sql`DELETE FROM work_samples WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/work-samples/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete work sample.' }, { status: 500 });
  }
}
