import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { removeCcaPriceOverride } from '@/lib/cca';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid override id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await removeCcaPriceOverride(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/cca/price-overrides/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove override.' }, { status: 500 });
  }
}
