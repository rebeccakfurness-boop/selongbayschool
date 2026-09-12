import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { deleteDutyEntry } from '@/lib/duty-roster';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid duty id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteDutyEntry(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/duty-roster/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that duty.' }, { status: 500 });
  }
}
