import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireSeranganAdminApi } from '@/lib/current-serangan';
import { deleteDonation } from '@/lib/serangan';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSeranganAdminApi();
  } catch {
    return NextResponse.json({ error: 'Not authorized to remove donations.' }, { status: 403 });
  }
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid donation id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteDonation(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/donations/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that donation.' }, { status: 500 });
  }
}
