import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff } from '@/lib/current-staff';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid policy id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`SELECT uploaded_by FROM school_policies WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Policy not found.' }, { status: 404 });
    }
    if (staff.role !== 'admin' && rows[0].uploaded_by !== staff.adminUserId) {
      return NextResponse.json({ error: 'You can only remove policies you added.' }, { status: 403 });
    }
    await sql`DELETE FROM school_policies WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/policies/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete policy.' }, { status: 500 });
  }
}
