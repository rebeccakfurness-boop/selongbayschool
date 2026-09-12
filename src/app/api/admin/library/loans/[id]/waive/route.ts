import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { waiveLateFee } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isInteger(loanId)) {
    return NextResponse.json({ error: 'Invalid loan id.' }, { status: 400 });
  }

  try {
    await waiveLateFee(loanId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/library/loans/:id/waive] failed', err);
    return NextResponse.json({ error: 'Could not waive this late fee.' }, { status: 500 });
  }
}
