import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { renderToBuffer } from '@react-pdf/renderer';
import { ensureSchema, sql } from '@/lib/db';
import { requireAdmin } from '@/lib/current-staff';
import { sendInvoiceEmail } from '@/lib/email';
import { InvoiceDocument, type InvoiceData, type InvoiceLineItemData, type SchoolSettingsData } from '@/lib/pdf/InvoiceDocument';

const bodySchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email address') });

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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid email.' }, { status: 400 });
  }

  try {
    await ensureSchema();
    const invoices = (await sql`SELECT * FROM invoices WHERE id = ${id}`) as unknown as InvoiceData[];
    const invoice = invoices[0];
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
    }

    const lineItems = (await sql`
      SELECT child_id, description, quantity, unit_price, line_total FROM invoice_line_items
      WHERE invoice_id = ${id} ORDER BY child_id, sort_order
    `) as unknown as InvoiceLineItemData[];
    const [settings] = (await sql`SELECT * FROM school_settings WHERE id = 1`) as unknown as SchoolSettingsData[];

    const pdfBuffer = await renderToBuffer(InvoiceDocument({ invoice, lineItems, settings }));

    const sent = await sendInvoiceEmail({
      toEmail: parsed.data.email,
      billedToName: invoice.billed_to_name,
      invoiceNumber: invoice.invoice_number,
      invoiceType: invoice.invoice_type,
      totalAmount: invoice.total_amount,
      currency: invoice.currency,
      dueDate: invoice.due_date,
      pdfBuffer,
    });

    if (!sent) {
      return NextResponse.json({ error: 'Email could not be sent (check BREVO_API_KEY is set).' }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/admin/invoices/:id/send] failed', err);
    return NextResponse.json(
      { error: `Could not send invoice: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
