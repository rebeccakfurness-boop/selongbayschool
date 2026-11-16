import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { deleteDonation } from '@/lib/serangan';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
