import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { deleteContract } from '@/lib/staff-contracts';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; contractId: string }> }) {
  await requireAdmin();
  const { contractId: contractIdParam } = await params;
  const contractId = Number(contractIdParam);
  if (!Number.isInteger(contractId)) {
    return NextResponse.json({ error: 'Invalid contract id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deleteContract(contractId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/contracts/:contractId] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that contract.' }, { status: 500 });
  }
}
