import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { deletePayslip } from '@/lib/staff-hr';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; payslipId: string }> }) {
  await requireAdmin();
  const { payslipId: payslipIdParam } = await params;
  const payslipId = Number(payslipIdParam);
  if (!Number.isInteger(payslipId)) {
    return NextResponse.json({ error: 'Invalid payslip id.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    await deletePayslip(payslipId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips/:payslipId] failed to delete', err);
    return NextResponse.json({ error: 'Could not remove that payslip.' }, { status: 500 });
  }
}
