import { NextRequest, NextResponse } from 'next/server';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { sendInvoiceRemittanceSchema } from '@/lib/validation';
import { sendInvoiceRemittanceEmail } from '@/lib/email';

/** Manual-only, unlike the invoice PDF itself which just needs "Send to parent" -- this
 * deliberately doesn't render anything with @react-pdf/renderer, so (unlike
 * /pages/api/admin/invoices/[id]/send.ts and /pages/api/invoices/[id]/pdf.ts) it can live under
 * the App Router like the rest of this invoice's routes. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const parsed = sendInvoiceRemittanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email address.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const invoices = await sql`
      SELECT invoice_number, invoice_type, billed_to_name, total_amount, currency, status, paid_at
      FROM invoices WHERE id = ${id}
    `;
    const invoice = invoices[0] as
      | {
          invoice_number: number;
          invoice_type: 'tuition' | 'activity' | 'lunch' | 'library';
          billed_to_name: string;
          total_amount: number;
          currency: string;
          status: string;
          paid_at: string | null;
        }
      | undefined;
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }
    if (invoice.status !== 'paid') {
      return NextResponse.json({ error: 'Mark the invoice as paid before sending a remittance note.' }, { status: 400 });
    }

    const paidAtLabel = new Date(invoice.paid_at ?? Date.now()).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const sent = await sendInvoiceRemittanceEmail({
      toEmail: parsed.data.email,
      billedToName: invoice.billed_to_name,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      totalAmount: invoice.total_amount,
      currency: invoice.currency,
      paidAtLabel,
    });
    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' }, { status: 502 });
    }

    await sql`UPDATE invoices SET remittance_sent_at = now() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id/send-remittance] failed', err);
    return NextResponse.json({ error: 'Could not send remittance note.' }, { status: 500 });
  }
}
