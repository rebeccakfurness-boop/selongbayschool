import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { getPayslipWithStaffContact } from '@/lib/staff-hr';
import { sendPayslipEmail } from '@/lib/email';

/** Admin-only "Email to staff member" action -- unlike the DOB-gated download route, this never
 * fetches the PDF through a redirect the client follows; it downloads the already-generated blob
 * server-side and attaches it directly, same pattern as sendInvoiceEmail/sendLearningProfileEmail.
 * No @react-pdf/renderer call happens here (the PDF was already rendered at generation time), so
 * this is safe to live in the App Router unlike the generate route. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; payslipId: string }> }) {
  await requireAdmin();
  const { id: idParam, payslipId: payslipIdParam } = await params;
  const adminUserId = Number(idParam);
  const payslipId = Number(payslipIdParam);
  if (!Number.isInteger(adminUserId) || !Number.isInteger(payslipId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const payslip = await getPayslipWithStaffContact(payslipId);
    if (!payslip || String(payslip.admin_user_id) !== String(adminUserId)) {
      return NextResponse.json({ error: 'Payslip not found.' }, { status: 404 });
    }

    const fileRes = await fetch(payslip.file_url);
    if (!fileRes.ok) {
      throw new Error(`Could not fetch the stored PDF (HTTP ${fileRes.status}).`);
    }
    const pdfBuffer = Buffer.from(await fileRes.arrayBuffer());

    const sent = await sendPayslipEmail({
      toEmail: payslip.email,
      staffName: payslip.display_name ?? payslip.email,
      periodLabel: payslip.period_label,
      pdfBuffer,
    });
    if (!sent) {
      return NextResponse.json({ error: 'Could not send that email — check the email server settings.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, email: payslip.email });
  } catch (err) {
    console.error('[api/admin/staff/:id/payslips/:payslipId/send] failed', err);
    return NextResponse.json({ error: `Could not send that payslip: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 });
  }
}
