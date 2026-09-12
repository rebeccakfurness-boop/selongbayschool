import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/current-staff';
import { chargeLateFee, LateFeeError } from '@/lib/library';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const loanId = Number(id);
  if (!Number.isInteger(loanId)) {
    return NextResponse.json({ error: 'Invalid loan id.' }, { status: 400 });
  }

  try {
    const invoiceId = await chargeLateFee(loanId);
    return NextResponse.json({ ok: true, invoiceId });
  } catch (err) {
    if (err instanceof LateFeeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[api/admin/library/loans/:id/charge-fee] failed', err);
    return NextResponse.json({ error: 'Could not charge this late fee.' }, { status: 500 });
  }
}
