import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { attachInvoiceProofOfPaymentSchema } from '@/lib/validation';

/** Separate from the status-only PATCH on /api/admin/invoices/[id] -- attaching proof of payment
 * (an uploaded photo's blob URL, or a pasted Google Drive link; either way just a URL by the time
 * it gets here) is independent of whether the invoice has been marked paid yet, since a parent's
 * proof often arrives before an admin gets to click "Mark as Paid". */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: 'Invalid invoice id.' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const parsed = attachInvoiceProofOfPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid proof of payment.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const rows = await sql`
      UPDATE invoices SET proof_of_payment_url = ${parsed.data.proofOfPaymentUrl}
      WHERE id = ${id}
      RETURNING id
    `;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id/proof-of-payment] failed to update', err);
    return NextResponse.json({ error: 'Could not save proof of payment.' }, { status: 500 });
  }
}
