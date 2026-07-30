import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { getCurrentStaff, canAccessClass } from '@/lib/current-staff';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid photo id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`SELECT class_name, uploaded_by FROM photo_feed_items WHERE id = ${id}`;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found.' }, { status: 404 });
    }
    const item = rows[0] as { class_name: string | null; uploaded_by: number | null };
    const isOwnUpload = item.uploaded_by === staff.adminUserId;
    if (!isOwnUpload && !(await canAccessClass(staff, item.class_name))) {
      return NextResponse.json({ error: 'You cannot remove this photo.' }, { status: 403 });
    }
    await sql`DELETE FROM photo_feed_items WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/photo-feed/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete photo.' }, { status: 500 });
  }
}
