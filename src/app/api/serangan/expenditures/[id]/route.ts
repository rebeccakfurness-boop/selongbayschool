import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { deleteExpenditure } from '@/lib/serangan';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid expenditure id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteExpenditure(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/serangan/expenditures/:id] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that expenditure.' }, { status: 500 });
  }
}
