import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { regenerateScheduleOccurrences } from '@/lib/academic-calendar';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid term id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await sql`DELETE FROM academic_terms WHERE id = ${id}`;
    await regenerateScheduleOccurrences();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/academic-terms/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not delete term.' }, { status: 500 });
  }
}
